// Export all tool types
export * from './types';

// Export all tools for Google GenAI SDK
// Enhanced file operations (replacing old ones)
export { 
  readFile, 
  readFileFunction,
  writeFile, 
  writeFileFunction,
  insertContent,
  insertContentFunction,
  searchAndReplace,
  searchAndReplaceFunction,
  manageFiles,
  manageFilesFunction,
  listVaultFiles,
  listVaultFilesFunction
} from './enhancedFileOperations';

// Memory tools
export { writeToMemory, writeToMemoryFunction } from './memory/writeToMemory';
export { readMemory, readMemoryFunction } from './memory/readMemory';

// Task tools
export { queryDataviewTasks, queryDataviewTasksFunction } from './dataviewTasks';
export { writeDataviewTasks, writeDataviewTasksFunction } from './dataviewTasks';

export type { ToolResult, ToolFunction, ToolCall } from './types';

// Add new tools here as they are created
// export { createNewTool } from './newTool'; 