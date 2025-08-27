"use server";

export async function generateWithDeepSeek(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt: Prompt must be a non-empty string");
    }

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key is not configured");
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.APP_URL || "https://aspireai.com", // Your site URL
          "X-Title": "AspireAI", // Your app name
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free", // Updated to the correct model name
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant that provides responses in the exact format requested.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error Response:", error);
      throw new Error(
        error.error?.message ||
          `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Validate the response structure
    if (
      !data ||
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0
    ) {
      console.error("Invalid API Response Structure:", data);
      throw new Error("Invalid response structure from API");
    }

    const content = data.choices[0].message?.content;

    // Validate the content
    if (!content || typeof content !== "string") {
      console.error("Invalid Content in Response:", data.choices[0]);
      throw new Error("Invalid content in API response");
    }

    // Log the response for debugging
    console.log("API Response Content:", content);

    return content;
  } catch (error) {
    console.error("Error generating content with DeepSeek:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}
