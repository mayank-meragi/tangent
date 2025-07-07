import { tool } from "@langchain/core/tools";
import { App, TFile } from "obsidian";
import { ToolResult } from "./types";

// Tool: Read contents of a file in the vault
export const createReadFileTool = (app: App) => tool(
  async ({ filePath, onMessage }: { filePath: string, onMessage?: (msg: any) => void }) => {
    if (onMessage) onMessage({ role: 'tool-call', toolName: 'readFile', toolArgs: { filePath } });
    
    try {
      const vault = app.vault;
      
      // Get the file by path
      const file = vault.getAbstractFileByPath(filePath);
      
      if (!file) {
        return { type: 'text', text: `File not found: ${filePath}` };
      }
      
      if (!(file instanceof TFile)) {
        return { type: 'text', text: `Path is not a file: ${filePath}` };
      }
      
      // Use cachedRead for better performance on loaded files
      const content = await vault.cachedRead(file);
      
      return {
        type: 'text',
        text: `Contents of ${filePath}:\n\n${content}`
      };
    } catch (error) {
      return { type: 'text', text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
  {
    name: "readFile",
    description: "Read the contents of a file in the Obsidian vault using cached read for better performance. Use this ONLY after listing files first to find the correct file path. Provide the exact file path as shown in the file listing.",
    schema: {
      type: "object",
      properties: {
        filePath: { 
          type: "string", 
          description: "The exact full path to the file in the vault as shown in listVaultFiles results (e.g., 'folder/note.md')" 
        }
      },
      required: ["filePath"],
    },
  }
); 