import { App, TFile } from 'obsidian';
import { ToolResult, ToolFunction } from './types';

export const writeFileFunction: ToolFunction = {
  name: 'writeFile',
  description: 'Write content to a file in the Obsidian vault',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['path', 'content']
  },
  requiresConfirmation: true
};

export async function writeFile(app: App, args: { path: string; content: string }): Promise<ToolResult> {
  try {
    const { path, content } = args;
    const vault = app.vault;
    
    // Check if file exists
    const existingFile = vault.getAbstractFileByPath(path);
    
    if (existingFile) {
      // File exists, modify it
      if (!(existingFile instanceof TFile)) {
        return {
          type: 'error',
          error: `${path} is not a file`
        };
      }
      
      await vault.modify(existingFile, content);
      return {
        type: 'text',
        text: `Successfully updated file: ${path}`
      };
    } else {
      // File doesn't exist, create it
      await vault.create(path, content);
      return {
        type: 'text',
        text: `Successfully created file: ${path}`
      };
    }
  } catch (error) {
    return {
      type: 'error',
      error: `Error writing file: ${error}`
    };
  }
} 