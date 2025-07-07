// Tool result type for custom rendering
export type ToolResult =
  | { type: 'file-list'; files: { name: string; type: 'file' | 'folder'; path: string }[] }
  | { type: 'text'; text: string }; 