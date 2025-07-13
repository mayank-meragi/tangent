import { App } from 'obsidian';
import { 
  listVaultFiles, 
  readFile, 
  writeFile,
  writeToMemory,
  readMemory
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
    // List vault files tool
    this.builtinTools.set('listVaultFiles', {
      id: 'listVaultFiles',
      name: 'listVaultFiles',
      description: 'List all files in the vault',
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

    // Read file tool
    this.builtinTools.set('readFile', {
      id: 'readFile',
      name: 'readFile',
      description: 'Read a file from the vault',
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

    // Write file tool
    this.builtinTools.set('writeFile', {
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
      name: 'writeToMemory',
      description: 'Append content to the AI memory file. This content will be available as context for future conversations.',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The content to append to memory'
          }
        },
        required: ['content']
      },
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
      name: 'readMemory',
      description: 'Read the current content of the AI memory file',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
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

    // Graph tools
    // Query graph tool
    this.builtinTools.set('query_graph', {
      id: 'query_graph',
      name: 'query_graph',
      description: 'Search the knowledge graph for information across all labels and relationships',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for (e.g., user movie preferences, John, basketball)'
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: specific labels to search in (e.g., [Person, Preference])'
          },
          relationshipTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: specific relationship types to include (e.g., [LIKES, KNOWS])'
          },
          maxDepth: {
            type: 'number',
            description: 'Maximum depth to traverse relationships (1-5)',
            minimum: 1,
            maximum: 5,
            default: 2
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10
          },
          includeRelationships: {
            type: 'boolean',
            description: 'Whether to include relationship information in results',
            default: true
          }
        },
        required: ['query']
      },
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          // This tool is no longer available, so it will throw an error.
          // This is a consequence of removing the queryGraph import.
          throw new Error('query_graph tool is no longer available.');
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // List relationship types tool
    this.builtinTools.set('list_relationship_types', {
      id: 'list_relationship_types',
      name: 'list_relationship_types',
      description: 'Fetch all relationship types currently in the Neo4j database',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          // This tool is no longer available, so it will throw an error.
          // This is a consequence of removing the listRelationshipTypes import.
          throw new Error('list_relationship_types tool is no longer available.');
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Graph search tool
    this.builtinTools.set('graph_search', {
      id: 'graph_search',
      name: 'graph_search',
      description: 'Search the knowledge graph using graph traversal to find related information',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for'
          },
          maxDepth: {
            type: 'number',
            description: 'How many steps to traverse in the graph (1-5)',
            minimum: 1,
            maximum: 5,
            default: 3
          },
          edgeTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Types of relationships to follow'
          },
          minWeight: {
            type: 'number',
            description: 'Minimum relationship weight (0-1)',
            minimum: 0,
            maximum: 1,
            default: 0.1
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
            default: 10
          }
        },
        required: ['query']
      },
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          // This tool is no longer available, so it will throw an error.
          // This is a consequence of removing the graphSearch import.
          throw new Error('graph_search tool is no longer available.');
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Find path tool
    this.builtinTools.set('find_path', {
      id: 'find_path',
      name: 'find_path',
      description: 'Find the shortest path between two concepts in the knowledge graph',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Starting concept or memory ID'
          },
          to: {
            type: 'string',
            description: 'Target concept or memory ID'
          },
          maxDepth: {
            type: 'number',
            description: 'Maximum path length to search',
            default: 5
          }
        },
        required: ['from', 'to']
      },
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          // This tool is no longer available, so it will throw an error.
          // This is a consequence of removing the findPath import.
          throw new Error('find_path tool is no longer available.');
        } catch (error) {
          return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Analyze graph tool
    this.builtinTools.set('analyze_graph', {
      id: 'analyze_graph',
      name: 'analyze_graph',
      description: 'Analyze the knowledge graph structure to find clusters and insights',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          analysisType: {
            type: 'string',
            description: 'Type of analysis to perform',
            enum: ['clusters', 'central_nodes', 'stats', 'all'],
            default: 'all'
          }
        }
      },
      execute: async (args: any, timeout?: number): Promise<ToolResult> => {
        try {
          // This tool is no longer available, so it will throw an error.
          // This is a consequence of removing the analyzeGraph import.
          throw new Error('analyze_graph tool is no longer available.');
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
          if (!this.mcpClient) throw new Error('MCPClient not set');
          const result = await this.mcpClient.callTool(mcpTool.serverName, mcpTool.toolName, args, timeout);
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
    const tool = this.getTool(toolId);
    if (!tool) {
      return {
        type: 'error',
        error: `Tool not found: ${toolId}`
      };
    }

    return await tool.execute(args, timeout);
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