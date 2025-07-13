# Tangent - AI Chat Plugin for Obsidian

A powerful AI chat plugin for Obsidian that integrates with Gemini AI and supports Model Context Protocol (MCP) for extended capabilities.

## Features

- **AI Chat Interface**: Seamless chat experience with Gemini AI
- **Model Context Protocol (MCP)**: Extend functionality with MCP servers
- **Conversation History**: Save and manage chat conversations
- **File Context**: Include file content in conversations
- **Tool Integration**: Built-in tools for file operations and MCP tools

## MCP Server Management

The plugin includes a comprehensive MCP server management system that allows you to easily add and remove preconfigured servers.

### Available Preconfigured Servers

1. **Time Server** (`time`)
   - Provides current time and date information
   - Useful for time-sensitive operations and scheduling
   - Requires `uvx` or alternative installation methods

2. **Memory Server** (`memory`)
   - Provides persistent memory capabilities
   - Stores and retrieves information across conversations
   - Memory file stored at `~/.tangent/memory.json`

3. **Filesystem Server** (`filesystem`)
   - Provides file and directory operations
   - Read, write, and manage files on your system
   - Automatically downloaded via npx

4. **Git Server** (`git`)
   - Provides Git repository operations
   - Commit, push, pull, and manage version control
   - Automatically downloaded via npx

5. **Search Server** (`search`)
   - Provides file and content search capabilities
   - Find files and text across your system
   - Automatically downloaded via npx

### How to Manage MCP Servers

1. **Open Server Manager**:
   - Go to Settings → Tangent → Manage MCP Servers
   - Or use the command: "Open MCP Server Manager"

2. **Add Servers**:
   - Switch to the "Add Servers" tab
   - Browse available preconfigured servers
   - Click "Add Server" to add a server to your configuration
   - Servers are added in disabled state by default

3. **Configure Servers**:
   - Switch to the "Current Servers" tab
   - Toggle the "Enabled" checkbox to enable/disable servers
   - Click "Start" to manually start a server
   - Click "Stop" to stop a running server

4. **Remove Servers**:
   - In the "Current Servers" tab, click "Remove" on any server
   - This will stop the server and remove it from your configuration

### Server Installation

Most servers use `npx` and will be automatically downloaded on first use. The Time server requires additional setup:

**Time Server Installation**:
```bash
# Option 1: Install uv (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Option 2: Install via pip
pip install mcp-server-time

# Option 3: Install via npm
npm install -g @modelcontextprotocol/server-time
```

### Server Status

Servers can have the following statuses:
- **Running**: Server is active and ready to use
- **Stopped**: Server is configured but not running
- **Error**: Server encountered an error during startup
- **Connecting**: Server is in the process of starting up

## Configuration

### Basic Settings

1. **Gemini API Key**: Enter your Gemini API key for AI chat functionality
2. **Enable MCP**: Toggle MCP support on/off

### MCP Settings

- **Default Timeout**: Default timeout for MCP tool calls (5-300 seconds)
- **Max Retry Attempts**: Maximum retry attempts for failed connections (1-10)
- **Enable Logging**: Toggle detailed logging for MCP operations
- **Log Level**: Set logging level (Debug, Info, Warning, Error)

## Usage

1. **Start Chat**: Click the chat icon in the ribbon or use the command "Open Tangent Chat"
2. **Add File Context**: Use the file context feature to include file content in conversations
3. **Use MCP Tools**: Once servers are configured and running, AI can use their tools
4. **Manage History**: Access conversation history through the history tab

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
