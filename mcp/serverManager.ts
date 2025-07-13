import { MCPClient, MCPServerConfig } from './mcpClient';
import { UnifiedToolManager } from './unifiedToolManager';

export interface MCPServerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'connecting';
  lastError?: string;
  lastConnected?: Date;
  retryCount?: number;
}

export class MCPServerManager {
  private client: MCPClient;
  private servers = new Map<string, MCPServerConfig>();
  private serverStatuses = new Map<string, MCPServerStatus>();
  private onSettingsChange?: (servers: MCPServerConfig[]) => void;
  private connectionRetries = new Map<string, number>();
  private unifiedToolManager?: UnifiedToolManager;

  constructor(onSettingsChange?: (servers: MCPServerConfig[]) => void, unifiedToolManager?: UnifiedToolManager) {
    this.client = new MCPClient();
    this.onSettingsChange = onSettingsChange;
    this.unifiedToolManager = unifiedToolManager;
  }

  async loadServers(servers: MCPServerConfig[]): Promise<void> {
    // Clear existing servers
    this.servers.clear();
    this.serverStatuses.clear();
    this.connectionRetries.clear();

    // Load new servers
    for (const server of servers) {
      this.servers.set(server.name, server);
      this.serverStatuses.set(server.name, {
        name: server.name,
        status: 'stopped',
        retryCount: 0
      });
    }

    // Auto-start enabled servers
    await this.startEnabledServers();
  }

  /**
   * Add a new server to the manager
   */
  async addServer(serverConfig: MCPServerConfig): Promise<void> {
    if (this.servers.has(serverConfig.name)) {
      throw new Error(`Server '${serverConfig.name}' already exists`);
    }

    this.servers.set(serverConfig.name, serverConfig);
    this.serverStatuses.set(serverConfig.name, {
      name: serverConfig.name,
      status: 'stopped',
      retryCount: 0
    });

    // Auto-start if enabled
    if (serverConfig.enabled) {
      await this.startServer(serverConfig.name);
    }

    // Notify settings change
    if (this.onSettingsChange) {
      this.onSettingsChange(Array.from(this.servers.values()));
    }
  }

  /**
   * Remove a server from the manager
   */
  async removeServer(serverName: string): Promise<void> {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new Error(`Server '${serverName}' not found`);
    }

    // Stop the server if it's running
    if (this.client.isConnected(serverName)) {
      await this.stopServer(serverName);
    }

    // Remove from collections
    this.servers.delete(serverName);
    this.serverStatuses.delete(serverName);
    this.connectionRetries.delete(serverName);
    // Remove MCP tools for this server
    if (this.unifiedToolManager) {
      this.unifiedToolManager.removeMCPToolsForServer(serverName);
    }
    // Notify settings change
    if (this.onSettingsChange) {
      this.onSettingsChange(Array.from(this.servers.values()));
    }
  }

  async startEnabledServers(): Promise<void> {
    for (const [serverName, config] of this.servers.entries()) {
      if (config.enabled && !this.client.isConnected(serverName)) {
        try {
          await this.startServer(serverName);
        } catch (error) {
          console.error(`Failed to auto-start server ${serverName}:`, error);
        }
      }
    }
  }

  async startServer(serverName: string): Promise<void> {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new Error(`Server configuration not found: ${serverName}`);
    }

    if (!config.enabled) {
      throw new Error(`Server ${serverName} is not enabled`);
    }

    this.updateServerStatus(serverName, 'connecting');

    try {
      await this.client.connectToServer(config);
      this.updateServerStatus(serverName, 'running');
      this.connectionRetries.set(serverName, 0);
      // Update MCP tools if we have a unified tool manager
      if (this.unifiedToolManager) {
        await this.unifiedToolManager.updateMCPToolsFromServer(serverName);
      }
      if (this.onSettingsChange) {
        this.onSettingsChange(Array.from(this.servers.values()));
      }
    } catch (error) {
      const retryCount = this.connectionRetries.get(serverName) || 0;
      const maxRetries = config.retryAttempts || 3;
      if (retryCount < maxRetries) {
        console.warn(`Connection attempt ${retryCount + 1} failed for ${serverName}, retrying...`);
        this.connectionRetries.set(serverName, retryCount + 1);
        setTimeout(() => {
          this.startServer(serverName).catch(console.error);
        }, 1000 * (retryCount + 1));
        this.updateServerStatus(serverName, 'connecting');
      } else {
        this.updateServerStatus(serverName, 'error', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }
  }

  async stopServer(serverName: string): Promise<void> {
    try {
      await this.client.disconnectFromServer(serverName);
      this.updateServerStatus(serverName, 'stopped');
      this.connectionRetries.set(serverName, 0);
      // Remove MCP tools for this server
      if (this.unifiedToolManager) {
        this.unifiedToolManager.removeMCPToolsForServer(serverName);
      }
    } catch (error) {
      console.error(`Failed to stop server ${serverName}:`, error);
      this.updateServerStatus(serverName, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async callTool(serverName: string, toolName: string, args: any, timeout?: number): Promise<any> {
    const config = this.servers.get(serverName);
    const toolTimeout = timeout || config?.timeout || 30;
    
    return await this.client.callTool(serverName, toolName, args, toolTimeout);
  }

  async listTools(serverName: string): Promise<any[]> {
    return await this.client.listTools(serverName);
  }

  updateServerConfig(serverName: string, updates: Partial<MCPServerConfig>): void {
    const existingConfig = this.servers.get(serverName);
    if (!existingConfig) {
      throw new Error(`Server configuration not found: ${serverName}`);
    }

    const updatedConfig = { ...existingConfig, ...updates };
    this.servers.set(serverName, updatedConfig);

    // Update status if server is being enabled/disabled
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.startServer(serverName).catch(console.error);
      } else {
        this.stopServer(serverName).catch(console.error);
      }
    }

    // Notify settings change
    if (this.onSettingsChange) {
      this.onSettingsChange(Array.from(this.servers.values()));
    }
  }

  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.servers.get(serverName);
  }

  getAllServerConfigs(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  getServerStatus(serverName: string): MCPServerStatus | undefined {
    return this.serverStatuses.get(serverName);
  }

  getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.serverStatuses.values());
  }

  isServerConnected(serverName: string): boolean {
    return this.client.isConnected(serverName);
  }

  getClient(): MCPClient {
    return this.client;
  }

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }

  private updateServerStatus(serverName: string, status: MCPServerStatus['status'], error?: string): void {
    const currentStatus = this.serverStatuses.get(serverName);
    if (currentStatus) {
      currentStatus.status = status;
      currentStatus.lastError = error;
      if (status === 'running') {
        currentStatus.lastConnected = new Date();
      }
      this.serverStatuses.set(serverName, currentStatus);
    }
  }
} 