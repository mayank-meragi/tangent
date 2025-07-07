import { tool } from "@langchain/core/tools";
import { App, TFile } from "obsidian";
import { ToolResult } from "./types";

// Tool: Write content to a file in the vault
export const createWriteFileTool = (app: App) => tool(
  async ({ filePath, content, onMessage }: { filePath: string, content: string, onMessage?: (msg: any) => void }) => {
    if (onMessage) onMessage({ role: 'tool-call', toolName: 'writeFile', toolArgs: { filePath, content } });
    
    try {
      const vault = app.vault;
      
      // Check if file already exists
      const existingFile = vault.getAbstractFileByPath(filePath);
      
      if (existingFile) {
        // File exists - modify it
        if (!(existingFile instanceof TFile)) {
          return { type: 'text', text: `Path is not a file: ${filePath}` };
        }
        
        // Modify existing file
        await vault.modify(existingFile, content);
        return {
          type: 'text',
          text: `Successfully updated existing file: ${filePath}`
        };
      } else {
        // File doesn't exist - create it
        await vault.create(filePath, content);
        return {
          type: 'text',
          text: `Successfully created new file: ${filePath}`
        };
      }
    } catch (error) {
      return { type: 'text', text: `Error writing file: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
  {
    name: "writeFile",
    description: "Write content to a file in the Obsidian vault. ALWAYS use listVaultFiles FIRST to see existing files and understand the vault structure before writing. Creates new file if it doesn't exist, or modifies existing file. Use exact file paths as shown in the file listing.",
    schema: {
      type: "object",
      properties: {
        filePath: { 
          type: "string", 
          description: "The exact full path where to write the file (e.g., 'folder/note.md', 'new-note.md'). Use paths consistent with those shown in listVaultFiles results. Include .md extension for markdown files." 
        },
        content: {
          type: "string",
          description: "The complete content to write to the file. For existing files, this will replace all current content. Can be markdown, plain text, or any other format."
        }
      },
      required: ["filePath", "content"],
    },
  }
); 