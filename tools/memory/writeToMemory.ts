import { App } from 'obsidian';
import { ToolResult, ToolFunction } from '../types';
import { MemoryService } from '../../memoryService';

export const writeToMemoryFunction: ToolFunction = {
  name: 'writeToMemory',
  description: `Add or update an entry in the AI memory file. 
  If the content already exists in the memory file, and it is a contradiction, then 
  add new entry telling its a contradiction and why.
  
  Format:
  - Always use bullet points to store memory,
  - Use "-" to start each bullet point,
  
  Example:
  - Users name is John
  - Users age is 30
  `,
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content to append to memory formatted as bullet points'
      }
    },
    required: ['content']
  },
  requiresConfirmation: false
};

export async function writeToMemory(app: App, args: { content: string }): Promise<ToolResult> {
  try {
    const { content } = args;
    const memoryService = new MemoryService(app);
    
    await memoryService.appendToMemory(content);
    
    return {
      type: 'text',
      text: `Successfully appended to memory: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error writing to memory: ${error}`
    };
  }
} 