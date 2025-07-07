import { tool } from "@langchain/core/tools";
import { App, TFolder } from "obsidian";
import { ToolResult } from "./types";

// Tool: List files and folders in the vault
export const createListVaultFilesTool = (app: App) => tool(
  async ({ dir, onMessage }: { dir?: string, onMessage?: (msg: any) => void }) => {
    if (onMessage) onMessage({ role: 'tool-call', toolName: 'listVaultFiles', toolArgs: { dir } });
    
    try {
      const vault = app.vault;
      const targetPath = dir || '';
      
      // Get all files and folders in the vault
      const files = vault.getAllLoadedFiles();
      
      // Filter files based on the target directory
      const filteredFiles = files.filter(file => {
        if (targetPath === '') {
          // Root directory - only show top-level items
          return !file.path.includes('/') || file.path.split('/').length === 2;
        } else {
          // Specific directory - show items in that directory
          return file.path.startsWith(targetPath + '/') && 
                 file.path.split('/').length === targetPath.split('/').length + 1;
        }
      });
      
      if (filteredFiles.length === 0) {
        return { type: 'text', text: `No files or folders found in ${targetPath || 'vault root'}.` };
      }
      
      const result = filteredFiles.map(file => ({
        name: file.name,
        type: file instanceof TFolder ? 'folder' : 'file' as 'file' | 'folder',
        path: file.path
      }));
      
      return {
        type: 'file-list',
        files: result,
      };
    } catch (error) {
      return { type: 'text', text: `Error accessing vault: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
  {
    name: "listVaultFiles",
    description: "List files and folders in the Obsidian vault. ALWAYS use this tool FIRST before reading any files to see what's available and get the exact file paths. Optionally provide a subdirectory path to explore specific folders.",
    schema: {
      type: "object",
      properties: {
        dir: { type: "string", description: "Optional subdirectory path relative to the vault root to list contents of a specific folder." }
      },
      required: [],
    },
  }
); 