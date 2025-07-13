import { App } from 'obsidian';
import { ToolResult, ToolFunction } from '../types';
import { MemoryService } from '../../memoryService';

export const readMemoryFunction: ToolFunction = {
  name: 'readMemory',
  description: 'Read the current content of the AI memory file',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  requiresConfirmation: false
};

export async function readMemory(app: App, args: Record<string, never>): Promise<ToolResult> {
  try {
    const memoryService = new MemoryService(app);
    const content = await memoryService.readMemory();
    
    if (!content.trim()) {
      return {
        type: 'text',
        text: 'Memory file is empty or does not exist.'
      };
    }
    
    return {
      type: 'text',
      text: `Memory content:\n\n${content}`
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error reading memory: ${error}`
    };
  }
} 