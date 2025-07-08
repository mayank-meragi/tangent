// Tool types for Google GenAI SDK
export interface ToolResult {
  type: string;
  text?: string;
  files?: Array<{
    name: string;
    type: 'file' | 'folder';
    path: string;
  }>;
  content?: string;
  error?: string;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  requiresConfirmation?: boolean;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

// New interfaces for confirmation flow
export interface PendingToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface ToolConfirmationResult {
  approved: boolean;
  toolCallId: string;
} 