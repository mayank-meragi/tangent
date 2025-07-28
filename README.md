# Tangent - AI Chat Plugin for Obsidian

A powerful AI chat plugin for Obsidian that integrates with Gemini AI and supports Model Context Protocol (MCP) for extended capabilities.

## Features

### Core AI Features
- **AI Chat Interface**: Seamless chat experience with Gemini AI
- **Multiple AI Models**: Support for various Gemini models (Gemini Pro, Gemini Pro Vision, etc.)
- **Real-time Streaming**: Live token streaming for responsive chat experience
- **Conversation History**: Save and manage chat conversations with persistent storage
- **File Context**: Include vault file content in conversations for context-aware responses

### Advanced AI Capabilities
- **Web Search Integration**: Toggle web search functionality for real-time information
- **Thinking Mode**: Enable AI thinking with configurable thinking budget
- **Tool Confirmation**: Built-in confirmation system for sensitive operations
- **Memory System**: Persistent memory across conversations for context retention
- **Personas**: Pre-built AI personas (Product Manager, Technical Writer, Creative Assistant, etc.)

### File Operations & Management
- **File Upload**: Upload images, documents, and files directly to chat
- **Drag & Drop**: Intuitive drag and drop file upload interface
- **File Preview**: Image thumbnails and file metadata display
- **Enhanced File Operations**: Read, write, insert, search/replace, and manage files
- **Vault File Integration**: Browse and include vault files in conversations
- **File Type Support**: Images (PNG, JPG, GIF, WebP, SVG), Documents (PDF, TXT, MD, DOC, DOCX), Data files (CSV, JSON, XML), Code files

### Task Management
- **Obsidian Tasks Integration**: Automatic integration with Obsidian Tasks plugin global filters
- **Dataview Tasks**: Query and manage tasks using Dataview syntax
- **Task Creation**: Create new tasks with metadata (due dates, priorities, projects, tags)
- **Task Updates**: Modify existing tasks and completion status
- **Emoji Support**: Use emoji shorthands (🗓️ for due dates, ✅ for completion, etc.)

### Template System
- **Conversation Starters**: Pre-built templates for common use cases
- **Template Categories**: Organized templates (Writing, Analysis, Brainstorming, Research, Learning, Creative, Productivity, Technical)
- **Template Variables**: Dynamic variable substitution in templates
- **Template Settings**: Per-template AI behavior configuration (thinking, web search, model selection)
- **Custom Templates**: Create and manage user-defined templates
- **Template Search**: Real-time search and filtering of templates

### Model Context Protocol (MCP)
- **MCP Server Management**: Comprehensive server management system
- **Preconfigured Servers**: Easy setup for popular MCP servers
- **Unified Tool Management**: Seamless integration of built-in and MCP tools
- **Server Status Monitoring**: Real-time server status and health checks
- **Security Features**: Command allowlisting, input validation, rate limiting

### Available MCP Servers
1. **Time Server** (`time`) - Current time and date information
2. **Memory Server** (`memory`) - Persistent memory capabilities
3. **Filesystem Server** (`filesystem`) - File and directory operations
4. **Git Server** (`git`) - Git repository operations
5. **Search Server** (`search`) - File and content search capabilities

### Built-in Tools
- **File Operations**: Read, write, insert, search/replace, manage files
- **Memory Management**: Write to and read from persistent memory
- **Task Management**: Query and write Dataview tasks
- **Vault Navigation**: List and browse vault files
- **Template Management**: Search and validate templates

### User Interface
- **Modern React UI**: Clean, responsive interface built with React
- **Persona Selector**: Visual persona selection with color-coded badges
- **Template Dropdown**: Searchable template selection interface
- **File Upload Interface**: Intuitive file upload with preview
- **Web Search Toggle**: Easy toggle for web search functionality
- **Thinking Indicators**: Visual feedback for AI thinking mode
- **Search Results Display**: Show web search results and sources
- **Variable Input Modal**: Dynamic variable input for templates
- **Settings Preview**: Template settings preview in dropdown

### Security & Performance
- **MCP Security**: Comprehensive security measures for MCP operations
- **Input Validation**: Robust input validation and sanitization
- **Rate Limiting**: Configurable rate limiting for tool calls
- **Error Handling**: Graceful error handling and user feedback
- **Performance Optimization**: Efficient file processing and memory management

### Integration Features
- **Obsidian API Integration**: Deep integration with Obsidian's file system
- **Dataview Integration**: Seamless integration with Dataview plugin
- **Tasks Plugin Integration**: Automatic global filter application
- **Template Plugin Support**: Integration with Obsidian's template system
- **Command Palette**: Quick access via Obsidian command palette
- **AI Tag Suggest**: AI-powered tag suggestions for notes with interactive selection

### Developer Features
- **TypeScript Support**: Full TypeScript implementation
- **Extensible Architecture**: Plugin-based architecture for easy extension
- **Debug Tools**: Comprehensive debugging and testing utilities
- **Documentation**: Detailed documentation for all features
- **Open Source**: MIT licensed with active development

## Obsidian Tasks Integration

The plugin automatically integrates with the [Obsidian Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) to respect your global task filter settings. When you query tasks through the AI, it automatically applies your configured global filter from the Tasks plugin, ensuring consistency across your task management workflow.

### How It Works

1. **Automatic Detection**: The plugin detects if the Obsidian Tasks plugin is installed and enabled
2. **Filter Reading**: Reads your global filter configuration from the Tasks plugin settings
3. **Syntax Conversion**: Converts Tasks plugin filter syntax to Dataview query conditions
4. **Automatic Application**: Applies the global filter to all task queries automatically

### Setup

1. Install the Obsidian Tasks plugin from the community plugins
2. Configure a global filter in the Tasks plugin settings
3. Use the `queryDataviewTasks` tool in Tangent chat - the global filter will be applied automatically

For detailed documentation, see [TASKS_INTEGRATION.md](TASKS_INTEGRATION.md).

## MCP Server Management

The plugin includes a comprehensive MCP server management system that allows you to easily add and remove preconfigured servers.

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
3. **Web Search**: Enable/disable web search functionality
4. **Thinking Mode**: Configure thinking budget for AI responses

### MCP Settings

- **Default Timeout**: Default timeout for MCP tool calls (5-300 seconds)
- **Max Retry Attempts**: Maximum retry attempts for failed connections (1-10)
- **Enable Logging**: Toggle detailed logging for MCP operations
- **Log Level**: Set logging level (Debug, Info, Warning, Error)

## Usage

1. **Start Chat**: Click the chat icon in the ribbon or use the command "Open Tangent Chat"
2. **Select Persona**: Choose an AI persona for specialized behavior
3. **Use Templates**: Select conversation starters from the template dropdown
4. **Upload Files**: Drag and drop files or use the upload button
5. **Enable Web Search**: Toggle web search for real-time information
6. **Manage Tasks**: Use task management tools with automatic filter integration
7. **Access History**: View and manage conversation history

## AI Tag Suggest

The plugin includes an AI-powered tag suggestion feature that analyzes your note content and suggests relevant tags.

### How It Works

1. **Content Analysis**: AI analyzes the current note's content and existing tags in your vault
2. **Smart Suggestions**: Generates contextually relevant tag suggestions based on content themes and existing tag patterns
3. **Interactive Selection**: Review and select which tags to apply to your note
4. **Automatic Application**: Apply selected tags directly to your note's frontmatter

### Usage

1. Open any note in Obsidian
2. Use the command "AI Tag Suggest" from the command palette
3. Review the AI-generated tag suggestions with reasoning
4. Select the tags you want to apply
5. Tags are automatically added to your note's frontmatter

### Features

- **Context-Aware**: Considers existing tags in your vault for consistency
- **Confidence Scoring**: Each suggestion includes a confidence score
- **Reasoning Display**: AI explains why each tag is suggested
- **Interactive UI**: Modal interface for easy tag selection
- **Vault Integration**: Seamlessly integrates with Obsidian's tagging system

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
