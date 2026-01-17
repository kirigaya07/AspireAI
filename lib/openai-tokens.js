/**
 * Count tokens using a JavaScript-based estimation algorithm
 * This is a reasonably accurate approximation for OpenAI models (GPT-3.5, GPT-4, etc.)
 * Based on OpenAI's BPE tokenizer patterns: ~4 characters per token for English text
 * @param {string} text - Text to count tokens for
 * @param {string} model - OpenAI model name (default: "gpt-4o-mini")
 * @returns {number} Number of tokens
 */
export function countOpenAITokens(text, model = "gpt-4o-mini") {
  if (!text) return 0;

  try {
    // Improved token estimation based on OpenAI's tokenization patterns
    // OpenAI uses BPE (Byte Pair Encoding) which typically results in:
    // - ~4 characters per token for English text
    // - More tokens for code, special characters, and non-English text
    
    let tokenCount = 0;
    const trimmedText = text.trim();
    
    if (!trimmedText) return 0;

    // Split into words and punctuation
    // This handles spaces, punctuation, and special characters better
    const tokens = trimmedText.match(/\S+/g) || [];
    
    for (const token of tokens) {
      const length = token.length;
      
      // Base estimation: most tokens are ~3-4 characters
      // Short tokens (1-3 chars): usually 1 token
      if (length <= 3) {
        tokenCount += 1;
      }
      // Medium tokens (4-7 chars): usually 1-2 tokens
      else if (length <= 7) {
        tokenCount += Math.ceil(length / 3.5);
      }
      // Longer tokens: split more aggressively
      else {
        tokenCount += Math.ceil(length / 3);
      }
    }

    // Account for spaces (each space is typically part of a token boundary)
    // In BPE, spaces are usually merged with following words
    const spaceCount = (text.match(/\s/g) || []).length;
    tokenCount += Math.ceil(spaceCount * 0.1);

    // Ensure minimum of 1 token for non-empty text
    return Math.max(1, Math.ceil(tokenCount));
  } catch (error) {
    console.warn(
      `Failed to count tokens for model ${model}, using fallback estimation:`,
      error.message
    );
    // Fallback: Conservative estimation (4 characters per token)
    // This is a safe approximation that slightly overestimates
    return Math.max(1, Math.ceil(text.length / 4));
  }
}

/**
 * Calculate tokens for both input and output
 * @param {string} input - Input text
 * @param {string} output - Output text
 * @param {string} model - OpenAI model name (default: "gpt-4o-mini")
 * @returns {Object} Token usage information
 */
export function calculateOpenAITokenUsage(
  input,
  output,
  model = "gpt-4o-mini"
) {
  const inputTokens = countOpenAITokens(input, model);
  const outputTokens = countOpenAITokens(output, model);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}
