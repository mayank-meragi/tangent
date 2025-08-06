import { MODEL_CONFIGS, ModelConfig, PriceByContext } from '../../modelConfigs';

/**
 * Returns the cost for a given model, input context, and output context (in tokens).
 * @param modelId The model id (string)
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns The total cost (number), or null if model not found or pricing unavailable
 */
export function calculateModelCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  currencyMultiplier = 85
): { inputCost: number; outputCost: number; totalCost: number } | undefined {
  const model: ModelConfig | undefined = MODEL_CONFIGS.find(m => m.id === modelId);
  if (!model || !model.inputCostPerMillion || !model.outputCostPerMillion) return;

  const getPrice = (arr: PriceByContext[], tokens: number): number => {
    // Find the best price tier for the given context size
    // If multiple tiers, pick the one with the largest context <= tokens, else fallback to null context
    let best: PriceByContext | undefined = undefined;
    for (const tier of arr) {
      if (tier.context !== null && tokens <= tier.context) {
        if (!best || (best.context !== null && tier.context < best.context)) best = tier;
      }
    }
    if (!best) best = arr.find(t => t.context === null);
    return best ? best.price : 0;
  };

  const inputPrice = getPrice(model.inputCostPerMillion, inputTokens);
  const outputPrice = getPrice(model.outputCostPerMillion, outputTokens);

  // Prices are per 1M tokens
  const inputCost = (inputTokens / 1_000_000) * (inputPrice * currencyMultiplier);
  const outputCost = (outputTokens / 1_000_000) * (outputPrice * currencyMultiplier);

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}
