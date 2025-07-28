import { App, TFile, TFolder } from 'obsidian';
import { ToolResult, ToolFunction } from './types';
import {
  createDailyNote,
  appHasDailyNotesPluginLoaded,
  getAllDailyNotes,
  getDailyNote
} from 'obsidian-daily-notes-interface';
import moment from 'moment';

// Helper functions for daily notes
async function getOrCreateDailyNote(app: App, date: string): Promise<TFile> {
  // Check if daily notes plugin is loaded
  if (!appHasDailyNotesPluginLoaded()) {
    throw new Error('Daily Notes plugin is not enabled');
  }

  // Parse date string to moment object
  const momentDate = moment(date, 'YYYY-MM-DD');
  if (!momentDate.isValid()) {
    throw new Error(`Invalid date format: ${date}. Use YYYY-MM-DD format.`);
  }

  // Get all daily notes for caching
  const allDailyNotes = getAllDailyNotes();

  // Try to get existing daily note
  let dailyNote = getDailyNote(momentDate, allDailyNotes);

  if (!dailyNote) {
    // Create new daily note with automatic template application
    dailyNote = await createDailyNote(momentDate);
  }

  return dailyNote;
}

function getExistingDailyNote(app: App, date: string): TFile | null {
  if (!appHasDailyNotesPluginLoaded()) {
    return null;
  }

  const momentDate = moment(date, 'YYYY-MM-DD');
  if (!momentDate.isValid()) {
    return null;
  }

  const allDailyNotes = getAllDailyNotes();
  return getDailyNote(momentDate, allDailyNotes);
}

// Enhanced readFile with line numbers
export const readFileFunction: ToolFunction = {
  name: 'readFile',
  description: `Read the content of a file/daily note from the Obsidian vault with line numbers. 
  Returns content with line numbers prefixed for easy reference.

  Daily notes:
  - If trying to get daily notes, set the isDailyNote parameter to true.
  - Give the date in YYYY-MM-DD format.
  - Daily notes for that date will be accessed if they exist.
  - No need to specify the path parameter.

  File operations:
  - If trying to get a file, set the isDailyNote parameter to false.
  - Give the path to the file.
  - The path is relative to the vault root.
  - No need to specify the date parameter.
  
  Guidelines:
  - Read the file only if the contents of the file are not present in the 
  conversation history.
  
  `,
  parameters: {
    type: 'object',
    properties: {
      isDailyNote: {
        type: 'boolean',
        description: 'Whether to operate on a daily note'
      },
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD format (required when isDailyNote is true)'
      },
      path: {
        type: 'string',
        description: 'The path to the file to read (relative to vault root, required when isDailyNote is false)'
      }
    },
    required: ['isDailyNote']
  },
  requiresConfirmation: false
};

export async function readFile(app: App, args: { isDailyNote: boolean; date?: string; path?: string }): Promise<ToolResult> {
  try {
    const { isDailyNote, date, path } = args;
    const vault = app.vault;

    let file: TFile;

    if (isDailyNote) {
      if (!date) {
        return {
          type: 'error',
          error: 'Date is required when isDailyNote is true'
        };
      }

      const dailyNote = getExistingDailyNote(app, date);
      if (!dailyNote) {
        return {
          type: 'error',
          error: `Daily note for ${date} does not exist. Use writeFile or insertContent to create it.`
        };
      }
      file = dailyNote;
    } else {
      if (!path) {
        return {
          type: 'error',
          error: 'Path is required when isDailyNote is false'
        };
      }

      // Try to get the file
      const abstractFile = vault.getAbstractFileByPath(path);
      if (!abstractFile) {
        return {
          type: 'error',
          error: `File not found: ${path}`
        };
      }

      // Check if it's actually a file (not a folder)
      if (!(abstractFile instanceof TFile)) {
        return {
          type: 'error',
          error: `${path} is a folder, not a file`
        };
      }
      file = abstractFile;
    }

    // Read the file content
    const content = await vault.read(file);

    // Add line numbers to the content
    const lines = content.split('\n');
    const numberedContent = lines.map((line, index) => `${index + 1} | ${line}`).join('\n');

    return {
      type: 'text',
      text: numberedContent
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error reading file: ${error}`
    };
  }
}

// Enhanced writeFile with line count validation
export const writeFileFunction: ToolFunction = {
  name: 'writeFile',
  description: `
  Write complete content to a file. If the file exists, it will be overwritten. 
  If it doesn't exist, it will be created. Automatically creates any directories needed. 
  
  Daily notes:
  - If trying to get daily notes, set the isDailyNote parameter to true.
  - Give the date in YYYY-MM-DD format.
  - Daily notes for that date will be accessed, and if it doesn't exist, it will be created.
  - No need to specify the path parameter.
  
  File operations:
  - If trying to get a file, set the isDailyNote parameter to false.
  - Give the path to the file.
  - The path is relative to the vault root.
  - No need to specify the date parameter.
  
  `,
  parameters: {
    type: 'object',
    properties: {
      isDailyNote: {
        type: 'boolean',
        description: 'Whether to operate on a daily note'
      },
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD format (required when isDailyNote is true)'
      },
      path: {
        type: 'string',
        description: 'The path to the file to write (relative to vault root, required when isDailyNote is false)'
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
    required: ['isDailyNote', 'content']
  },
  requiresConfirmation: true
};

export async function writeFile(app: App, args: { isDailyNote: boolean; date?: string; path?: string; content: string; lineCount?: number }): Promise<ToolResult> {
  try {
    const { isDailyNote, date, path, content } = args;
    const vault = app.vault;

    let file: TFile;
    let filePath: string;

    if (isDailyNote) {
      if (!date) {
        return {
          type: 'error',
          error: 'Date is required when isDailyNote is true'
        };
      }

      try {
        file = await getOrCreateDailyNote(app, date);
        filePath = file.path;
      } catch (error) {
        return {
          type: 'error',
          error: `Error with daily note: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else {
      if (!path) {
        return {
          type: 'error',
          error: 'Path is required when isDailyNote is false'
        };
      }

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
        file = existingFile;
      } else {
        // File doesn't exist, create it
        await vault.create(path, content);
        const actualLineCount = content.split('\n').length;
        return {
          type: 'text',
          text: `Successfully created file: ${path} (${actualLineCount} lines)`
        };
      }
      filePath = path;
    }

    // Modify the file
    await vault.modify(file, content);
    const actualLineCount = content.split('\n').length;
    return {
      type: 'text',
      text: `Successfully updated file: ${filePath} (${actualLineCount} lines)`
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error writing file: ${error}`
    };
  }
}

// New insertContent tool
export const insertContentFunction: ToolFunction = {
  name: 'insertContent',
  description: `
  Insert content at specific line positions in a file. Allows precise insertions without overwriting existing content. 
  Supports multiple insertions in a single operation. For daily notes, automatically creates with template if needed.

  Daily notes:
  - If trying to get daily notes, set the isDailyNote parameter to true.
  - Give the date in YYYY-MM-DD format.
  - Daily notes for that date will be accessed, and if it doesn't exist, it will be created.
  - No need to specify the path parameter.

  File operations:
  - If trying to get a file, set the isDailyNote parameter to false.
  - Give the path to the file.
  - The path is relative to the vault root.
  - No need to specify the date parameter.
  
  `,
  parameters: {
    type: 'object',
    properties: {
      isDailyNote: {
        type: 'boolean',
        description: 'Whether to operate on a daily note'
      },
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD format (required when isDailyNote is true)'
      },
      path: {
        type: 'string',
        description: 'The path to the file to insert content into (required when isDailyNote is false)'
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
    required: ['isDailyNote', 'operations']
  },
  requiresConfirmation: true
};

export async function insertContent(app: App, args: { isDailyNote: boolean; date?: string; path?: string; operations: Array<{ startLine: number; content: string }> }): Promise<ToolResult> {
  try {
    console.log('[insertContent] called with args:', JSON.stringify(args));
    const { isDailyNote, date, path, operations } = args;
    const vault = app.vault;

    let file: TFile;

    if (isDailyNote) {
      if (!date) {
        return {
          type: 'error',
          error: 'Date is required when isDailyNote is true'
        };
      }

      try {
        file = await getOrCreateDailyNote(app, date);
        console.log('[insertContent] daily note lookup:', `Found file (${file.path})`);
      } catch (error) {
        console.log('[insertContent] ERROR: Daily note error:', error);
        return {
          type: 'error',
          error: `Error with daily note: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else {
      if (!path) {
        return {
          type: 'error',
          error: 'Path is required when isDailyNote is false'
        };
      }

      // Get the file
      const abstractFile = vault.getAbstractFileByPath(path);
      console.log('[insertContent] file lookup:', abstractFile ? `Found file (${abstractFile.path})` : 'File not found');
      if (!abstractFile || !(abstractFile instanceof TFile)) {
        console.log('[insertContent] ERROR: File not found or not a TFile:', path);
        return {
          type: 'error',
          error: `File not found: ${path}`
        };
      }
      file = abstractFile;
    }

    // Read current content
    const currentContent = await vault.read(file);
    const lines = currentContent.split('\n');
    console.log(`[insertContent] Read file: ${path}, line count: ${lines.length}`);

    // Sort operations by startLine in descending order to avoid line number shifts
    const sortedOperations = [...operations].sort((a, b) => b.startLine - a.startLine);
    console.log('[insertContent] Sorted operations:', JSON.stringify(sortedOperations));

    // Apply insertions
    for (const operation of sortedOperations) {
      let { startLine } = operation;
      const { content } = operation;
      const originalStartLine = startLine;
      // If startLine is greater than lines.length + 1, append at end
      // This prevents out-of-bounds errors and makes the tool more user-friendly
      if (startLine < 1) {
        console.log(`[insertContent] ERROR: Invalid line number: ${startLine}`);
        return {
          type: 'error',
          error: `Invalid line number: ${startLine}. Line number must be >= 1.`
        };
      }
      if (startLine > lines.length + 1) {
        // Clamp to end of file
        startLine = lines.length + 1;
        console.log(`[insertContent] Adjusted startLine from ${originalStartLine} to ${startLine} (end of file)`);
      }
      const contentLines = content.split('\n');
      console.log(`[insertContent] Inserting at line ${startLine}:`, contentLines);
      lines.splice(startLine - 1, 0, ...contentLines);
    }

    // Write back the modified content
    const newContent = lines.join('\n');
    console.log(`[insertContent] Writing modified content to file: ${path}, new line count: ${lines.length}`);
    await vault.modify(file, newContent);
    console.log('[insertContent] Successfully wrote modified content.');

    return {
      type: 'text',
      text: `Successfully inserted content at ${operations.length} location(s) in ${path}`
    };
  } catch (error) {
    console.log('[insertContent] ERROR:', error);
    return {
      type: 'error',
      error: `Error inserting content: ${error}`
    };
  }
}

// New searchAndReplace tool
export const searchAndReplaceFunction: ToolFunction = {
  name: 'searchAndReplace',
  description: 'Perform search and replace operations on a file. Supports regex patterns, line range restrictions, and case sensitivity options.',
  parameters: {
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
  requiresConfirmation: true
};

export async function searchAndReplace(app: App, args: { path: string; operations: Array<{ search: string; replace: string; startLine?: number; endLine?: number; useRegex?: boolean; ignoreCase?: boolean }> }): Promise<ToolResult> {
  try {
    const { path, operations } = args;
    const vault = app.vault;

    // Get the file
    const file = vault.getAbstractFileByPath(path);
    if (!file || !(file instanceof TFile)) {
      return {
        type: 'error',
        error: `File not found: ${path}`
      };
    }

    // Read current content
    const currentContent = await vault.read(file);
    const lines = currentContent.split('\n');

    let totalReplacements = 0;

    // Apply each operation
    for (const operation of operations) {
      const { search, replace, startLine, endLine, useRegex = false, ignoreCase = false } = operation;

      // Determine line range
      const start = startLine ? Math.max(1, startLine) : 1;
      const end = endLine ? Math.min(lines.length, endLine) : lines.length;

      // Process lines in range
      for (let i = start - 1; i < end; i++) {
        const line = lines[i];
        let replacements = 0;

        if (useRegex) {
          try {
            const flags = ignoreCase ? 'gi' : 'g';
            const regex = new RegExp(search, flags);
            const newLine = line.replace(regex, replace);
            if (newLine !== line) {
              lines[i] = newLine;
              replacements++;
            }
          } catch (error) {
            return {
              type: 'error',
              error: `Invalid regex pattern: ${search}`
            };
          }
        } else {
          const searchText = ignoreCase ? search.toLowerCase() : search;
          const lineText = ignoreCase ? line.toLowerCase() : line;

          if (lineText.includes(searchText)) {
            const newLine = ignoreCase
              ? line.replace(new RegExp(search, 'gi'), replace)
              : line.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
            lines[i] = newLine;
            replacements++;
          }
        }

        totalReplacements += replacements;
      }
    }

    // Write back the modified content
    const newContent = lines.join('\n');
    await vault.modify(file, newContent);

    return {
      type: 'text',
      text: `Successfully performed ${totalReplacements} replacement(s) in ${path}`
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error performing search and replace: ${error}`
    };
  }
}

// New manageFiles tool
export const manageFilesFunction: ToolFunction = {
  name: 'manageFiles',
  description: 'Perform file and folder management operations like moving, renaming, deleting, and creating folders. Can execute multiple operations in a single call.',
  parameters: {
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
  requiresConfirmation: true
};

export async function manageFiles(app: App, args: { operations: Array<{ action: string; sourcePath?: string; destinationPath?: string; path?: string }> }): Promise<ToolResult> {
  try {
    const { operations } = args;
    const vault = app.vault;
    const results: string[] = [];

    for (const operation of operations) {
      const { action, sourcePath, destinationPath, path } = operation;

      try {
        switch (action) {
          case 'move': {
            if (!sourcePath || !destinationPath) {
              results.push(`Error: move operation requires sourcePath and destinationPath`);
              continue;
            }

            const sourceFile = vault.getAbstractFileByPath(sourcePath);
            if (!sourceFile) {
              results.push(`Error: Source file/folder not found: ${sourcePath}`);
              continue;
            }

            await vault.rename(sourceFile, destinationPath);
            results.push(`Successfully moved: ${sourcePath} → ${destinationPath}`);
            break;
          }

          case 'delete': {
            const deletePath = sourcePath || path;
            if (!deletePath) {
              results.push(`Error: delete operation requires sourcePath or path`);
              continue;
            }

            const deleteFile = vault.getAbstractFileByPath(deletePath);
            if (!deleteFile) {
              results.push(`Error: File/folder not found: ${deletePath}`);
              continue;
            }

            await vault.delete(deleteFile);
            results.push(`Successfully deleted: ${deletePath}`);
            break;
          }

          case 'create_folder': {
            const folderPath = destinationPath || path;
            if (!folderPath) {
              results.push(`Error: create_folder operation requires destinationPath or path`);
              continue;
            }

            await vault.createFolder(folderPath);
            results.push(`Successfully created folder: ${folderPath}`);
            break;
          }

          default:
            results.push(`Error: Unknown action: ${action}`);
        }
      } catch (error) {
        results.push(`Error in ${action} operation: ${error}`);
      }
    }

    return {
      type: 'text',
      text: results.join('\n')
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error managing files: ${error}`
    };
  }
}

// Enhanced listVaultFiles with better filtering
export const listVaultFilesFunction: ToolFunction = {
  name: 'listVaultFiles',
  description: 'List files and folders in the Obsidian vault with advanced filtering options',
  parameters: {
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
    },
    required: []
  },
  requiresConfirmation: false
};

export async function listVaultFiles(app: App, args: { path?: string; search?: string; type?: string; recursive?: boolean }): Promise<ToolResult> {
  try {
    const { path = '', search = '', type = 'all', recursive = false } = args;
    const vault = app.vault;

    // Get all files and folders
    const files = vault.getAllLoadedFiles();

    // Filter by path
    let filteredFiles = files.filter(file => {
      if (path) {
        return file.path.startsWith(path);
      }
      return true;
    });

    // Filter by type
    if (type !== 'all') {
      filteredFiles = filteredFiles.filter(file => {
        if (type === 'file') return file instanceof TFile;
        if (type === 'folder') return file instanceof TFolder;
        return true;
      });
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by recursive option
    if (!recursive && path) {
      filteredFiles = filteredFiles.filter(file => {
        const relativePath = file.path.substring(path.length);
        return !relativePath.includes('/') || relativePath.startsWith('/');
      });
    }

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