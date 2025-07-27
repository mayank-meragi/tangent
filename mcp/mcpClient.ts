import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export type TransportType = 'stdio' | 'websocket';

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

  constructor() {
    // Simplified constructor - no recovery needed
  }

  /**
   * Validate and sanitize environment variables
   */
  private validateEnvironmentVariables(env: Record<string, EnvVarValue>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, envVar] of Object.entries(env)) {
      // Skip empty keys
      if (!key?.trim()) continue;

      // Extract value from different formats
      const value = typeof envVar === 'object' && 'value' in envVar
        ? envVar.value
        : String(envVar || '');

      // Skip empty values
      if (!value.trim()) continue;

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Normalize tool arguments to ensure we don't pass undefined values to MCP servers
   */
  private normalizeToolArguments(args: Record<string, unknown>, toolName: string): Record<string, unknown> {
    if (!args) return {};

    const normalizedArgs: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      // Handle undefined or null values with simple defaults
      if (value === undefined || value === null) {
        normalizedArgs[key] = '';
      } else {
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
    const baseEnv = {
      PATH: process.env.PATH || '',
      HOME: process.env.HOME || '',
      USER: process.env.USER || '',
      NODE_ENV: process.env.NODE_ENV || 'production',
      ...(process.platform === 'win32' && {
        USERPROFILE: process.env.USERPROFILE || '',
        APPDATA: process.env.APPDATA || '',
        LOCALAPPDATA: process.env.LOCALAPPDATA || ''
      })
    };

    // Add server-specific environment variables
    const serverEnv = config.env ? this.validateEnvironmentVariables(config.env) : {};
    const env = { ...baseEnv, ...serverEnv };

    let transport: StdioClientTransport | WebSocketClientTransport;

    if (config.transport === 'websocket' && config.websocketUrl) {
      transport = new WebSocketClientTransport(new URL(config.websocketUrl));
    } else {
      // Stdio transport (default)
      const command = config.command || '';
      const args = config.args || [];

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

    console.log(`Connected to MCP server: ${config.name}`);
  }

  async disconnectFromServer(serverName: string): Promise<void> {
    const client = this.connections.get(serverName);
    if (client) {
      await client.close();
      this.connections.delete(serverName);
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
    const result = await client.callTool({
      name: toolName,
      arguments: normalizedArgs,
      _meta: { progressToken }
    });

    return result;
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
        fs.writeFileSync(memoryFilePath, '');
      }

      console.log(`Memory file ready: ${memoryFilePath}`);
    } catch (error) {
      console.error(`Failed to ensure memory file exists: ${error}`);
      throw new Error(`Failed to create memory file: ${error}`);
    }
  }
} 