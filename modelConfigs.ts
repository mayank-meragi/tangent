// List of available model configurations for the chat plugin
export interface PriceByContext {
  context: number | null; // null means applies to all context sizes
  price: number;
}

export interface ModelConfig {
  id: string;
  label: string;
  description?: string;
  supportsThinking?: boolean;
  defaultThinkingBudget?: number;
  inputCostPerMillion?: PriceByContext[];
  outputCostPerMillion?: PriceByContext[];
}

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast, cost-effective Gemini model for quick responses.',
    supportsThinking: true,
    // Disabled by default for speed
    defaultThinkingBudget: 0,
    inputCostPerMillion: [
      { context: null, price: 0.30 }
    ],
    outputCostPerMillion: [
      { context: null, price: 2.50 }
    ]
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'More capable Gemini model with advanced reasoning.',
    supportsThinking: true,
    // Enabled by default for better reasoning
    defaultThinkingBudget: 8192,
    inputCostPerMillion: [
      { context: 200000, price: 1.25 },
      { context: null, price: 2.5 } // null means >200k ctx
    ],
    outputCostPerMillion: [
      { context: 200000, price: 10 },
      { context: null, price: 15 }
    ]
  },
]; 