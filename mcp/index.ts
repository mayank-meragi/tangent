// MCP Module Exports

// Core classes
export { MCPClient } from './mcpClient';
export { MCPServerManager } from './serverManager';
export { UnifiedToolManager } from './unifiedToolManager';

// Types
export type { MCPServerConfig, MCPTool } from './mcpClient';
export type { MCPServerStatus } from './serverManager';
export type { UnifiedTool, ToolResult } from './unifiedToolManager';

// Preconfigured servers
export { getPreconfiguredServers, getPreconfiguredServerSync, getPreconfiguredServerNames } from './preconfiguredServers'; 