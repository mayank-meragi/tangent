import { 
  SecurityConfig, 
  ValidationResult, 
  SecurityViolation, 
  MCPServerConfig,
  MCPTool 
} from './types';

export class MCPSecurityManager {
  private securityConfig: SecurityConfig;
  private rateLimitCounters: Map<string, { calls: number; lastReset: Date }> = new Map();
  private violations: SecurityViolation[] = [];
  private allowedCommands: Set<string>;
  private allowedDomains: Set<string>;

  constructor(config?: Partial<SecurityConfig>) {
    this.securityConfig = {
      allowedCommands: [
        'python', 'python3', 'node', 'npm', 'npx', 'uvx', 'uv',
        'mcp-server-time', 'mcp-server-filesystem', 'mcp-server-git',
        // Add more trusted commands as needed
      ],
      allowedDomains: [
        'localhost', '127.0.0.1', '::1',
        // Add more trusted domains as needed
      ],
      maxTimeout: 30000, // 30 seconds
      maxMemoryUsage: 512, // 512 MB
      enableSandboxing: true,
      requireConfirmation: true,
      rateLimiting: {
        enabled: true,
        maxCallsPerMinute: 60,
        maxCallsPerHour: 1000
      },
      ...config
    };

    this.allowedCommands = new Set(this.securityConfig.allowedCommands);
    this.allowedDomains = new Set(this.securityConfig.allowedDomains);
  }

  /**
   * Validate server configuration for security
   */
  validateServerConfig(config: MCPServerConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate command
    if (!this.isCommandAllowed(config.command)) {
      errors.push(`Command '${config.command}' is not in the allowed commands list`);
    }

    // Validate arguments
    if (config.args) {
      for (const arg of config.args) {
        if (this.containsSuspiciousPattern(arg)) {
          errors.push(`Argument '${arg}' contains suspicious patterns`);
        }
      }
    }

    // Validate working directory
    if (config.workingDirectory) {
      if (!this.isPathSafe(config.workingDirectory)) {
        errors.push(`Working directory '${config.workingDirectory}' is not safe`);
      }
    }

    // Check for security configurations
    if (!config.security) {
      warnings.push('No security configuration provided, using defaults');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate tool input for security
   */
  validateToolInput(tool: MCPTool, args: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check rate limiting
    if (this.securityConfig.rateLimiting.enabled) {
      const rateLimitResult = this.checkRateLimit(tool.id);
      if (!rateLimitResult.allowed) {
        errors.push(`Rate limit exceeded for tool ${tool.toolName}`);
      }
    }

    // Validate input schema
    if (tool.inputSchema) {
      const schemaValidation = this.validateInputSchema(tool.inputSchema, args);
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Check for destructive operations
    if (tool.security?.destructive && !this.securityConfig.requireConfirmation) {
      warnings.push('Destructive operation detected - confirmation may be required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a command is allowed
   */
  private isCommandAllowed(command: string): boolean {
    // Check exact match
    if (this.allowedCommands.has(command)) {
      return true;
    }

    // Check if it's a path to an allowed command
    const commandName = command.split('/').pop() || command;
    return this.allowedCommands.has(commandName);
  }

  /**
   * Check for suspicious patterns in input
   */
  private containsSuspiciousPattern(input: string): boolean {
    const suspiciousPatterns = [
      /[;&|`$]/g, // Shell operators
      /\.\./g, // Directory traversal
      /\/etc\/passwd/g, // System files
      /\/proc\//g, // Process filesystem
      /\/sys\//g, // System filesystem
      /\/dev\//g, // Device files
      /\/tmp\/.*\.(sh|py|js|exe|bat|cmd)/g, // Executable files in temp
      /curl\s+.*\|\s*sh/g, // Pipe to shell
      /wget\s+.*\|\s*sh/g, // Pipe to shell
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check if a path is safe
   */
  private isPathSafe(path: string): boolean {
    const unsafePatterns = [
      /^\/etc\//,
      /^\/proc\//,
      /^\/sys\//,
      /^\/dev\//,
      /^\/root\//,
      /^\/var\/log\//,
      /^\/tmp\/.*\.(sh|py|js|exe|bat|cmd)$/,
    ];

    return !unsafePatterns.some(pattern => pattern.test(path));
  }

  /**
   * Check rate limiting for a tool
   */
  private checkRateLimit(toolId: string): { allowed: boolean; remaining: number } {
    const now = new Date();
    const counter = this.rateLimitCounters.get(toolId);

    if (!counter) {
      this.rateLimitCounters.set(toolId, { calls: 1, lastReset: now });
      return { allowed: true, remaining: this.securityConfig.rateLimiting.maxCallsPerMinute - 1 };
    }

    // Reset counter if a minute has passed
    if (now.getTime() - counter.lastReset.getTime() > 60000) {
      counter.calls = 1;
      counter.lastReset = now;
      return { allowed: true, remaining: this.securityConfig.rateLimiting.maxCallsPerMinute - 1 };
    }

    // Check if limit exceeded
    if (counter.calls >= this.securityConfig.rateLimiting.maxCallsPerMinute) {
      this.recordViolation({
        type: 'rate_limit',
        message: `Rate limit exceeded for tool ${toolId}`,
        timestamp: now,
        serverName: toolId.split(':')[0],
        toolName: toolId.split(':')[1]
      });
      return { allowed: false, remaining: 0 };
    }

    counter.calls++;
    return { 
      allowed: true, 
      remaining: this.securityConfig.rateLimiting.maxCallsPerMinute - counter.calls 
    };
  }

  /**
   * Validate input schema
   */
  private validateInputSchema(schema: any, args: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic schema validation
    if (schema.type === 'object' && schema.properties) {
      for (const [key] of Object.entries(schema.properties)) {
        if (schema.required?.includes(key) && !(key in args)) {
          errors.push(`Required property '${key}' is missing`);
        }
      }
    }

    // Check for suspicious values
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && this.containsSuspiciousPattern(value)) {
        errors.push(`Property '${key}' contains suspicious patterns`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Record a security violation
   */
  private recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation);
    console.warn('Security violation:', violation);
  }

  /**
   * Get security violations
   */
  getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    rateLimitHits: number;
  } {
    const violationsByType: Record<string, number> = {};
    
    for (const violation of this.violations) {
      violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1;
    }

    return {
      totalViolations: this.violations.length,
      violationsByType,
      rateLimitHits: violationsByType['rate_limit'] || 0
    };
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
    this.allowedCommands = new Set(this.securityConfig.allowedCommands);
    this.allowedDomains = new Set(this.securityConfig.allowedDomains);
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }
} 