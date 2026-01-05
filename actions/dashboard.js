"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateWithDeepSeek } from "@/lib/deepseek";
import { extractJSONFromText } from "@/lib/ai-helpers";

export const generateAIInsights = async (industry) => {
  // Construct a structured prompt to generate industry-specific insights in JSON format
  const prompt = `
  TASK: Generate a detailed analysis of the ${industry} industry in India using ONLY Glassdoor's latest data in JSON format.

  CRITICAL: Return ONLY the JSON object below. Do NOT include any explanatory text, reasoning, or additional content before or after the JSON. Start your response with { and end with }.

  OUTPUT FORMAT: Return ONLY the following JSON structure without ANY explanatory text, markdown formatting, or code block delimiters:
  {
    "salaryRanges": [
      { "role": "string", "min": number, "max": number, "median": number, "location": "India" }
    ],
    "growthRate": number,
    "demandLevel": "HIGH" | "MEDIUM" | "LOW",
    "topSkills": ["string", "string", "string", "string", "string"],
    "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
    "keyTrends": ["string", "string", "string", "string", "string"],
    "recommendedSkills": ["string", "string", "string", "string", "string"]
  }

  REQUIREMENTS:
  1. "salaryRanges" MUST contain EXACTLY 5 of the most in-demand roles in the ${industry} industry with:
     - Salaries in thousands for India
     - Accurate min, max, and median figures from Glassdoor
     - Example: { "role": "Data Scientist", "min": 8, "max": 25, "median": 15, "location": "India" }

  2. "growthRate" MUST be a numeric percentage value (e.g., 8.2 for 8.2% growth) from Glassdoor industry reports

  3. "demandLevel" MUST be one of:
     - "HIGH" (50,000+ job postings on Glassdoor)
     - "MEDIUM" (20,000-50,000 postings)
     - "LOW" (<20,000 postings)

  4. "topSkills" MUST list EXACTLY 5 most valuable technical skills from Glassdoor job postings

  5. "marketOutlook" MUST be one of: "POSITIVE", "NEUTRAL", or "NEGATIVE" based on Glassdoor's industry forecast

  6. "keyTrends" MUST list EXACTLY 5 current trends from Glassdoor industry reports

  7. "recommendedSkills" MUST list EXACTLY 5 emerging skills from Glassdoor's future-jobs data

  VALIDATION:
  - All strings must be properly double-quoted ("string")
  - All arrays must have exactly 5 elements (no more, no less)
  - No comments, explanations, or formatting outside the JSON structure
  - Numbers must be actual numbers without quotation marks
  - Ensure all JSON syntax is valid:
     - Correct use of commas (no trailing commas)
     - Proper matching of brackets and braces
     - No trailing whitespace or special characters
`;

  let text = null;
  try {
    // Use the DeepSeek helper function instead
    text = await generateWithDeepSeek(prompt);

    // Extract JSON from response - handle cases where AI includes explanatory text
    const cleanedText = extractJSONFromText(text);

    // Parse and return the structured JSON response
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating industry insights:", error);
    if (text) {
      console.error("Raw response:", text);
    }
    throw new Error("Failed to generate industry insights: " + error.message);
  }
};

export async function getIndustryInsights() {
  // Authenticate the user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch the user from the database, including their industry insights
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true, // Ensure industry insights are retrieved if they exist
    },
  });

  if (!user) throw new Error("User not found");

  // If the user has no industry insights, generate new ones
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry); // Generate AI-based insights

    // Store the new insights in the database with a scheduled next update
    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set the next update for 7 days later
      },
    });

    return industryInsight;
  }

  // Return the existing industry insights if available
  return user.industryInsight;
}
