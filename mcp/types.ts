// MCP Types for Tangent Plugin

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  workingDirectory?: string;
  enabled: boolean;
  description?: string;
  version?: string;
  // Security configurations
  security?: {
    allowlist?: string[]; // Allowed commands/executables
    timeout?: number; // Timeout in milliseconds
    maxMemory?: number; // Max memory usage in MB
    readOnly?: boolean; // Read-only mode
    sandboxed?: boolean; // Run in sandboxed environment
  };
}

export interface MCPTool {
  id: string;
  serverName: string;
  toolName: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  // Security annotations
  security?: {
    requiresConfirmation?: boolean;
    destructive?: boolean;
    rateLimited?: boolean;
    maxCallsPerMinute?: number;
  };
}

export interface UnifiedTool {
  id: string;
  name: string;
  description: string;
  type: 'builtin' | 'mcp';
  serverName?: string;
  inputSchema: any;
  execute: (args: any) => Promise<ToolResult>;
  requiresConfirmation?: boolean;
  // Security properties
  security?: {
    destructive?: boolean;
    rateLimited?: boolean;
    maxCallsPerMinute?: number;
    inputValidation?: (args: any) => { valid: boolean; errors: string[] };
  };
}

export interface ToolResult {
  type: string;
  text?: string;
  files?: Array<{
    name: string;
    type: 'file' | 'folder';
    path: string;
  }>;
  content?: string;
  error?: string;
  data?: any;
}

export interface MCPServerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastError?: string;
  startTime?: Date;
  tools?: MCPTool[];
  // Security status
  securityStatus?: {
    lastValidation?: Date;
    validationErrors?: string[];
    blockedOperations?: string[];
    rateLimitHits?: number;
  };
}

export interface MCPConnection {
  serverName: string;
  client: any; // MCP Client instance
  status: MCPServerStatus;
}

// MCP Protocol Types (simplified for our use case)
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
} 

// Security-related types
export interface SecurityConfig {
  allowedCommands: string[];
  allowedDomains: string[];
  maxTimeout: number;
  maxMemoryUsage: number;
  enableSandboxing: boolean;
  requireConfirmation: boolean;
  rateLimiting: {
    enabled: boolean;
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SecurityViolation {
  type: 'command' | 'domain' | 'timeout' | 'memory' | 'rate_limit';
  message: string;
  timestamp: Date;
  serverName: string;
  toolName?: string;
} 