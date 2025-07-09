import { App } from 'obsidian';
import { 
  listVaultFiles, 
  readFile, 
  writeFile,
  readMemory,
  updateMemory,
  ToolResult as BuiltinToolResult
} from '../tools';
import { UnifiedTool, ToolResult, MCPTool } from './types';
import { MCPClient } from './mcpClient';
import { MCPSecurityManager } from './securityManager';

export class UnifiedToolManager {
  private builtinTools: Map<string, UnifiedTool> = new Map();
  private mcpTools: Map<string, UnifiedTool> = new Map();
  private mcpClient: MCPClient;
  private securityManager: MCPSecurityManager;

  constructor(private app: App, mcpClient: MCPClient, securityManager?: MCPSecurityManager) {
    this.mcpClient = mcpClient;
    this.securityManager = securityManager || new MCPSecurityManager();
    this.initializeBuiltinTools();
  }

  /**
   * Initialize built-in tools
   */
  private initializeBuiltinTools(): void {
    // List vault files tool
    this.registerBuiltinTool({
      id: 'listVaultFiles',
      name: 'listVaultFiles',
      description: 'List all files in the Obsidian vault',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to list files from (optional)'
          }
        }
      },
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await listVaultFiles(this.app, args);
          return this.convertBuiltinResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Read file tool
    this.registerBuiltinTool({
      id: 'readFile',
      name: 'readFile',
      description: 'Read the contents of a file in the vault',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to read'
          }
        },
        required: ['path']
      },
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await readFile(this.app, args);
          return this.convertBuiltinResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Write file tool
    this.registerBuiltinTool({
      id: 'writeFile',
      name: 'writeFile',
      description: 'Write content to a file in the vault',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to write'
          },
          content: {
            type: 'string',
            description: 'Content to write to the file'
          }
        },
        required: ['path', 'content']
      },
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await writeFile(this.app, args);
          return this.convertBuiltinResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      requiresConfirmation: true
    });

    // Read memory tool
    this.registerBuiltinTool({
      id: 'readMemory',
      name: 'readMemory',
      description: 'Read the AI assistant memory',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await readMemory(this.app, args);
          return this.convertBuiltinResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Update memory tool
    this.registerBuiltinTool({
      id: 'updateMemory',
      name: 'updateMemory',
      description: 'Update the AI assistant memory',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'New memory content'
          }
        },
        required: ['content']
      },
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await updateMemory(this.app, args);
          return this.convertBuiltinResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      requiresConfirmation: true
    });
  }

  /**
   * Register a built-in tool
   */
  registerBuiltinTool(tool: UnifiedTool): void {
    this.builtinTools.set(tool.id, tool);
  }

  /**
   * Register an MCP tool
   */
  registerMCPTool(mcpTool: MCPTool): void {
    console.log(`[UnifiedToolManager] registerMCPTool called for tool:`, mcpTool);
    const tool: UnifiedTool = {
      id: mcpTool.id,
      name: mcpTool.toolName,
      description: mcpTool.description,
      type: 'mcp',
      serverName: mcpTool.serverName,
      inputSchema: mcpTool.inputSchema,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await this.mcpClient.callTool(mcpTool.serverName, mcpTool.toolName, args);
          return this.convertMCPResult(result);
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      requiresConfirmation: mcpTool.annotations?.destructiveHint || false
    };
    this.mcpTools.set(tool.id, tool);
    console.log(`[UnifiedToolManager] MCP tool registered:`, tool);
  }

  /**
   * Get a tool by ID
   */
  getTool(toolId: string): UnifiedTool | undefined {
    return this.builtinTools.get(toolId) || this.mcpTools.get(toolId);
  }

  /**
   * Get all tools
   */
  getAllTools(): UnifiedTool[] {
    const allTools = [...this.builtinTools.values(), ...this.mcpTools.values()];
    console.log(`[UnifiedToolManager] getAllTools returning ${allTools.length} tools:`, allTools.map(t => t.name), allTools);
    return allTools;
  }

  /**
   * Get built-in tools only
   */
  getBuiltinTools(): UnifiedTool[] {
    return Array.from(this.builtinTools.values());
  }

  /**
   * Get MCP tools only
   */
  getMCPTools(): UnifiedTool[] {
    return Array.from(this.mcpTools.values());
  }

  /**
   * Execute a tool
   */
  async executeTool(toolId: string, args: any): Promise<ToolResult> {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Security validation for built-in tools
    if (tool.type === 'builtin' && tool.security?.inputValidation) {
      const validation = tool.security.inputValidation(args);
      if (!validation.valid) {
        return {
          type: 'error',
          error: `Input validation failed: ${validation.errors.join(', ')}`
        };
      }
    }

    // Security validation for MCP tools
    if (tool.type === 'mcp' && tool.serverName) {
      const mcpTool = this.mcpTools.get(toolId);
      if (mcpTool) {
        // The security validation is already handled in the MCP client
        // but we can add additional validation here if needed
      }
    }

    return await tool.execute(args);
  }

  /**
   * Check if a tool requires confirmation
   */
  toolRequiresConfirmation(toolId: string): boolean {
    const tool = this.getTool(toolId);
    return tool?.requiresConfirmation || false;
  }

  /**
   * Convert built-in tool result to unified format
   */
  private convertBuiltinResult(result: BuiltinToolResult): ToolResult {
    return {
      type: result.type,
      text: result.text,
      files: result.files,
      content: result.content,
      error: result.error,
      data: result
    };
  }

  /**
   * Convert MCP tool result to unified format
   */
  private convertMCPResult(result: any): ToolResult {
    // MCP results typically have a content array with text/other content
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n');

      return {
        type: 'text',
        text: textContent,
        data: result
      };
    }

    return {
      type: 'data',
      data: result
    };
  }

  /**
   * Clear all MCP tools (useful when servers disconnect)
   */
  clearMCPTools(): void {
    this.mcpTools.clear();
  }

  /**
   * Update MCP tools from server
   */
  async updateMCPToolsFromServer(serverName: string): Promise<void> {
    try {
      console.log(`[UnifiedToolManager] updateMCPToolsFromServer called for server: ${serverName}`);
      const tools = await this.mcpClient.listAllTools();
      const serverTools = tools.filter(tool => tool.serverName === serverName);
      console.log(`[UnifiedToolManager] Fetched ${serverTools.length} tools from server '${serverName}':`, serverTools.map(t => t.toolName), serverTools);
      // Remove existing tools from this server
      for (const [toolId, tool] of this.mcpTools.entries()) {
        if (tool.serverName === serverName) {
          this.mcpTools.delete(toolId);
          console.log(`[UnifiedToolManager] Removed old MCP tool:`, toolId);
        }
      }
      // Add new tools
      for (const tool of serverTools) {
        this.registerMCPTool(tool);
      }
      console.log(`[UnifiedToolManager] updateMCPToolsFromServer complete for server: ${serverName}`);
    } catch (error) {
      console.error(`Failed to update MCP tools from server ${serverName}:`, error);
    }
  }
} 