import { MCPServerConfig, MCPServerStatus } from './types';
import { MCPClient } from './mcpClient';
import { MCPSecurityManager } from './securityManager';
import { UnifiedToolManager } from './unifiedToolManager';

export class MCPServerManager {
  private client: MCPClient;
  private servers: Map<string, MCPServerConfig> = new Map();
  private serverStatuses: Map<string, MCPServerStatus> = new Map();
  private onSettingsChange?: (servers: MCPServerConfig[]) => void;
  private securityManager: MCPSecurityManager;
  private unifiedToolManager?: UnifiedToolManager; // <-- add this

  constructor(onSettingsChange?: (servers: MCPServerConfig[]) => void, unifiedToolManager?: UnifiedToolManager) {
    this.securityManager = new MCPSecurityManager();
    this.client = new MCPClient(this.securityManager);
    this.onSettingsChange = onSettingsChange;
    this.unifiedToolManager = unifiedToolManager;
  }

  /**
   * Add or update a server configuration
   */
  addServer(config: MCPServerConfig): void {
    // Validate configuration
    const validation = this.validateServerConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid server configuration: ${validation.errors.join(', ')}`);
    }
    
    this.servers.set(config.name, config);
    
    // Initialize status
    this.serverStatuses.set(config.name, {
      name: config.name,
      status: 'stopped',
      tools: []
    });

    // Notify settings change
    this.notifySettingsChange();
  }

  /**
   * Remove a server configuration
   */
  async removeServer(serverName: string): Promise<void> {
    // Stop the server if it's running
    if (this.client.isServerConnected(serverName)) {
      await this.stopServer(serverName);
    }

    this.servers.delete(serverName);
    this.serverStatuses.delete(serverName);

    // Notify settings change
    this.notifySettingsChange();
  }

  /**
   * Update server configuration
   */
  updateServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
    
    // Update status if it exists
    const existingStatus = this.serverStatuses.get(config.name);
    if (existingStatus) {
      existingStatus.name = config.name;
      this.serverStatuses.set(config.name, existingStatus);
    }

    // Notify settings change
    this.notifySettingsChange();
  }

  /**
   * Enable or disable a server
   */
  setServerEnabled(serverName: string, enabled: boolean): void {
    const config = this.servers.get(serverName);
    if (config) {
      config.enabled = enabled;
      this.servers.set(serverName, config);
      this.notifySettingsChange();
      
      // Automatically start/stop the server based on enabled state
      if (enabled && !this.client.isServerConnected(serverName)) {
        // Don't await this to avoid blocking the UI
        this.startServer(serverName).catch(error => {
          console.error(`Failed to start server ${serverName} after enabling:`, error);
        });
      } else if (!enabled && this.client.isServerConnected(serverName)) {
        // Don't await this to avoid blocking the UI
        this.stopServer(serverName).catch(error => {
          console.error(`Failed to stop server ${serverName} after disabling:`, error);
        });
      }
    }
  }

  /**
   * Load server configurations from settings
   */
  loadServerConfigurations(configs: MCPServerConfig[]): void {
    console.log('Loading server configurations:', configs);
    
    // Clear existing configurations
    this.servers.clear();
    this.serverStatuses.clear();

    // Temporarily disable the callback to avoid triggering it during load
    const originalCallback = this.onSettingsChange;
    this.onSettingsChange = undefined;

    // Add configurations from settings
    for (const config of configs) {
      this.addServer(config);
    }

    // If no servers are configured, add default preconfigured servers
    if (configs.length === 0) {
      console.log('No MCP servers configured, initializing with default state');
    }
    
    // Restore the callback
    this.onSettingsChange = originalCallback;
    
    console.log('Server manager now has servers:', this.getAllServerConfigs());
  }

  /**
   * Get all server configurations for saving to settings
   */
  getServerConfigurationsForSettings(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Reset server manager to initial state
   */
  reset(): void {
    this.servers.clear();
    this.serverStatuses.clear();
    this.notifySettingsChange();
  }

  /**
   * Validate server configuration
   */
  validateServerConfig(config: MCPServerConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.name || config.name.trim() === '') {
      errors.push('Server name is required');
    }
    
    if (!config.command || config.command.trim() === '') {
      errors.push('Server command is required');
    }
    
    if (this.servers.has(config.name) && config.name !== config.name) {
      errors.push('Server name must be unique');
    }

    // Security validation
    const securityValidation = this.securityManager.validateServerConfig(config);
    if (!securityValidation.valid) {
      errors.push(...securityValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get server statistics
   */
  getServerStatistics(): {
    total: number;
    enabled: number;
    running: number;
    stopped: number;
    error: number;
  } {
    const configs = this.getAllServerConfigs();
    const statuses = this.getAllServerStatuses();
    
    return {
      total: configs.length,
      enabled: configs.filter(c => c.enabled).length,
      running: statuses.filter(s => s.status === 'running').length,
      stopped: statuses.filter(s => s.status === 'stopped').length,
      error: statuses.filter(s => s.status === 'error').length
    };
  }

  /**
   * Start a server
   */
  async startServer(serverName: string): Promise<void> {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new Error(`Server configuration not found: ${serverName}`);
    }

    if (!config.enabled) {
      throw new Error(`Server ${serverName} is not enabled`);
    }

    // Update status to starting
    this.updateServerStatus(serverName, 'starting');

    try {
      await this.client.connectToServer(config);
      
      // Update status to running
      const status = this.client.getServerStatus(serverName);
      if (status) {
        this.serverStatuses.set(serverName, status);
      }
      // --- NEW: Update MCP tools in UnifiedToolManager ---
      if (this.unifiedToolManager) {
        await this.unifiedToolManager.updateMCPToolsFromServer(serverName);
      }
    } catch (error) {
      this.updateServerStatus(serverName, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Stop a server
   */
  async stopServer(serverName: string): Promise<void> {
    this.updateServerStatus(serverName, 'stopping');

    try {
      await this.client.disconnectFromServer(serverName);
      this.updateServerStatus(serverName, 'stopped');
    } catch (error) {
      this.updateServerStatus(serverName, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Restart a server
   */
  async restartServer(serverName: string): Promise<void> {
    await this.stopServer(serverName);
    await this.startServer(serverName);
  }

  /**
   * Get server configuration
   */
  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.servers.get(serverName);
  }

  /**
   * Get all server configurations
   */
  getAllServerConfigs(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server status
   */
  getServerStatus(serverName: string): MCPServerStatus | undefined {
    return this.serverStatuses.get(serverName);
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.serverStatuses.values());
  }

  /**
   * Check if server is running
   */
  isServerRunning(serverName: string): boolean {
    return this.client.isServerConnected(serverName);
  }

  /**
   * Start all enabled servers
   */
  async startAllEnabledServers(): Promise<void> {
    const enabledServers = this.getAllServerConfigs().filter(config => config.enabled);
    
    for (const config of enabledServers) {
      try {
        await this.startServer(config.name);
      } catch (error) {
        console.error(`Failed to start server ${config.name}:`, error);
      }
    }
  }

  /**
   * Stop all servers
   */
  async stopAllServers(): Promise<void> {
    const runningServers = this.getAllServerConfigs().filter(config => 
      this.client.isServerConnected(config.name)
    );
    
    for (const config of runningServers) {
      try {
        await this.stopServer(config.name);
      } catch (error) {
        console.error(`Failed to stop server ${config.name}:`, error);
      }
    }
  }

  /**
   * Get MCP client instance
   */
  getClient(): MCPClient {
    return this.client;
  }

  /**
   * Get security manager instance
   */
  getSecurityManager(): MCPSecurityManager {
    return this.securityManager;
  }

  /**
   * Check if a server is a placeholder (not properly configured)
   */
  isPlaceholderServer(serverName: string): boolean {
    const config = this.servers.get(serverName);
    if (!config) return false;
    
    // Check for placeholder commands that are not real MCP servers
    const placeholderCommands = ['echo', 'cat', 'printf'];
    return placeholderCommands.includes(config.command);
  }

  /**
   * Update server status
   */
  private updateServerStatus(serverName: string, status: MCPServerStatus['status'], error?: string): void {
    const currentStatus = this.serverStatuses.get(serverName);
    if (currentStatus) {
      currentStatus.status = status;
      if (error) {
        currentStatus.lastError = error;
      }
      this.serverStatuses.set(serverName, currentStatus);
    }
  }

  /**
   * Notify settings change
   */
  private notifySettingsChange(): void {
    if (this.onSettingsChange) {
      this.onSettingsChange(this.getServerConfigurationsForSettings());
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    await this.stopAllServers();
    await this.client.cleanup();
  }

  setUnifiedToolManager(unifiedToolManager: UnifiedToolManager) {
    this.unifiedToolManager = unifiedToolManager;
  }
} 