import { MCPServerConfig } from './types';
import { spawn } from 'child_process';
import { execSync } from 'child_process';

// Function to find the path to a command using multiple methods
function findCommandPath(command: string): Promise<string | null> {
  return new Promise((resolve) => {
    console.log("Finding command path for: ", command);
    
    // Method 1: Try 'which' command
    const whichProcess = spawn('which', [command]);
    let output = '';

    whichProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    whichProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        const path = output.trim();
        console.log(`Found ${command} at: ${path}`);
        resolve(path);
        return;
      }
      
      // Method 2: Try common installation paths
      const commonPaths = [
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
        '/opt/homebrew/bin', // macOS Homebrew
        '/usr/local/opt/uv/bin', // macOS Homebrew uv
        process.env.HOME + '/.local/bin', // User local bin
        process.env.HOME + '/.cargo/bin', // Rust/cargo
        process.env.HOME + '/.npm-global/bin', // npm global
        process.env.HOME + '/Library/Python/*/bin', // Python user installs
      ];
      
      for (const basePath of commonPaths) {
        try {
          // Handle glob patterns
          if (basePath.includes('*')) {
            // For Python paths, try common versions
            const pythonVersions = ['3.11', '3.10', '3.9', '3.8'];
            for (const version of pythonVersions) {
              const path = basePath.replace('*', version);
              try {
                const fullPath = `${path}/${command}`;
                execSync(`test -x "${fullPath}"`, { stdio: 'ignore' });
                console.log(`Found ${command} at: ${fullPath}`);
                resolve(fullPath);
                return;
              } catch {
                // Continue to next version
              }
            }
          } else {
            const fullPath = `${basePath}/${command}`;
            try {
              execSync(`test -x "${fullPath}"`, { stdio: 'ignore' });
              console.log(`Found ${command} at: ${fullPath}`);
              resolve(fullPath);
              return;
            } catch {
              // Continue to next path
            }
          }
        } catch {
          // Continue to next path
        }
      }
      
      // Method 3: Try PATH environment variable
      const pathDirs = (process.env.PATH || '').split(':');
      for (const dir of pathDirs) {
        if (!dir) continue;
        try {
          const fullPath = `${dir}/${command}`;
          execSync(`test -x "${fullPath}"`, { stdio: 'ignore' });
          console.log(`Found ${command} at: ${fullPath}`);
          resolve(fullPath);
          return;
        } catch {
          // Continue to next directory
        }
      }
      
      console.log(`Command '${command}' not found in any location`);
      resolve(null);
    });
    
    whichProcess.on('error', (error) => {
      console.log(`Error with 'which' command:`, error.message);
      // Continue with other methods
      whichProcess.emit('close', 1);
    });
  });
}

// Function to get alternative commands for a given command
function getAlternativeCommands(command: string): string[] {
  const alternatives: Record<string, string[]> = {
    'uvx': [
      'uv', // uv command itself
      'python', // Python alternative
      'python3', // Python3 alternative
      'node', // Node.js alternative
      'npm', // npm alternative
      'npx', // npx alternative
    ],
    'mcp-server-time': [
      'python -m mcp_server_time',
      'python3 -m mcp_server_time',
      'node -e "require(\'@modelcontextprotocol/server-time\')"',
    ]
  };
  
  return alternatives[command] || [];
}

// Function to get preconfigured servers with dynamic paths and fallbacks
export async function getPreconfiguredServers(): Promise<MCPServerConfig[]> {
  console.log('Loading preconfigured servers with dynamic paths...');
  
  // Try to find uvx
  let uvxPath = await findCommandPath('uvx');
  
  // If uvx not found, try alternatives
  if (!uvxPath) {
    console.log('uvx not found, trying alternatives...');
    const alternatives = getAlternativeCommands('uvx');
    for (const alt of alternatives) {
      const altPath = await findCommandPath(alt);
      if (altPath) {
        console.log(`Using alternative: ${alt} at ${altPath}`);
        uvxPath = altPath;
        break;
      }
    }
  }

  console.log("Final command path: ", uvxPath);
  
  const servers = [
    {
      name: 'time',
      command: uvxPath || 'uvx', // Fallback to 'uvx' if not found
      args: ['mcp-server-time'],
      workingDirectory: undefined,
      enabled: false,
      description: 'MCP Time Server',
      version: '1.0.0',
      security: {
        allowlist: ['uvx', 'uv', 'python', 'python3', 'node', 'npm', 'npx', 'mcp-server-time'],
        timeout: 30000,
        maxMemory: 128,
        readOnly: true,
        sandboxed: true
      }
    }
  ];
  
  console.log('Preconfigured servers loaded:', servers);
  return servers;
}

// Legacy export for backward compatibility (will be deprecated)
export const PRECONFIGURED_SERVERS: MCPServerConfig[] = [
  {
    name: 'time',
    command: 'uvx', // Fallback to simple command
    args: ['mcp-server-time'],
    workingDirectory: undefined,
    enabled: false,
    description: 'MCP Time Server',
    version: '1.0.0',
    security: {
      allowlist: ['uvx', 'uv', 'python', 'python3', 'node', 'npm', 'npx', 'mcp-server-time'],
      timeout: 30000,
      maxMemory: 128,
      readOnly: true,
      sandboxed: true
    }
  }
];

/**
 * Get a pre-configured server by name
 */
export async function getPreconfiguredServer(name: string): Promise<MCPServerConfig | undefined> {
  const servers = await getPreconfiguredServers();
  return servers.find(server => server.name === name);
}

/**
 * Get a pre-configured server by name (synchronous version for backward compatibility)
 */
export function getPreconfiguredServerSync(name: string): MCPServerConfig | undefined {
  return PRECONFIGURED_SERVERS.find(server => server.name === name);
}

/**
 * Get all pre-configured server names
 */
export function getPreconfiguredServerNames(): string[] {
  return PRECONFIGURED_SERVERS.map(server => server.name);
}

/**
 * Create a custom server configuration
 */
export function createCustomServer(
  name: string,
  command: string,
  args?: string[],
  workingDirectory?: string
): MCPServerConfig {
  return {
    name,
    command,
    args: args || [],
    workingDirectory,
    enabled: false,
    description: `Custom server: ${name}`,
    version: '1.0.0'
  };
}

/**
 * Get installation instructions for a server
 */
export function getServerInstallationInstructions(serverName: string): string | null {
  switch (serverName) {
    case 'time':
      return `MCP Time Server Setup Instructions:

1. Install uv (recommended):
   curl -LsSf https://astral.sh/uv/install.sh | sh
   Then restart your terminal and try again.

2. Alternative: Install via pip:
   pip install mcp-server-time
   Then update server config to use: python -m mcp_server_time

3. Alternative: Install via npm:
   npm install -g @modelcontextprotocol/server-time
   Then update server config to use: node -e "require('@modelcontextprotocol/server-time')"

4. Check if uvx is available:
   - Open terminal and run: which uvx
   - If not found, add uv to your PATH or use alternatives above

5. For Obsidian plugins:
   - Commands must be available in the system PATH
   - Try restarting Obsidian after installing uv
   - Check that uvx is accessible from terminal

Note: Obsidian plugins run in a restricted environment. If uvx still doesn't work, use the pip or npm alternatives.`;
    default:
      return null;
  }
}

/**
 * Check if a server requires manual installation
 */
export function requiresManualInstallation(serverName: string): boolean {
  return ['time'].includes(serverName);
}

/**
 * Check if a command is available and provide diagnostic information
 */
export async function checkCommandAvailability(command: string): Promise<{
  available: boolean;
  path?: string;
  alternatives?: string[];
  diagnosticInfo: string;
}> {
  const path = await findCommandPath(command);
  
  if (path) {
    return {
      available: true,
      path,
      diagnosticInfo: `Command '${command}' found at: ${path}`
    };
  }
  
  // Get alternatives
  const alternatives = getAlternativeCommands(command);
  const availableAlternatives = [];
  
  for (const alt of alternatives) {
    const altPath = await findCommandPath(alt);
    if (altPath) {
      availableAlternatives.push(alt);
    }
  }
  
  let diagnosticInfo = `Command '${command}' not found.\n`;
  diagnosticInfo += `PATH: ${process.env.PATH}\n`;
  diagnosticInfo += `Available alternatives: ${availableAlternatives.length > 0 ? availableAlternatives.join(', ') : 'none'}\n`;
  
  if (command === 'uvx') {
    diagnosticInfo += `\nTo install uv:\n`;
    diagnosticInfo += `1. curl -LsSf https://astral.sh/uv/install.sh | sh\n`;
    diagnosticInfo += `2. Restart your terminal\n`;
    diagnosticInfo += `3. Restart Obsidian\n`;
  }
  
  return {
    available: false,
    alternatives: availableAlternatives,
    diagnosticInfo
  };
} 