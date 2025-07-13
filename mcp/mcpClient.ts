import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Global recovery map to persist clients across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __tangent_mcp_recovery: Map<string, Client> | undefined;
}

// Initialize the global recovery map if it doesn't exist
if (typeof global.__tangent_mcp_recovery === 'undefined') {
  global.__tangent_mcp_recovery = new Map<string, Client>();
}

export type TransportType = 'stdio' | 'websocket' | 'docker';

export type EnvVarValue = string | { 
  value: string; 
  metadata: { 
    isSecret: boolean 
  } 
};

export interface MCPServerConfig {
  name: string;
  transport: TransportType;
  command?: string;
  args?: string[];
  websocketUrl?: string;
  dockerImage?: string;
  enabled: boolean;
  env?: Record<string, EnvVarValue>;
  timeout?: number;
  retryAttempts?: number;
  cwd?: string;
  stderr?: 'pipe' | 'ignore' | 'inherit';
}

export interface MCPTool {
  id: string;
  serverName: string;
  toolName: string;
  description: string;
  inputSchema: any;
}

export class MCPClient {
  private connections = new Map<string, Client>();
  private recoverAttempted = false;

  constructor() {
    this.attemptRecovery();
  }

  /**
   * Attempt to recover clients from global recovery map
   */
  private attemptRecovery(): void {
    if (!this.recoverAttempted && global.__tangent_mcp_recovery && global.__tangent_mcp_recovery.size > 0) {
      console.log(`Attempting to recover ${global.__tangent_mcp_recovery.size} clients from global recovery map`);
      
      // Copy clients from global recovery map
      global.__tangent_mcp_recovery.forEach((client, serverName) => {
        this.connections.set(serverName, client);
        console.log(`Recovered client for server: ${serverName}`);
      });
    }
    
    // Mark recovery as attempted
    this.recoverAttempted = true;
  }

  /**
   * Add a client to the global recovery map
   */
  private addToGlobalRecovery(serverName: string, client: Client): void {
    if (!global.__tangent_mcp_recovery) {
      global.__tangent_mcp_recovery = new Map<string, Client>();
    }
    
    global.__tangent_mcp_recovery.set(serverName, client);
    console.debug(`Added client for server ${serverName} to global recovery map`);
  }

  /**
   * Remove a client from the global recovery map
   */
  private removeFromGlobalRecovery(serverName: string): void {
    if (!global.__tangent_mcp_recovery) {
      return;
    }
    
    if (global.__tangent_mcp_recovery.has(serverName)) {
      global.__tangent_mcp_recovery.delete(serverName);
      console.debug(`Removed client for server ${serverName} from global recovery map`);
    }
  }

  /**
   * Validate and sanitize environment variables
   */
  private validateEnvironmentVariables(env: Record<string, EnvVarValue>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, envVar] of Object.entries(env)) {
      // Skip invalid keys
      if (!key || typeof key !== 'string' || key.trim() === '') {
        console.warn(`Skipping invalid environment variable key: ${key}`);
        continue;
      }
      
      // Handle different env var formats
      let value: string;
      if (typeof envVar === 'object' && 'value' in envVar) {
        value = (envVar as { value: string }).value;
      } else {
        value = envVar as string;
      }
      
      // Skip invalid values
      if (value === undefined || value === null) {
        console.warn(`Skipping undefined/null environment variable: ${key}`);
        continue;
      }
      
      // Ensure value is a string
      const stringValue = String(value).trim();
      if (stringValue === '') {
        console.warn(`Skipping empty environment variable: ${key}`);
        continue;
      }
      
      sanitized[key] = stringValue;
    }
    
    return sanitized;
  }

  /**
   * Normalize tool arguments to ensure we don't pass undefined values to MCP servers
   */
  private normalizeToolArguments(args: Record<string, unknown>, toolName: string): Record<string, unknown> {
    if (!args) return {};
    
    const normalizedArgs: Record<string, unknown> = {};
    
    // Process each argument
    for (const [key, value] of Object.entries(args)) {
      // Handle undefined or null values
      if (value === undefined || value === null) {
        console.debug(`Normalizing undefined/null value for parameter '${key}' in tool '${toolName}'`);
        
        // Try to infer the type from the key name
        if (key.includes('number') || key.endsWith('Count') || key.endsWith('Id') || key.endsWith('Limit')) {
          normalizedArgs[key] = 0;
          console.debug(`Using default value 0 for likely number parameter: ${key}`);
        } else if (key.includes('bool') || key.startsWith('is') || key.startsWith('has') || key.startsWith('should')) {
          normalizedArgs[key] = false;
          console.debug(`Using default value false for likely boolean parameter: ${key}`);
        } else if (key.includes('array') || key.endsWith('s') || key.endsWith('List') || key.endsWith('Items')) {
          normalizedArgs[key] = [];
          console.debug(`Using empty array for likely array parameter: ${key}`);
        } else if (key.includes('object') || key.endsWith('Options') || key.endsWith('Config') || key.endsWith('Settings')) {
          normalizedArgs[key] = {};
          console.debug(`Using empty object for likely object parameter: ${key}`);
        } else {
          // Default to empty string for unknown types
          normalizedArgs[key] = '';
          console.debug(`Using empty string for parameter with unknown type: ${key}`);
        }
      } else {
        // For non-undefined/null values, keep the original value
        normalizedArgs[key] = value;
      }
    }
    
    return normalizedArgs;
  }

  async connectToServer(config: MCPServerConfig): Promise<void> {
    if (!config.enabled) {
      throw new Error(`Server ${config.name} is not enabled`);
    }

    console.log(`Connecting to MCP server: ${config.name}`);

    // Special handling for memory server - ensure directory and file exist
    if (config.name === 'memory' && config.env?.MEMORY_FILE_PATH) {
      await this.ensureMemoryFileExists(config.env.MEMORY_FILE_PATH as string);
    }

    // Create environment with proper variable handling
    const baseEnv: Record<string, string> = {
      // Essential system variables
      PATH: process.env.PATH || '',
      HOME: process.env.HOME || '',
      USER: process.env.USER || '',
      // Platform-specific variables
      ...(process.platform === 'win32' && {
        USERPROFILE: process.env.USERPROFILE || '',
        APPDATA: process.env.APPDATA || '',
        LOCALAPPDATA: process.env.LOCALAPPDATA || ''
      }),
      // Node.js specific variables that might be needed
      NODE_ENV: process.env.NODE_ENV || 'production'
    };

    // Add server-specific environment variables
    const serverEnv = config.env ? this.validateEnvironmentVariables(config.env) : {};
    const env = { ...baseEnv, ...serverEnv };

    console.log(`Starting server: ${config.command} ${config.args?.join(' ') || ''}`);
    console.log(`Environment variables:`, Object.keys(env));

    let transport: StdioClientTransport | WebSocketClientTransport;

    if (config.transport === 'websocket' && config.websocketUrl) {
      // WebSocket transport
      transport = new WebSocketClientTransport(new URL(config.websocketUrl));
    } else {
      // Stdio transport (default)
      let command = config.command || '';
      let args = config.args || [];
      
      // Handle command initialization with proper shell wrapper
      if (command === 'npx') {
        // Use shell wrapper for npx to ensure proper PATH initialization
        command = process.platform === 'win32' ? 'cmd.exe' : '/bin/zsh';
        args = process.platform === 'win32' 
          ? ['/c', ['npx', ...args].join(' ')]
          : ['-i', '-c', ['npx', ...args].join(' ')];
      } else if (command === 'uvx') {
        // Handle uvx command with shell wrapper and fallback options
        command = process.platform === 'win32' ? 'cmd.exe' : '/bin/zsh';
        const uvxCommand = ['uvx', ...args].join(' ');
        args = process.platform === 'win32' 
          ? ['/c', uvxCommand]
          : ['-i', '-c', uvxCommand];
        
        // Add uv-specific environment variables
        env.PATH = `${process.env.HOME}/.cargo/bin:${env.PATH}`;
        env.PATH = `${process.env.HOME}/.local/bin:${env.PATH}`;
      }

      // Create transport and client
      transport = new StdioClientTransport({
        command,
        args,
        env,
        cwd: config.cwd,
        stderr: config.stderr || 'pipe'
      });
    }

    const client = new Client({
      name: `tangent-${config.name}-client`,
      version: '1.0.0'
    });

    await client.connect(transport);
    this.connections.set(config.name, client);
    this.addToGlobalRecovery(config.name, client);
    
    console.log(`Connected to MCP server: ${config.name}`);
  }

  async disconnectFromServer(serverName: string): Promise<void> {
    const client = this.connections.get(serverName);
    if (client) {
      await client.close();
      this.connections.delete(serverName);
      this.removeFromGlobalRecovery(serverName);
      console.log(`Disconnected from MCP server: ${serverName}`);
    }
  }

  async listTools(serverName: string): Promise<MCPTool[]> {
    const client = this.connections.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} is not connected`);
    }

    const result = await client.listTools();
    return (result.tools || []).map((tool: any) => ({
      id: `${serverName}:${tool.name}`,
      serverName,
      toolName: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema
    }));
  }

  async callTool(serverName: string, toolName: string, args: any, timeout?: number): Promise<any> {
    const client = this.connections.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} is not connected`);
    }

    // Normalize arguments
    const normalizedArgs = this.normalizeToolArguments(args, toolName);
    
    // Generate progress token
    const progressToken = uuidv4();

    // Handle timeout if specified
    if (timeout && timeout > 0) {
      console.debug(`Using timeout: ${timeout} seconds for tool ${toolName}`);
      
      // Create an AbortController for the timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout * 1000);
      
      try {
        // Call the tool with timeout
        const response = await Promise.race([
          client.callTool({
            name: toolName,
            arguments: normalizedArgs,
            _meta: { progressToken }
          }),
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error(`Tool execution timed out after ${timeout} seconds`));
            });
          })
        ]);
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        return response;
      } catch (error) {
        // Clear the timeout
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // No timeout or timeout is -1 (infinite)
    return await client.callTool({
      name: toolName,
      arguments: normalizedArgs,
      _meta: { progressToken }
    });
  }

  isConnected(serverName: string): boolean {
    return this.connections.has(serverName);
  }

  async cleanup(): Promise<void> {
    const serverNames = Array.from(this.connections.keys());
    for (const serverName of serverNames) {
      await this.disconnectFromServer(serverName);
    }
  }

  /**
   * Ensure the memory file directory and file exist
   */
  private async ensureMemoryFileExists(memoryFilePath: string): Promise<void> {
    try {
      const dirPath = path.dirname(memoryFilePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating memory directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Create memory file if it doesn't exist
      if (!fs.existsSync(memoryFilePath)) {
        console.log(`Creating memory file: ${memoryFilePath}`);
        const initialMemory = {
          identity: {},
          dailyRoutine: {},
          goals: {},
          communication: {},
          tasks: {},
          calendar: {},
          knowledge: {},
          preferences: {},
          people: {},
          techStack: {},
          context: {}
        };
        fs.writeFileSync(memoryFilePath, JSON.stringify(initialMemory, null, 2));
      }
      
      console.log(`Memory file ready: ${memoryFilePath}`);
    } catch (error) {
      console.error(`Failed to ensure memory file exists: ${error}`);
      throw new Error(`Failed to create memory file: ${error}`);
    }
  }
} 