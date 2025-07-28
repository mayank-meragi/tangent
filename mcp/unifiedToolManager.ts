import { App } from 'obsidian';
import {
  listVaultFiles,
  readFile,
  writeFile,
  insertContent,
  searchAndReplace,
  manageFiles,
  writeToMemory,
  readMemory,
  queryDataviewTasks,
  writeDataviewTasks,
  // Tool function definitions
  listVaultFilesFunction,
  readFileFunction,
  writeFileFunction,
  insertContentFunction,
  searchAndReplaceFunction,
  manageFilesFunction,
  writeToMemoryFunction,
  readMemoryFunction,
  queryDataviewTasksFunction,
  writeDataviewTasksFunction
} from '../tools';
import { MCPClient, MCPTool } from './mcpClient';

export interface UnifiedTool {
  id: string;
  name: string;
  description: string;
  type: 'builtin' | 'mcp';
  serverName?: string;
  inputSchema: any;
  execute: (args: any, timeout?: number) => Promise<ToolResult>;
  requiresConfirmation?: boolean;
}

export interface ToolResult {
  type: 'success' | 'error';
  data?: any;
  error?: string;
}

export class UnifiedToolManager {
  private builtinTools = new Map<string, UnifiedTool>();
  private mcpTools = new Map<string, UnifiedTool>();
  public mcpClient?: MCPClient;

  constructor(private app: App, mcpClient?: MCPClient) {
    if (mcpClient) this.mcpClient = mcpClient;
    this.initializeBuiltinTools();
  }

  private initializeBuiltinTools(): void {
    // Enhanced list vault files tool
    this.builtinTools.set('listVaultFiles', {
      id: 'listVaultFiles',
      name: listVaultFilesFunction.name,
      description: listVaultFilesFunction.description,
      type: 'builtin',
      inputSchema: listVaultFilesFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await listVaultFiles(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Enhanced read file tool
    this.builtinTools.set('readFile', {
      id: 'readFile',
      name: readFileFunction.name,
      description: readFileFunction.description,
      type: 'builtin',
      inputSchema: readFileFunction.parameters,
      requiresConfirmation: readFileFunction.requiresConfirmation,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await readFile(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Enhanced write file tool
    this.builtinTools.set('writeFile', {
      id: 'writeFile',
      name: writeFileFunction.name,
      description: writeFileFunction.description,
      type: 'builtin',
      requiresConfirmation: writeFileFunction.requiresConfirmation,
      inputSchema: writeFileFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await writeFile(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Write to memory tool
    this.builtinTools.set('writeToMemory', {
      id: 'writeToMemory',
      name: writeToMemoryFunction.name,
      description: writeToMemoryFunction.description,
      type: 'builtin',
      inputSchema: writeToMemoryFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await writeToMemory(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Read memory tool
    this.builtinTools.set('readMemory', {
      id: 'readMemory',
      name: readMemoryFunction.name,
      description: readMemoryFunction.description,
      type: 'builtin',
      inputSchema: readMemoryFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await readMemory(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Query Dataview tasks tool
    this.builtinTools.set('queryDataviewTasks', {
      id: 'queryDataviewTasks',
      name: queryDataviewTasksFunction.name,
      description: queryDataviewTasksFunction.description,
      type: 'builtin',
      inputSchema: queryDataviewTasksFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await queryDataviewTasks(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Write Dataview tasks tool
    this.builtinTools.set('writeDataviewTasks', {
      id: 'writeDataviewTasks',
      name: writeDataviewTasksFunction.name,
      description: writeDataviewTasksFunction.description,
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: writeDataviewTasksFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await writeDataviewTasks(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });



    // Enhanced file operation tools
    // Insert content tool
    this.builtinTools.set('insertContent', {
      id: 'insertContent',
      name: insertContentFunction.name,
      description: insertContentFunction.description,
      type: 'builtin',
      requiresConfirmation: insertContentFunction.requiresConfirmation,
      inputSchema: insertContentFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await insertContent(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Search and replace tool
    this.builtinTools.set('searchAndReplace', {
      id: 'searchAndReplace',
      name: searchAndReplaceFunction.name,
      description: searchAndReplaceFunction.description,
      type: 'builtin',
      requiresConfirmation: searchAndReplaceFunction.requiresConfirmation,
      inputSchema: searchAndReplaceFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await searchAndReplace(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Manage files tool
    this.builtinTools.set('manageFiles', {
      id: 'manageFiles',
      name: manageFilesFunction.name,
      description: manageFilesFunction.description,
      type: 'builtin',
      requiresConfirmation: manageFilesFunction.requiresConfirmation,
      inputSchema: manageFilesFunction.parameters,
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          const result = await manageFiles(this.app, args);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });
  }

  registerMCPTool(mcpTool: MCPTool): void {
    const tool: UnifiedTool = {
      id: mcpTool.id,
      name: mcpTool.toolName,
      description: mcpTool.description,
      type: 'mcp',
      serverName: mcpTool.serverName,
      inputSchema: this.sanitizeSchema(mcpTool.inputSchema),
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          console.log(`[MCP TOOL DEBUG] Executing MCP tool: ${mcpTool.toolName} on server: ${mcpTool.serverName}`);
          if (!this.mcpClient) throw new Error('MCPClient not set');
          const result = await this.mcpClient.callTool(mcpTool.serverName, mcpTool.toolName, args, timeout);
          console.log(`[MCP TOOL DEBUG] MCP tool ${mcpTool.toolName} raw result:`, result);
          return {
            type: 'success',
            data: result
          };
        } catch (error) {
          console.log(`[MCP TOOL DEBUG] MCP tool ${mcpTool.toolName} error:`, error);
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    };
    this.mcpTools.set(tool.id, tool);
  }

  /**
   * Sanitize schema to be compatible with Gemini's tool format requirements
   * Gemini only supports 'enum' and 'date-time' formats for STRING types
   */
  private sanitizeSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    const sanitized = { ...schema };

    // Handle properties
    if (sanitized.properties) {
      for (const [key, prop] of Object.entries(sanitized.properties)) {
        if (typeof prop === 'object' && prop !== null) {
          sanitized.properties[key] = this.sanitizeSchema(prop);
        }
      }
    }

    // Handle items (for arrays)
    if (sanitized.items) {
      sanitized.items = this.sanitizeSchema(sanitized.items);
    }

    // Handle format field for string types
    if (sanitized.type === 'string' && sanitized.format) {
      // Remove unsupported formats, keep only 'enum' and 'date-time'
      if (sanitized.format !== 'enum' && sanitized.format !== 'date-time') {
        delete sanitized.format;
      }
    }

    return sanitized;
  }

  getAllTools(): UnifiedTool[] {
    return [
      ...Array.from(this.builtinTools.values()),
      ...Array.from(this.mcpTools.values())
    ];
  }

  getTool(toolId: string): UnifiedTool | undefined {
    return this.builtinTools.get(toolId) || this.mcpTools.get(toolId);
  }

  async callTool(toolId: string, args: any, timeout?: number): Promise<ToolResult> {
    console.log(`[UNIFIED DEBUG] Calling tool with ID: ${toolId}, args:`, args);

    const tool = this.getTool(toolId);
    if (!tool) {
      console.log(`[UNIFIED DEBUG] Tool not found: ${toolId}`);
      return {
        type: 'error',
        error: `Tool not found: ${toolId}`
      };
    }

    console.log(`[UNIFIED DEBUG] Found tool: ${tool.name} (type: ${tool.type})`);
    const result = await tool.execute(args, timeout);
    console.log(`[UNIFIED DEBUG] Tool execution result:`, result);
    return result;
  }

  async updateMCPToolsFromServer(serverName: string): Promise<void> {
    if (!this.mcpClient) throw new Error('MCPClient not set');
    try {
      const tools = await this.mcpClient.listTools(serverName);

      // Remove existing tools from this server
      for (const [toolId, tool] of this.mcpTools.entries()) {
        if (tool.serverName === serverName) {
          this.mcpTools.delete(toolId);
        }
      }

      // Add new tools
      for (const tool of tools) {
        this.registerMCPTool(tool);
      }
    } catch (error) {
      console.error(`Failed to update MCP tools from server ${serverName}:`, error);
    }
  }

  removeMCPToolsForServer(serverName: string): void {
    for (const [toolId, tool] of this.mcpTools.entries()) {
      if (tool.serverName === serverName) {
        this.mcpTools.delete(toolId);
      }
    }
  }
} 