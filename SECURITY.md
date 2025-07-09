# MCP Security Implementation

This document outlines the security measures implemented in the Tangent plugin's MCP (Model Context Protocol) system to protect against various security threats.

## Security Overview

The MCP implementation includes comprehensive security measures to protect against:
- Command injection attacks
- Path traversal attacks
- Rate limiting abuse
- Resource exhaustion
- Unauthorized access to system resources

## Security Components

### 1. Security Manager (`MCPSecurityManager`)

The security manager is the central component responsible for:
- Input validation and sanitization
- Command allowlisting
- Rate limiting
- Security violation tracking
- Configuration management

#### Key Features:
- **Command Allowlisting**: Only pre-approved commands can be executed
- **Input Validation**: All inputs are validated against suspicious patterns
- **Rate Limiting**: Prevents abuse through call frequency limits
- **Violation Tracking**: Logs and tracks security violations

### 2. Input Validation

All inputs are validated for:
- Shell operators (`;`, `&`, `|`, `` ` ``, `$`)
- Directory traversal patterns (`..`)
- System file access (`/etc/passwd`, `/proc/`, `/sys/`, `/dev/`)
- Executable files in temporary directories
- Pipe-to-shell patterns (`curl | sh`, `wget | sh`)

### 3. Command Allowlisting

Only the following commands are allowed by default:
- `python`, `python3`
- `node`, `npm`, `npx`
- `uvx`, `uv`
- `mcp-server-time`, `mcp-server-filesystem`, `mcp-server-git`

Additional commands can be added through the security settings.

### 4. Rate Limiting

Rate limiting is configured with:
- **Per-minute limit**: 60 calls (configurable)
- **Per-hour limit**: 1000 calls (configurable)
- **Per-tool tracking**: Each tool has its own rate limit counter

### 5. Environment Security

Server processes are started with:
- **Filtered environment variables**: Only safe variables are passed
- **Secure working directories**: Path validation prevents access to system directories
- **Timeout protection**: Operations are automatically terminated if they exceed time limits

### 6. Sandboxing Support

The system includes support for sandboxed execution:
- **Process isolation**: Each server runs in its own process
- **Resource limits**: Memory and CPU usage can be limited
- **Network restrictions**: Domain allowlisting for network access

## Configuration

### Security Settings

Users can configure security settings through the UI:

```typescript
interface SecurityConfig {
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
```

### Server-Specific Security

Each MCP server can have its own security configuration:

```typescript
interface MCPServerConfig {
  // ... other properties
  security?: {
    allowlist?: string[];
    timeout?: number;
    maxMemory?: number;
    readOnly?: boolean;
    sandboxed?: boolean;
  };
}
```

## Security Best Practices

### For Users

1. **Review Server Configurations**: Always review the commands and arguments of MCP servers before enabling them
2. **Use Trusted Sources**: Only install MCP servers from trusted sources
3. **Regular Updates**: Keep MCP servers updated to the latest versions
4. **Monitor Violations**: Check security violation logs regularly
5. **Principle of Least Privilege**: Only enable servers that you actually need

### For Developers

1. **Input Validation**: Always validate and sanitize inputs
2. **Command Allowlisting**: Use allowlists instead of blocklists
3. **Resource Limits**: Set appropriate timeouts and memory limits
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Logging**: Log security events for monitoring and debugging

## Security Monitoring

### Violation Tracking

The system tracks security violations including:
- Rate limit exceeded
- Command not in allowlist
- Suspicious input patterns
- Path traversal attempts

### Statistics

Security statistics are available through the API:
- Total violations
- Violations by type
- Rate limit hits
- Server-specific violations

## Threat Mitigation

### Command Injection
- **Mitigation**: Command allowlisting, input validation
- **Detection**: Pattern matching for shell operators

### Path Traversal
- **Mitigation**: Path validation, working directory restrictions
- **Detection**: Pattern matching for `..` sequences

### Resource Exhaustion
- **Mitigation**: Rate limiting, memory limits, timeouts
- **Detection**: Resource usage monitoring

### Unauthorized Access
- **Mitigation**: Environment filtering, sandboxing
- **Detection**: Access pattern monitoring

## Reporting Security Issues

If you discover a security vulnerability in the MCP implementation:

1. **Do not disclose publicly** until the issue is resolved
2. **Report privately** to the maintainers
3. **Provide details** about the vulnerability and potential impact
4. **Include steps** to reproduce the issue

## Compliance

This security implementation follows:
- **OWASP Top 10** security guidelines
- **Principle of least privilege**
- **Defense in depth** security strategy
- **Fail secure** design principles

## Future Enhancements

Planned security improvements:
- **Docker containerization** for better isolation
- **Code signing** for MCP servers
- **Audit logging** for compliance
- **Machine learning** for anomaly detection
- **Certificate pinning** for network connections 