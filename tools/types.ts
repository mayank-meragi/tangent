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

// Template data models for conversation starters
export interface ConversationTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  description: string;
  tags: string[];
  created: string;
  updated: string;
  favorite?: boolean;
  author: string; // "system" for built-in, "user" for custom
  version?: string;
  aliases?: string[];
  variables?: TemplateVariable[];
  settings?: TemplateSettings;    // Template settings for AI behavior
  filePath?: string; // Path to the markdown file for user templates
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default?: any;
  description?: string;
  options?: string[]; // For select type
  required?: boolean;
}

export interface TemplateSettings {
  thinkingEnabled?: boolean;      // Enable/disable thinking
  webSearchEnabled?: boolean;     // Enable/disable web search
  modelId?: string;              // Preferred model ID
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isCustom: boolean;
}

export interface TemplateSearchResult {
  template: ConversationTemplate;
  relevanceScore: number;
  matchedFields: string[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Generic dropdown interfaces for both file and template selection
export interface DropdownItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface DropdownItemMetadata {
  file?: any; // TFile for file items
  template?: ConversationTemplate; // Template for template items
}

// Type validation utilities
export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Template creation/update payloads
export interface CreateTemplatePayload {
  title: string;
  content: string;
  category: string;
  description: string;
  tags?: string[];
  variables?: TemplateVariable[];
  settings?: TemplateSettings;
  favorite?: boolean;
}

export interface UpdateTemplatePayload {
  title?: string;
  content?: string;
  category?: string;
  description?: string;
  tags?: string[];
  variables?: TemplateVariable[];
  settings?: TemplateSettings;
  favorite?: boolean;
} 