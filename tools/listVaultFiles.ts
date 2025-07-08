import { App, TFile, TFolder } from 'obsidian';
import { ToolResult, ToolFunction } from './types';

export const listVaultFilesFunction: ToolFunction = {
  name: 'listVaultFiles',
  description: 'List all files and folders in the Obsidian vault',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Optional path to list files from (defaults to vault root)'
      }
    },
    required: []
  },
  requiresConfirmation: false // Read-only operation, no confirmation needed
};

export async function listVaultFiles(app: App, args: { path?: string }): Promise<ToolResult> {
  try {
    const { path = '' } = args;
    const vault = app.vault;
    
    // Get all files and folders
    const files = vault.getAllLoadedFiles();
    
    // Filter by path if provided
    const filteredFiles = files.filter(file => {
      if (path) {
        return file.path.startsWith(path);
      }
      return true;
    });
    
    // Sort files and folders
    const sortedFiles = filteredFiles
      .map(file => ({
        name: file.name,
        type: file instanceof TFile ? 'file' as const : 'folder' as const,
        path: file.path
      }))
      .sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    
    return {
      type: 'file-list',
      files: sortedFiles
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error listing vault files: ${error}`
    };
  }
} 