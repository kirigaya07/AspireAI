"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { revalidatePath } from "next/cache";
import { trackOpenAIUsage } from "@/lib/ai-helpers";

/**
 * Save or update user's resume content
 * @param {string} content - The resume content
 * @returns {Promise<Object>} The saved resume object
 */
export async function saveResume(content) {
  const user = await getAuthenticatedUser();

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

/**
 * Get the user's resume
 * @returns {Promise<Object|null>} The resume object or null if not found
 */
export async function getResume() {
  const user = await getAuthenticatedUser();

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

/**
 * Improve resume content using AI
 * @param {Object} params - Parameters
 * @param {string} params.current - Current resume content
 * @param {string} params.type - Type of content being improved
 * @returns {Promise<string>} Improved content
 */
export async function improveWithAI({ current, type }) {
  const user = await getAuthenticatedUserWith({
    include: { industryInsight: true },
  });

  const prompt = `
    TASK: Improve a resume ${type} description for a ${user.industry} professional.
    
    CURRENT CONTENT: "${current}"
    
    REQUIREMENTS:
    1. Transform the content to be more impactful, quantifiable, and aligned with industry standards
    2. Use strong action verbs at the beginning of phrases
    3. Include specific metrics and measurable results where appropriate (percentages, numbers, etc.)
    4. Highlight relevant technical skills for the ${user.industry} industry
    5. Keep the content concise yet detailed and professional
    6. Focus on achievements and outcomes rather than just responsibilities
    7. Incorporate industry-specific keywords that would perform well in ATS systems
    8. Maintain the same general information but enhance the presentation
    
    FORMAT: Return ONLY the improved content as a single paragraph without any additional explanations, 
    comments, or formatting. Do not include phrases like "Improved version:" or any other metadata.
  `;

  try {
    const improvedContent = await generateWithOpenAI(prompt);
    trackOpenAIUsage(
      prompt,
      improvedContent,
      "resume_improvement",
      `Improved ${type} description for ${user.industry} professional`
    );

    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}
