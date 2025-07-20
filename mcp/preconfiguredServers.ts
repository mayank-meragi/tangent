import { MCPServerConfig } from './mcpClient';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export function getPreconfiguredServers(): MCPServerConfig[] {
  return [
    {
      name: 'time',
      transport: 'stdio',
      command: 'uvx',
      args: ['mcp-server-time'],
      enabled: false,
      timeout: 30,
      retryAttempts: 3,
      env: {
        // Add common PATH locations for uv
        PATH: process.env.PATH || ''
      }
    },
    {
      name: 'filesystem',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      enabled: false,
      timeout: 60,
      retryAttempts: 3
    },
    {
      name: 'google-calendar',
      transport: 'stdio',
      command: 'npx',
      args: ['@cocal/google-calendar-mcp'],
      enabled: false,
      timeout: 60,
      retryAttempts: 3,
      env: {
        GOOGLE_OAUTH_CREDENTIALS: '' // User will set this path
      }
    },
    {
      name: 'gmail',
      transport: 'stdio',
      command: 'npx',
      args: ['@gongrzhe/server-gmail-autoauth-mcp'],
      enabled: false,
      timeout: 60,
      retryAttempts: 3
    }
  ];
}

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
  return getPreconfiguredServers().find(server => server.name === name);
}

/**
 * Get all pre-configured server names
 */
export function getPreconfiguredServerNames(): string[] {
  return getPreconfiguredServers().map(server => server.name);
}

/**
 * Check if a preconfigured server is available (not yet added to user's configuration)
 */
export function isPreconfiguredServerAvailable(serverName: string, configuredServers: MCPServerConfig[]): boolean {
  const preconfiguredNames = getPreconfiguredServerNames();
  const configuredNames = configuredServers.map(server => server.name);
  
  return preconfiguredNames.includes(serverName) && !configuredNames.includes(serverName);
}

/**
 * Get available preconfigured servers (not yet added to user's configuration)
 */
export function getAvailablePreconfiguredServers(configuredServers: MCPServerConfig[]): MCPServerConfig[] {
  const allPreconfigured = getPreconfiguredServers();
  const configuredNames = configuredServers.map(server => server.name);
  
  return allPreconfigured.filter(server => !configuredNames.includes(server.name));
}

/**
 * Add a preconfigured server to the user's configuration
 */
export function addPreconfiguredServer(serverName: string, configuredServers: MCPServerConfig[]): MCPServerConfig[] {
  const preconfiguredServer = getPreconfiguredServerSync(serverName);
  if (!preconfiguredServer) {
    throw new Error(`Preconfigured server '${serverName}' not found`);
  }
  
  if (!isPreconfiguredServerAvailable(serverName, configuredServers)) {
    throw new Error(`Server '${serverName}' is already configured or not available`);
  }
  
  // Add the server with default settings (disabled by default)
  const newServer = { ...preconfiguredServer, enabled: false };
  return [...configuredServers, newServer];
}

/**
 * Remove a server from the user's configuration
 */
export function removePreconfiguredServer(serverName: string, configuredServers: MCPServerConfig[]): MCPServerConfig[] {
  return configuredServers.filter(server => server.name !== serverName);
}

/**
 * Create a custom server configuration
 */
export function createCustomServer(
  name: string,
  command: string,
  args?: string[],
  transport: 'stdio' | 'websocket' | 'docker' = 'stdio'
): MCPServerConfig {
  return {
    name,
    transport,
    command,
    args: args || [],
    enabled: false,
    timeout: 30,
    retryAttempts: 3
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
    
    case 'filesystem':
      return `MCP Filesystem Server Setup Instructions:

1. Ensure Node.js and npm are installed:
   - Check with: node --version && npm --version
   - Download from: https://nodejs.org/

2. The filesystem server uses npx to run @modelcontextprotocol/server-filesystem
   - npx will automatically download and run the package
   - No manual installation required

3. Verify npx is available:
   - Open terminal and run: which npx
   - Should be available with Node.js installation

4. For Obsidian plugins:
   - Node.js and npm must be available in the system PATH
   - Try restarting Obsidian after installing Node.js
   - Check that npx is accessible from terminal

5. First run will download the package:
   - npx will automatically download @modelcontextprotocol/server-filesystem
   - Subsequent runs will use cached version

Note: The filesystem server provides file and directory operations capabilities.`;

    case 'google-calendar':
      return `Google Calendar MCP Server Setup Instructions:

1. Google Cloud Project Setup:
   - Go to https://console.cloud.google.com
   - Create a new project or select an existing one
   - Enable the Google Calendar API for your project
   - Go to "APIs & Services" > "OAuth consent screen"
   - Configure the consent screen (External or Internal)
   - Add your email as a test user

2. Create OAuth Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as the application type
   - Download the JSON credentials file
   - Save it securely on your computer

3. Configure Credentials Path:
   - In the MCP Server Manager, set the GOOGLE_OAUTH_CREDENTIALS environment variable
   - Point it to the path of your downloaded credentials JSON file
   - Example: /path/to/your/gcp-oauth.keys.json

4. First Authentication:
   - Enable the Google Calendar server
   - The server will open a browser window for OAuth authentication
   - Complete the Google sign-in process
   - Grant calendar access permissions

5. Verify npx is available:
   - Open terminal and run: which npx
   - Should be available with Node.js installation

Note: The Google Calendar server provides calendar management capabilities including creating, updating, and searching events.`;
    
    case 'gmail':
      return `Gmail MCP Server Setup Instructions:

1. Ensure Node.js and npm are installed:
   - Check with: node --version && npm --version
   - Download from: https://nodejs.org/

2. The Gmail server uses npx to run @gongrzhe/server-gmail-autoauth-mcp
   - npx will automatically download and run the package
   - No manual installation required

3. Verify npx is available:
   - Open terminal and run: which npx
   - Should be available with Node.js installation

4. For Obsidian plugins:
   - Node.js and npm must be available in the system PATH
   - Try restarting Obsidian after installing Node.js
   - Check that npx is accessible from terminal

5. First run will download the package:
   - npx will automatically download @gongrzhe/server-gmail-autoauth-mcp
   - Subsequent runs will use cached version

6. OAuth Authentication:
   - The server uses auto OAuth authentication
   - First time you enable it, it will open a browser window
   - Complete the Google sign-in process
   - Grant Gmail access permissions

Note: The Gmail server provides email management capabilities including reading, sending, and searching emails.`;
    
    default:
      return null;
  }
}

/**
 * Check if a server requires manual installation
 */
export function requiresManualInstallation(serverName: string): boolean {
  return ['time', 'memory', 'google-calendar', 'gmail'].includes(serverName);
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
  // This function is no longer needed as path finding is removed.
  // Keeping it for now, but it will always return false.
  return {
    available: false,
    diagnosticInfo: `Command availability check is no longer available due to simplified preconfigured servers.`
  };
}

/**
 * Get alternative server configurations for when primary command fails
 */
export function getAlternativeServerConfigs(serverName: string): MCPServerConfig[] {
  switch (serverName) {
    case 'time':
      return [
        {
          name: 'time-pip',
          transport: 'stdio' as const,
          command: 'python',
          args: ['-m', 'mcp_server_time'],
          enabled: false,
          timeout: 30,
          retryAttempts: 3
        },
        {
          name: 'time-npm',
          transport: 'stdio' as const,
          command: 'node',
          args: ['-e', 'require("@modelcontextprotocol/server-time")'],
          enabled: false,
          timeout: 30,
          retryAttempts: 3
        }
      ];
    default:
      return [];
  }
}

/**
 * Check if the memory file exists and is accessible
 */
export function checkMemoryFileAccess(memoryFilePath?: string): {
  exists: boolean;
  accessible: boolean;
  path: string;
  error?: string;
} {
  const filePath = memoryFilePath || path.join(os.homedir(), '.tangent', 'memory.json');
  
  try {
    const exists = fs.existsSync(filePath);
    const accessible = exists ? fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK) === undefined : false;
    
    return {
      exists,
      accessible,
      path: filePath,
      error: accessible ? undefined : 'File exists but is not accessible'
    };
  } catch (error) {
    return {
      exists: false,
      accessible: false,
      path: filePath,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get command diagnostic information for troubleshooting
 */
export function getCommandDiagnosticInfo(command: string): string {
  switch (command) {
    case 'uvx':
      return `UV Command Diagnostic Information:

1. Check if uv is installed:
   - Run: which uvx
   - Expected: /path/to/uvx or similar

2. If uvx is not found, install uv:
   - macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
   - Windows: pip install uv
   - Or: pip install uv

3. After installation, restart your terminal and try again

4. Common PATH locations for uv:
   - ~/.cargo/bin
   - ~/.local/bin
   - /usr/local/bin
   - /opt/homebrew/bin (macOS with Homebrew)

5. For Obsidian plugins:
   - Commands must be available in the system PATH
   - Try restarting Obsidian after installing uv
   - Check that uvx is accessible from terminal

6. Alternative installation methods:
   - pip install mcp-server-time (then use: python -m mcp_server_time)
   - npm install -g @modelcontextprotocol/server-time (then use: node -e "require('@modelcontextprotocol/server-time')")`;

    case 'npx':
      return `NPX Command Diagnostic Information:

1. Check if Node.js and npm are installed:
   - Run: node --version && npm --version
   - Expected: Version numbers for both

2. If not installed, download from: https://nodejs.org/

3. Verify npx is available:
   - Run: which npx
   - Expected: /path/to/npx

4. For Obsidian plugins:
   - Node.js and npm must be available in the system PATH
   - Try restarting Obsidian after installing Node.js
   - Check that npx is accessible from terminal

5. Common PATH locations for Node.js:
   - /usr/local/bin
   - /opt/homebrew/bin (macOS with Homebrew)
   - ~/.nvm/versions/node/*/bin (if using nvm)`;

    default:
      return `Command Diagnostic Information for: ${command}

1. Check if the command is installed:
   - Run: which ${command}
   - Expected: /path/to/${command}

2. If not found, install the required package

3. For Obsidian plugins:
   - Commands must be available in the system PATH
   - Try restarting Obsidian after installation
   - Check that ${command} is accessible from terminal`;
  }
}

/**
 * Check if Google Calendar credentials file exists and is valid
 */
export function checkGoogleCalendarCredentials(credentialsPath?: string): {
  exists: boolean;
  valid: boolean;
  path: string;
  error?: string;
} {
  if (!credentialsPath) {
    return {
      exists: false,
      valid: false,
      path: 'Not configured',
      error: 'GOOGLE_OAUTH_CREDENTIALS environment variable not set'
    };
  }

  try {
    const exists = fs.existsSync(credentialsPath);
    if (!exists) {
      return {
        exists: false,
        valid: false,
        path: credentialsPath,
        error: 'Credentials file does not exist'
      };
    }

    // Check if file is readable
    fs.accessSync(credentialsPath, fs.constants.R_OK);

    // Try to parse as JSON to validate format
    const content = fs.readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(content);

    // Basic validation of Google OAuth credentials structure
    if (!credentials.installed && !credentials.web) {
      return {
        exists: true,
        valid: false,
        path: credentialsPath,
        error: 'Invalid credentials format: missing installed or web property'
      };
    }

    // Check for required fields in installed credentials
    if (credentials.installed) {
      const requiredFields = ['client_id', 'client_secret', 'auth_uri', 'token_uri'];
      const missingFields = requiredFields.filter(field => !credentials.installed[field]);
      
      if (missingFields.length > 0) {
        return {
          exists: true,
          valid: false,
          path: credentialsPath,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }
    }

    return {
      exists: true,
      valid: true,
      path: credentialsPath
    };
  } catch (error) {
    return {
      exists: false,
      valid: false,
      path: credentialsPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 