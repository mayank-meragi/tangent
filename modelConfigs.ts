// List of available model configurations for the chat plugin
export interface ModelConfig {
  id: string;
  label: string;
  description?: string;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast, cost-effective Gemini model for quick responses.'
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    description: 'More capable Gemini model for higher quality responses.'
  },
  // Add more models here as needed
]; 