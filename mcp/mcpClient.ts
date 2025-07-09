import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess, execSync } from 'child_process';
import { MCPConnection, MCPServerConfig, MCPTool, MCPServerStatus } from './types';
import { MCPSecurityManager } from './securityManager';

export class MCPClient {
  private connections: Map<string, MCPConnection> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private securityManager: MCPSecurityManager;

  constructor(securityManager?: MCPSecurityManager) {
    this.securityManager = securityManager || new MCPSecurityManager();
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(config: MCPServerConfig): Promise<void> {
    if (!config.enabled) {
      throw new Error(`Server ${config.name} is not enabled`);
    }

    console.log("Connecting to server: ", config);

    // Security validation
    const securityValidation = this.securityManager.validateServerConfig(config);
    if (!securityValidation.valid) {
      throw new Error(`Security validation failed for server ${config.name}: ${securityValidation.errors.join(', ')}`);
    }

    if (securityValidation.warnings.length > 0) {
      console.warn(`Security warnings for server ${config.name}:`, securityValidation.warnings);
    }

    // Check if this is a placeholder configuration (not a real MCP server)
    if (this.isPlaceholderServer(config)) {
      throw new Error(`Server ${config.name} is not properly configured. Please follow the installation instructions to set up a real MCP server.`);
    }

    // Try to resolve the command path if it's not already a full path
    let resolvedCommand = config.command;
    if (!config.command.includes('/') && !config.command.includes('\\')) {
      try {
        const resolved = execSync(`which ${config.command}`, { encoding: 'utf8' }).trim();
        if (resolved) {
          console.log(`Resolved command '${config.command}' to: ${resolved}`);
          resolvedCommand = resolved;
        }
      } catch (error) {
        console.log(`Could not resolve command '${config.command}', using as-is`);
      }
    }

    try {
      // Log the PATH for debugging ENOENT errors
      console.log('PATH seen by plugin:', process.env.PATH);
      console.log('Attempting to spawn command:', resolvedCommand, 'with args:', config.args);
      
      // Start the server process with security constraints
      const serverProcess = spawn(resolvedCommand, config.args || [], {
        cwd: config.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.getSecureEnvironment(),
        // Add security constraints
        ...(config.security?.sandboxed && {
          // Note: In a real implementation, you might want to use proper sandboxing
          // This is a basic example - consider using tools like Docker or similar
        })
      });

      // Handle process errors immediately
      serverProcess.on('error', (error: Error) => {
        if (error.message.includes('ENOENT')) {
          console.error(`Command not found: ${config.command}`);
          console.error('This usually means the command is not installed or not in PATH');
          console.error('Available PATH directories:', process.env.PATH?.split(':'));
          
          // Provide helpful error message
          const helpfulError = new Error(
            `Command '${config.command}' not found. Please ensure it is installed and available in your PATH. ` +
            `For MCP servers, you may need to install them using: ` +
            `npm install -g @modelcontextprotocol/server-time or pip install mcp-server-time`
          );
          this.handleServerError(config.name, helpfulError);
        } else {
          this.handleServerError(config.name, error);
        }
      });

      // Create transport and client
      const transport = new StdioClientTransport({
        command: resolvedCommand,
        args: config.args || [],
        env: Object.fromEntries(
          Object.entries(process.env).filter(([_, value]) => value !== undefined)
        ) as Record<string, string>,
        stderr: 'inherit'
      });
      
      const client = new Client({
        name: 'tangent-mcp-client',
        version: '1.0.0'
      });

      // Connect to the transport
      await client.connect(transport);

      // List available tools
      const tools = await this.listToolsFromServer(client, config.name);
      console.log(`[MCPClient] connectToServer: tools discovered for server '${config.name}':`, tools);

      // Create connection
      const connection: MCPConnection = {
        serverName: config.name,
        client,
        status: {
          name: config.name,
          status: 'running',
          startTime: new Date(),
          tools
        }
      };

      this.connections.set(config.name, connection);
      this.processes.set(config.name, serverProcess);

      // Handle process events
      serverProcess.on('error', (error: Error) => {
        this.handleServerError(config.name, error);
      });

      serverProcess.on('exit', (code: number | null) => {
        this.handleServerExit(config.name, code);
      });

      console.log(`Connected to MCP server: ${config.name}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      // Log the full error object for debugging
      if (error instanceof Error) {
        console.error('Full error object:', error);
      } else {
        console.error('Non-Error thrown:', error);
      }
      throw error;
    }
  }

  /**
   * Check if a server configuration is a placeholder (not a real MCP server)
   */
  private isPlaceholderServer(config: MCPServerConfig): boolean {
    // Check for placeholder commands that are not real MCP servers
    const placeholderCommands = ['echo', 'cat', 'printf'];
    return placeholderCommands.includes(config.command);
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectFromServer(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    const process = this.processes.get(serverName);

    if (connection) {
      try {
        await connection.client.close();
      } catch (error) {
        console.error(`Error closing client for server ${serverName}:`, error);
      }
      this.connections.delete(serverName);
    }

    if (process) {
      process.kill();
      this.processes.delete(serverName);
    }

    console.log(`Disconnected from MCP server: ${serverName}`);
  }

  /**
   * List tools from a specific server, with retry logic
   */
  async listToolsFromServer(client: Client, serverName: string, retries = 3): Promise<MCPTool[]> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await client.listTools();
        const tools = result.tools || [];
        console.log(`[MCPClient] listToolsFromServer: tools from server '${serverName}':`, tools);
        return tools.map((tool: any) => ({
          id: `${serverName}:${tool.name}`,
          serverName,
          toolName: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema,
          annotations: tool.annotations
        }));
      } catch (error) {
        if (attempt < retries - 1) {
          await new Promise(res => setTimeout(res, 500)); // wait 500ms before retry
          console.warn(`[MCPClient] listToolsFromServer: attempt ${attempt + 1} failed for server '${serverName}', retrying...`, error);
        } else {
          console.error(`[MCPClient] listToolsFromServer: all attempts failed for server '${serverName}'`, error);
        }
      }
    }
    return [];
  }

  /**
   * List all available tools from all connected servers
   */
  async listAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    for (const [serverName, connection] of this.connections) {
      try {
        const tools = await this.listToolsFromServer(connection.client, serverName);
        console.log(`[MCPClient] listAllTools: tools for server '${serverName}':`, tools);
        allTools.push(...tools);
      } catch (error) {
        console.error(`[MCPClient] listAllTools: failed to list tools for server '${serverName}'`, error);
      }
    }
    console.log(`[MCPClient] listAllTools: returning all tools:`, allTools);
    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`Server ${serverName} is not connected`);
    }

    // Find the tool for security validation
    const tool = connection.status.tools?.find(t => t.toolName === toolName);
    if (tool) {
      // Security validation
      const securityValidation = this.securityManager.validateToolInput(tool, args);
      if (!securityValidation.valid) {
        throw new Error(`Security validation failed for tool ${toolName}: ${securityValidation.errors.join(', ')}`);
      }

      if (securityValidation.warnings.length > 0) {
        console.warn(`Security warnings for tool ${toolName}:`, securityValidation.warnings);
      }
    }

    try {
      const result = await connection.client.callTool({
        name: toolName,
        arguments: args
      });

      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on server ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getServerStatus(serverName: string): MCPServerStatus | undefined {
    const connection = this.connections.get(serverName);
    return connection?.status;
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.connections.values()).map(conn => conn.status);
  }

  /**
   * Check if a server is connected
   */
  isServerConnected(serverName: string): boolean {
    return this.connections.has(serverName);
  }

  /**
   * Handle server error
   */
  private handleServerError(serverName: string, error: Error): void {
    const connection = this.connections.get(serverName);
    if (connection) {
      connection.status.status = 'error';
      connection.status.lastError = error.message;
    }
    console.error(`MCP server ${serverName} error:`, error);
  }

  /**
   * Handle server exit
   */
  private handleServerExit(serverName: string, code: number | null): void {
    const connection = this.connections.get(serverName);
    if (connection) {
      connection.status.status = 'stopped';
    }
    this.connections.delete(serverName);
    this.processes.delete(serverName);
    console.log(`MCP server ${serverName} exited with code: ${code}`);
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    const serverNames = Array.from(this.connections.keys());
    for (const serverName of serverNames) {
      await this.disconnectFromServer(serverName);
    }
  }

  /**
   * Get secure environment variables
   */
  private getSecureEnvironment(): NodeJS.ProcessEnv {
    const secureEnv: NodeJS.ProcessEnv = {};
    
    // Only allow safe environment variables
    const safeVars = [
      'PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'LC_CTYPE',
      'TMPDIR', 'TEMP', 'TMP', 'PWD'
    ];
    
    for (const varName of safeVars) {
      if (process.env[varName]) {
        secureEnv[varName] = process.env[varName];
      }
    }
    
    return secureEnv;
  }
} 