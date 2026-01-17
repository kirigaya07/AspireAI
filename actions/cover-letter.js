"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { trackOpenAIUsage } from "@/lib/ai-helpers";

/**
 * Generate a cover letter using AI
 * @param {Object} data - Cover letter generation data
 * @param {string} data.jobTitle - Job title
 * @param {string} data.companyName - Company name
 * @param {string} data.jobDescription - Job description
 * @returns {Promise<Object>} Generated cover letter object
 */
export async function generateCoverLetter(data) {
  const user = await getAuthenticatedUser();

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
  `;

  try {
    // Generate content first
    const content = await generateWithOpenAI(prompt);

    // Verify content was generated properly
    if (!content) throw new Error("Failed to generate content");

    // Then track token usage with actual input and output
    await trackOpenAIUsage(
      prompt,
      content,
      "cover_letter",
      `Generated Cover Letter for ${data.companyName}`
    );

    // Create the cover letter in database
    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error(error.message || "Failed to generate cover letter");
  }
}

/**
 * Get all cover letters for the authenticated user
 * @returns {Promise<Array>} Array of cover letters
 */
export async function getCoverLetters() {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get a specific cover letter by ID
 * @param {string} id - Cover letter ID
 * @returns {Promise<Object|null>} Cover letter object or null if not found
 */
export async function getCoverLetter(id) {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

/**
 * Delete a cover letter
 * @param {string} id - Cover letter ID
 * @returns {Promise<Object>} Deleted cover letter object
 */
export async function deleteCoverLetter(id) {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}

/**
 * Update a cover letter's content
 * @param {string} id - Cover letter ID
 * @param {string} content - New content
 * @returns {Promise<Object>} Updated cover letter object
 */
export async function updateCoverLetter(id, content) {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.update({
    where: {
      id,
      userId: user.id,
    },
    data: {
      content,
    },
  });
}
