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
  writeDataviewTasks
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
      name: 'listVaultFiles',
      description: 'List files and folders in the Obsidian vault with advanced filtering options',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Optional path to list files from (defaults to vault root)'
          },
          search: {
            type: 'string',
            description: 'Optional search term to filter files by name'
          },
          type: {
            type: 'string',
            description: 'Optional filter by type: "file", "folder", or "all" (default: "all")'
          },
          recursive: {
            type: 'boolean',
            description: 'Whether to include subdirectories (default: false)'
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

    // Enhanced read file tool
    this.builtinTools.set('readFile', {
      id: 'readFile',
      name: 'readFile',
      description: 'Read the content of a file from the Obsidian vault with line numbers. Automatically extracts text from PDF and DOCX files. Returns content with line numbers prefixed for easy reference.',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to read (relative to vault root)'
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

    // Enhanced write file tool
    this.builtinTools.set('writeFile', {
      id: 'writeFile',
      name: 'writeFile',
      description: 'Write complete content to a file. If the file exists, it will be overwritten. If it doesn\'t exist, it will be created. Automatically creates any directories needed.',
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to write (relative to vault root)'
          },
          content: {
            type: 'string',
            description: 'The complete content to write to the file'
          },
          lineCount: {
            type: 'number',
            description: 'The number of lines in the file (optional, for informational purposes only)'
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

    // Query Dataview tasks tool
    this.builtinTools.set('queryDataviewTasks', {
      id: 'queryDataviewTasks',
      name: 'queryDataviewTasks',
      description: 'Query and retrieve tasks using Dataview plugin',
      type: 'builtin',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Custom Dataview query (optional if using filters)'
          },
          queryType: {
            type: 'string',
            enum: ['TASK', 'LIST', 'TABLE'],
            description: 'Type of Dataview query'
          },
          source: {
            type: 'string',
            description: 'Source file or folder to query'
          },
          filters: {
            type: 'object',
            properties: {
              completed: {
                type: 'boolean',
                description: 'Filter by completion status'
              },
              due: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Filter by due date (YYYY-MM-DD")'
                  },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Filter by due date range'
                  }
                ],
                description: 'Filter by due date (single date or range)'
              },
              created: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Filter by creation date (YYYY-MM-DD)'
                  },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Filter by creation date range'
                  }
                ],
                description: 'Filter by creation date (single date or range)'
              },
              start: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Filter by start date (YYYY-MM-DD)'
                  },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Filter by start date range'
                  }
                ],
                description: 'Filter by start date (single date or range)'
              },
              scheduled: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Filter by scheduled date (YYYY-MM-DD)'
                  },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Filter by scheduled date range'
                  }
                ],
                description: 'Filter by scheduled date (single date or range)'
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags'
              },
              project: {
                type: 'string',
                description: 'Filter by project metadata'
              },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Filter by general date range (affects created date)'
              }
            }
          },
          sort: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field to sort by' },
              order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
            }
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results'
          },
          format: {
            type: 'string',
            enum: ['json', 'text', 'markdown'],
            description: 'Output format'
          }
        }
      },
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
      name: 'writeDataviewTasks',
      description: 'Create and update tasks in Obsidian files',
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['create', 'update', 'delete', 'toggle'],
            description: 'Operation to perform'
          },
          file: {
            type: 'string',
            description: 'Target file path'
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Task description' },
                completed: { type: 'boolean', description: 'Completion status' },
                due: {
                  oneOf: [
                    { type: 'string', description: 'Due date (YYYY-MM-DD)' },
                    {
                      type: 'object',
                      properties: {
                        start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                        end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                      },
                      description: 'Due date range'
                    }
                  ],
                  description: 'Due date (single date or range)'
                },
                created: {
                  oneOf: [
                    { type: 'string', description: 'Creation date (YYYY-MM-DD)' },
                    {
                      type: 'object',
                      properties: {
                        start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                        end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                      },
                      description: 'Creation date range'
                    }
                  ],
                  description: 'Creation date (single date or range)'
                },
                start: {
                  oneOf: [
                    { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    {
                      type: 'object',
                      properties: {
                        start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                        end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                      },
                      description: 'Start date range'
                    }
                  ],
                  description: 'Start date (single date or range)'
                },
                scheduled: {
                  oneOf: [
                    { type: 'string', description: 'Scheduled date (YYYY-MM-DD)' },
                    {
                      type: 'object',
                      properties: {
                        start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                        end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                      },
                      description: 'Scheduled date range'
                    }
                  ],
                  description: 'Scheduled date (single date or range)'
                },
                priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
                project: { type: 'string', description: 'Project association' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
                metadata: { type: 'object', description: 'Custom metadata' }
              },
              required: ['text']
            },
            description: 'Task data for bulk operations'
          },
          task: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Task description' },
              completed: { type: 'boolean', description: 'Completion status' },
              due: {
                oneOf: [
                  { type: 'string', description: 'Due date (YYYY-MM-DD)' },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Due date range'
                  }
                ],
                description: 'Due date (single date or range)'
              },
              created: {
                oneOf: [
                  { type: 'string', description: 'Creation date (YYYY-MM-DD)' },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Creation date range'
                  }
                ],
                description: 'Creation date (single date or range)'
              },
              start: {
                oneOf: [
                  { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Start date range'
                  }
                ],
                description: 'Start date (single date or range)'
              },
              scheduled: {
                oneOf: [
                  { type: 'string', description: 'Scheduled date (YYYY-MM-DD)' },
                  {
                    type: 'object',
                    properties: {
                      start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                      end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                    },
                    description: 'Scheduled date range'
                  }
                ],
                description: 'Scheduled date (single date or range)'
              },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
              project: { type: 'string', description: 'Project association' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
              metadata: { type: 'object', description: 'Custom metadata' }
            },
            required: ['text'],
            description: 'Single task data'
          },
          taskId: {
            type: 'string',
            description: 'Task identifier for update/delete operations'
          },
          position: {
            type: 'string',
            enum: ['top', 'bottom'],
            description: 'Where to insert new tasks'
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata'
          }
        },
        required: ['operation', 'file']
      },
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

    // Enhanced file operation tools
    // Insert content tool
    this.builtinTools.set('insertContent', {
      id: 'insertContent',
      name: 'insertContent',
      description: 'Insert content at specific line positions in a file. Allows precise insertions without overwriting existing content.',
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to insert content into'
          },
          operations: {
            type: 'array',
            description: 'Array of insertion operations',
            items: {
              type: 'object',
              properties: {
                startLine: {
                  type: 'number',
                  description: 'The line number where content should be inserted'
                },
                content: {
                  type: 'string',
                  description: 'The content to insert'
                }
              },
              required: ['startLine', 'content']
            }
          }
        },
        required: ['path', 'operations']
      },
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
      name: 'searchAndReplace',
      description: 'Perform search and replace operations on a file. Supports regex patterns, line range restrictions, and case sensitivity options.',
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path of the file to modify'
          },
          operations: {
            type: 'array',
            description: 'Array of search/replace operations',
            items: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'The text or pattern to search for'
                },
                replace: {
                  type: 'string',
                  description: 'The text to replace matches with'
                },
                startLine: {
                  type: 'number',
                  description: 'Starting line number for restricted replacement (optional)'
                },
                endLine: {
                  type: 'number',
                  description: 'Ending line number for restricted replacement (optional)'
                },
                useRegex: {
                  type: 'boolean',
                  description: 'Whether to treat search as a regex pattern (default: false)'
                },
                ignoreCase: {
                  type: 'boolean',
                  description: 'Whether to ignore case when matching (default: false)'
                }
              },
              required: ['search', 'replace']
            }
          }
        },
        required: ['path', 'operations']
      },
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
      name: 'manageFiles',
      description: 'Perform file and folder management operations like moving, renaming, deleting, and creating folders.',
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          operations: {
            type: 'array',
            description: 'Array of file management operations',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'The type of operation: "move", "delete", or "create_folder"'
                },
                sourcePath: {
                  type: 'string',
                  description: 'The current path of the file or folder (for move/delete)'
                },
                destinationPath: {
                  type: 'string',
                  description: 'The new path for the file or folder (for move)'
                },
                path: {
                  type: 'string',
                  description: 'The path for the operation (for delete/create_folder)'
                }
              },
              required: ['action']
            }
          }
        },
        required: ['operations']
      },
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