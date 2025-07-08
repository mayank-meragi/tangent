import { App, TFile } from 'obsidian';
import { ToolResult, ToolFunction } from './types';

export const readFileFunction: ToolFunction = {
  name: 'readFile',
  description: 'Read the content of a file from the Obsidian vault',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to read'
      }
    },
    required: ['path']
  },
  requiresConfirmation: false // Read-only operation, no confirmation needed
};

export async function readFile(app: App, args: { path: string }): Promise<ToolResult> {
  try {
    const { path } = args;
    const vault = app.vault;
    
    // Try to get the file
    const file = vault.getAbstractFileByPath(path);
    if (!file) {
      return {
        type: 'error',
        error: `File not found: ${path}`
      };
    }
    
    // Check if it's actually a file (not a folder)
    if (!(file instanceof TFile)) {
      return {
        type: 'error',
        error: `${path} is a folder, not a file`
      };
    }
    
    // Read the file content
    const content = await vault.read(file);
    
    return {
      type: 'text',
      text: content
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error reading file: ${error}`
    };
  }
} 