// List of available model configurations for the chat plugin
export interface ModelConfig {
  id: string;
  label: string;
  description?: string;
  supportsThinking?: boolean;
  defaultThinkingBudget?: number;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast, cost-effective Gemini model for quick responses.',
    supportsThinking: true,
    defaultThinkingBudget: 0 // Disabled by default for speed
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'More capable Gemini model with advanced reasoning.',
    supportsThinking: true,
    defaultThinkingBudget: 8192 // Enabled by default for better reasoning
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    description: 'Previous generation Gemini model for higher quality responses.',
    supportsThinking: false
  },
  // Add more models here as needed
]; 