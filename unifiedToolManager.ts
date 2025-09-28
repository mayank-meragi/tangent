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
} from './tools';

export interface UnifiedTool {
  id: string;
  name: string;
  description: string;
  type: 'builtin';
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

  constructor(private app: App) {
    this.initializeBuiltinTools();
  }

  private initializeBuiltinTools(): void {
    // listVaultFiles
    this.builtinTools.set('listVaultFiles', {
      id: 'listVaultFiles',
      name: listVaultFilesFunction.name,
      description: listVaultFilesFunction.description,
      type: 'builtin',
      inputSchema: listVaultFilesFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await listVaultFiles(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // readFile
    this.builtinTools.set('readFile', {
      id: 'readFile',
      name: readFileFunction.name,
      description: readFileFunction.description,
      type: 'builtin',
      inputSchema: readFileFunction.parameters,
      requiresConfirmation: readFileFunction.requiresConfirmation,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await readFile(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // writeFile
    this.builtinTools.set('writeFile', {
      id: 'writeFile',
      name: writeFileFunction.name,
      description: writeFileFunction.description,
      type: 'builtin',
      requiresConfirmation: writeFileFunction.requiresConfirmation,
      inputSchema: writeFileFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await writeFile(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // writeToMemory
    this.builtinTools.set('writeToMemory', {
      id: 'writeToMemory',
      name: writeToMemoryFunction.name,
      description: writeToMemoryFunction.description,
      type: 'builtin',
      inputSchema: writeToMemoryFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await writeToMemory(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // readMemory
    this.builtinTools.set('readMemory', {
      id: 'readMemory',
      name: readMemoryFunction.name,
      description: readMemoryFunction.description,
      type: 'builtin',
      inputSchema: readMemoryFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await readMemory(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // queryDataviewTasks
    this.builtinTools.set('queryDataviewTasks', {
      id: 'queryDataviewTasks',
      name: queryDataviewTasksFunction.name,
      description: queryDataviewTasksFunction.description,
      type: 'builtin',
      inputSchema: queryDataviewTasksFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await queryDataviewTasks(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // writeDataviewTasks
    this.builtinTools.set('writeDataviewTasks', {
      id: 'writeDataviewTasks',
      name: writeDataviewTasksFunction.name,
      description: writeDataviewTasksFunction.description,
      type: 'builtin',
      requiresConfirmation: true,
      inputSchema: writeDataviewTasksFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await writeDataviewTasks(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // insertContent
    this.builtinTools.set('insertContent', {
      id: 'insertContent',
      name: insertContentFunction.name,
      description: insertContentFunction.description,
      type: 'builtin',
      requiresConfirmation: insertContentFunction.requiresConfirmation,
      inputSchema: insertContentFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await insertContent(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // searchAndReplace
    this.builtinTools.set('searchAndReplace', {
      id: 'searchAndReplace',
      name: searchAndReplaceFunction.name,
      description: searchAndReplaceFunction.description,
      type: 'builtin',
      requiresConfirmation: searchAndReplaceFunction.requiresConfirmation,
      inputSchema: searchAndReplaceFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await searchAndReplace(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });

    // manageFiles
    this.builtinTools.set('manageFiles', {
      id: 'manageFiles',
      name: manageFilesFunction.name,
      description: manageFilesFunction.description,
      type: 'builtin',
      requiresConfirmation: manageFilesFunction.requiresConfirmation,
      inputSchema: manageFilesFunction.parameters,
      execute: async (args: any): Promise<ToolResult> => {
        try {
          const result = await manageFiles(this.app, args);
          return { type: 'success', data: result };
        } catch (error) {
          return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    });
  }

  getAllTools(): UnifiedTool[] {
    return [...Array.from(this.builtinTools.values())];
  }

  getTool(toolId: string): UnifiedTool | undefined {
    return this.builtinTools.get(toolId);
  }

  async callTool(toolId: string, args: any, timeout?: number): Promise<ToolResult> {
    const tool = this.getTool(toolId);
    if (!tool) {
      return { type: 'error', error: `Tool not found: ${toolId}` };
    }
    return tool.execute(args, timeout);
  }
}

