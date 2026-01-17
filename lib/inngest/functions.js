import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { generateWithOpenAI } from "@/lib/openai";

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" }, // Run every Sunday at midnight
  async ({ event, step }) => {
    const industries = await step.run("Get distinct industries", async () => {
      return await db.user.groupBy({
        by: ["industry"],
        where: {
          industry: {
            not: null,
          },
        },
      });
    });

    for (const { industry } of industries) {
      const prompt = `
  TASK: Generate a detailed analysis of the ${industry} industry in India using ONLY Glassdoor's latest data in JSON format.

  CRITICAL: You MUST return a complete JSON object with ALL the following fields. Do not omit any fields.

  OUTPUT FORMAT: Return ONLY the following JSON structure without ANY explanatory text, markdown formatting, or code block delimiters:
  {
    "salaryRanges": [
      { "role": "string", "min": number, "max": number, "median": number, "location": "India" },
      { "role": "string", "min": number, "max": number, "median": number, "location": "India" },
      { "role": "string", "min": number, "max": number, "median": number, "location": "India" },
      { "role": "string", "min": number, "max": number, "median": number, "location": "India" },
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
     - ALL 5 entries must be provided

  2. "growthRate" MUST be a numeric percentage value (e.g., 8.2 for 8.2% growth) from Glassdoor industry reports

  3. "demandLevel" MUST be one of:
     - "HIGH" (50,000+ job postings on Glassdoor)
     - "MEDIUM" (20,000-50,000 postings)
     - "LOW" (<20,000 postings)

  4. "topSkills" MUST list EXACTLY 5 most valuable technical skills from Glassdoor job postings
     - Must be an array of exactly 5 strings
     - Example: ["Python", "Machine Learning", "Data Analysis", "SQL", "Cloud Computing"]
     - ALL 5 skills must be provided

  5. "marketOutlook" MUST be one of: "POSITIVE", "NEUTRAL", or "NEGATIVE" based on Glassdoor's industry forecast

  6. "keyTrends" MUST list EXACTLY 5 current trends from Glassdoor industry reports
     - Must be an array of exactly 5 strings
     - Example: ["Remote Work", "AI Integration", "Sustainability", "Digital Transformation", "Skill Diversification"]
     - ALL 5 trends must be provided

  7. "recommendedSkills" MUST list EXACTLY 5 emerging skills from Glassdoor's future-jobs data
     - Must be an array of exactly 5 strings
     - Example: ["Quantum Computing", "Blockchain", "Edge Computing", "Cybersecurity", "Natural Language Processing"]
     - ALL 5 skills must be provided

  VALIDATION:
  - All strings must be properly double-quoted ("string")
  - All arrays must have exactly 5 elements (no more, no less)
  - No comments, explanations, or formatting outside the JSON structure
  - Numbers must be actual numbers without quotation marks
  - Ensure all JSON syntax is valid:
     - Correct use of commas (no trailing commas)
     - Proper matching of brackets and braces
     - No trailing whitespace or special characters
  - ALL fields are required and must be present in the response
  - Do not include any text before or after the JSON object
  - The response must be a valid JSON object that can be parsed by JSON.parse()
`;
      // Get the response using OpenAI
      const result = await step.run(
        `Generate insights for ${industry}`,
        async () => {
          return await generateWithOpenAI(prompt);
        }
      );

      // Process the result, knowing it's already text
      const insights = await step.run(
        `Process insights for ${industry}`,
        async () => {
          try {
            // Validate the response
            if (!result || typeof result !== "string") {
              throw new Error(
                "Invalid response from API: Response is empty or not a string"
              );
            }

            // Log the raw response for debugging
            console.log("Raw API Response:", result);

            // Clean the response by removing any potential code block formatting and extra text
            const cleanedText = result
              .replace(/```(?:json)?\n?/g, "") // Remove code block markers
              .replace(/^[^{]*/, "") // Remove any text before the first {
              .replace(/[^}]*$/, "") // Remove any text after the last }
              .trim();

            // Validate the cleaned text
            if (
              !cleanedText ||
              !cleanedText.startsWith("{") ||
              !cleanedText.endsWith("}")
            ) {
              console.error("Invalid JSON structure:", cleanedText);
              throw new Error("Invalid JSON structure in API response");
            }

            // Log the cleaned text for debugging
            console.log("Cleaned JSON:", cleanedText);

            // Attempt to parse the cleaned JSON
            const parsedData = JSON.parse(cleanedText);

            // Log the parsed data for debugging
            console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));

            // Validate the parsed data structure
            if (!parsedData || typeof parsedData !== "object") {
              throw new Error("Parsed data is not a valid object");
            }

            // Validate required fields
            const requiredFields = [
              "salaryRanges",
              "growthRate",
              "demandLevel",
              "topSkills",
              "marketOutlook",
              "keyTrends",
              "recommendedSkills",
            ];
            const missingFields = requiredFields.filter(
              (field) => !(field in parsedData)
            );

            if (missingFields.length > 0) {
              console.error("Missing fields:", missingFields);
              console.error("Available fields:", Object.keys(parsedData));
              throw new Error(
                `Missing required fields: ${missingFields.join(", ")}`
              );
            }

            // Validate array lengths
            const arrayFields = [
              "salaryRanges",
              "topSkills",
              "keyTrends",
              "recommendedSkills",
            ];
            const invalidArrays = arrayFields.filter((field) => {
              const array = parsedData[field];
              return !Array.isArray(array) || array.length !== 5;
            });

            if (invalidArrays.length > 0) {
              console.error(
                "Invalid array lengths:",
                invalidArrays.map((field) => ({
                  field,
                  length: parsedData[field]?.length,
                  value: parsedData[field],
                }))
              );
              throw new Error(
                `Invalid array lengths for fields: ${invalidArrays.join(", ")}`
              );
            }

            return parsedData;
          } catch (error) {
            console.error("Error processing insights:", error);
            console.error("Raw response:", result);
            throw new Error(
              `Failed to process industry insights: ${error.message}`
            );
          }
        }
      );

      // Update the database with the new insights
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: {
            industry,
          },
          data: {
            ...insights,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);
