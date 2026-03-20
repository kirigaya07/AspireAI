"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { revalidatePath } from "next/cache";
import { trackOpenAIUsage } from "@/lib/ai-helpers";
import { extractJSONFromText } from "@/lib/ai-helpers";

/**
 * Save or update the user's resume content.
 */
export async function saveResume(content) {
  const user = await getAuthenticatedUser();

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { content },
      create: { userId: user.id, content },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

/**
 * Get the user's resume.
 */
export async function getResume() {
  const user = await getAuthenticatedUser();

  return db.resume.findUnique({
    where: { userId: user.id },
  });
}

/**
 * Update resume template preference.
 */
export async function updateResumeTemplate(templateStyle) {
  const user = await getAuthenticatedUser();

  const resume = await db.resume.upsert({
    where: { userId: user.id },
    update: { templateStyle },
    create: { userId: user.id, content: "", templateStyle },
  });

  revalidatePath("/resume");
  return resume;
}

/**
 * Improve a resume section using AI.
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
    7. Incorporate industry-specific keywords that perform well in ATS systems
    8. Maintain the same general information but enhance the presentation

    FORMAT: Return ONLY the improved content as a single paragraph without any additional explanations,
    comments, or formatting. Do not include phrases like "Improved version:" or any other metadata.
  `;

  try {
    const improvedContent = await generateWithOpenAI(prompt);
    await trackOpenAIUsage(
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

/**
 * Analyze resume against a job description and return ATS score.
 */
export async function analyzeATS({ jobDescription }) {
  const user = await getAuthenticatedUserWith({ include: { industryInsight: true } });

  const resume = await db.resume.findUnique({
    where: { userId: user.id },
  });

  if (!resume?.content) {
    throw new Error("Please save your resume before running ATS analysis.");
  }

  if (!jobDescription?.trim()) {
    throw new Error("Please provide a job description to analyze against.");
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume against the job description.

RESUME:
${resume.content}

JOB DESCRIPTION:
${jobDescription}

Provide a detailed ATS analysis. Return ONLY valid JSON (no markdown, no backticks):
{
  "score": <integer 0-100>,
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "sectionScores": {
    "skills": <integer 0-100>,
    "experience": <integer 0-100>,
    "education": <integer 0-100>,
    "formatting": <integer 0-100>
  },
  "topSuggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>"
  ],
  "summary": "<2-3 sentence overall assessment>"
}`;

  try {
    const rawResult = await generateWithOpenAI(prompt);
    const jsonString = extractJSONFromText(rawResult);
    const result = JSON.parse(jsonString);

    if (!result?.score) throw new Error("Invalid ATS analysis response.");

    // Save ATS data to the resume record
    await db.resume.update({
      where: { userId: user.id },
      data: {
        atsScore: result.score,
        atsFeedback: result.summary,
        atsKeywords: {
          matched: result.matchedKeywords || [],
          missing: result.missingKeywords || [],
          sectionScores: result.sectionScores || {},
          topSuggestions: result.topSuggestions || [],
          jobDescription: jobDescription.slice(0, 2000), // store truncated JD
        },
      },
    });

    await trackOpenAIUsage(
      prompt,
      rawResult,
      "ats_analysis",
      "ATS resume analysis"
    );

    revalidatePath("/resume");
    return result;
  } catch (error) {
    console.error("ATS analysis error:", error);
    throw new Error("Failed to analyze resume. Please try again.");
  }
}

/**
 * Get saved ATS data for the user's resume.
 */
export async function getATSData() {
  const user = await getAuthenticatedUser();

  const resume = await db.resume.findUnique({
    where: { userId: user.id },
    select: { atsScore: true, atsFeedback: true, atsKeywords: true },
  });

  if (!resume?.atsScore) return null;

  return {
    score: resume.atsScore,
    feedback: resume.atsFeedback,
    ...(resume.atsKeywords || {}),
  };
}
