"use server";

import OpenAI from "openai";

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate content using OpenAI API
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Optional configuration
 * @param {string} options.model - Model to use (default: "gpt-4o-mini")
 * @param {number} options.temperature - Temperature for generation (default: 0.7)
 * @param {number} options.maxTokens - Maximum tokens to generate (default: 2000)
 * @returns {Promise<string>} The generated content
 * @throws {Error} If prompt is invalid, API key is missing, or API request fails
 */
export async function generateWithOpenAI(
  prompt,
  options = {}
) {
  try {
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error("Invalid prompt: Prompt must be a non-empty string");
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const {
      model = "gpt-4o-mini",
      temperature = 0.7,
      maxTokens = 2000,
    } = options;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant that provides responses in the exact format requested.",
        },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    // Validate the response structure
    if (
      !response ||
      !response.choices ||
      !Array.isArray(response.choices) ||
      response.choices.length === 0
    ) {
      console.error("Invalid API Response Structure:", response);
      throw new Error("Invalid response structure from API");
    }

    const content = response.choices[0]?.message?.content;

    // Validate the content
    if (!content || typeof content !== "string") {
      console.error("Invalid Content in Response:", response.choices[0]);
      throw new Error("Invalid content in API response");
    }

    return content;
  } catch (error) {
    console.error("Error generating content with OpenAI:", error);
    
    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}
