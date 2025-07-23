/**
 * Types and interfaces for the AI Tag Suggest command
 */

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  category?: string;
}

export interface TagAnalysisResult {
  suggestions: TagSuggestion[];
  existingTags: string[];
  contentSummary: string;
  analysisTimestamp: Date;
}

export interface TagSuggestSettings {
  enabled: boolean;
  maxSuggestions: number;
  confidenceThreshold: number;
  includeExistingTags: boolean;
  autoApply: boolean;
}

export interface TagSuggestContext {
  filePath: string;
  content: string;
  existingTags: string[];
  metadata: Record<string, any>;
} 