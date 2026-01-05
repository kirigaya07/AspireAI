import { consumeTokens } from "@/lib/tokens";
import { calculateDeepSeekTokenUsage } from "@/lib/deepseek-tokens";

/**
 * Extracts JSON object from AI response text, handling cases where
 * the AI includes explanatory text before or after the JSON.
 * 
 * @param {string} text - Raw text response from AI
 * @returns {string} - Extracted JSON string
 * @throws {Error} - If no valid JSON object is found
 */
export function extractJSONFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: text must be a non-empty string");
  }

  // Remove markdown code blocks
  let cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  // Find the JSON object by locating the first { and matching closing }
  const firstBrace = cleanedText.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("No JSON object found in response");
  }

  // Extract from first { to the matching closing }
  let braceCount = 0;
  let lastBrace = -1;
  for (let i = firstBrace; i < cleanedText.length; i++) {
    if (cleanedText[i] === "{") braceCount++;
    if (cleanedText[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        break;
      }
    }
  }

  if (lastBrace === -1) {
    throw new Error("Invalid JSON structure - unmatched braces");
  }

  return cleanedText.substring(firstBrace, lastBrace + 1);
}

// New function to track DeepSeek model token usage
export async function trackDeepSeekUsage(
  input,
  output,
  featureType,
  description
) {
  try {
    // Make sure we have valid input and output
    if (!input || !output) {
      console.error("Invalid input or output for token tracking");

      // Use a minimum default token count instead of failing
      const defaultTokens = 100;
      await consumeTokens(
        defaultTokens,
        `${description} (default token count)`,
        featureType
      );

      return {
        success: true,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: defaultTokens,
      };
    }

    // Calculate tokens used by DeepSeek
    const tokenUsage = await calculateDeepSeekTokenUsage(input, output);

    // Double-check that we have a valid token count before consuming
    if (
      !tokenUsage ||
      typeof tokenUsage.totalTokens !== "number" ||
      isNaN(tokenUsage.totalTokens)
    ) {
      console.warn("Invalid token calculation result, using default value");

      // Use a minimum default token count instead of failing
      const defaultTokens = 100;
      await consumeTokens(
        defaultTokens,
        `${description} (default token count)`,
        featureType
      );

      return {
        success: true,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: defaultTokens,
      };
    }

    // Consume tokens based on actual usage
    const result = await consumeTokens(
      tokenUsage.totalTokens,
      `${description} (${tokenUsage.inputTokens} input + ${tokenUsage.outputTokens} output tokens)`,
      featureType
    );

    // Return token usage details
    return {
      ...result,
      ...tokenUsage,
    };
  } catch (error) {
    console.error(`Error tracking DeepSeek usage: ${error.message}`);

    // Use a minimum default token count in case of errors
    const defaultTokens = 100;
    try {
      await consumeTokens(
        defaultTokens,
        `${description} (default token count - error recovery)`,
        featureType
      );
    } catch (secondError) {
      console.error(
        `Failed to use default token count: ${secondError.message}`
      );
    }

    throw error;
  }
}
