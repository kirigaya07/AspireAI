"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { consumeTokens } from "@/lib/tokens";
import { buildInterviewerSystemPrompt, buildScoringPrompt } from "@/lib/interview-prompts";
import { extractJSONFromText } from "@/lib/ai-helpers";
import { revalidatePath } from "next/cache";

const SESSION_TOKEN_COST = 200;

/**
 * Create a new interview session and get the opening message from the AI.
 */
export async function createInterviewSession({ jobTitle, company, type, difficulty }) {
  const user = await getAuthenticatedUserWith({ include: { industryInsight: true } });

  // Deduct tokens (throws if insufficient)
  try {
    await consumeTokens(
      SESSION_TOKEN_COST,
      `AI Interview Session: ${jobTitle}`,
      "interview_agent"
    );
  } catch {
    throw new Error("Insufficient tokens. Please purchase more tokens to continue.");
  }

  const systemPrompt = buildInterviewerSystemPrompt({
    jobTitle,
    company,
    type,
    difficulty,
    candidateName: user.name,
    candidateSkills: user.skills,
    candidateIndustry: user.industry,
  });

  // Create session in DB
  const session = await db.interviewSession.create({
    data: {
      userId: user.id,
      jobTitle,
      company: company || null,
      type,
      difficulty,
      status: "ACTIVE",
      messages: {
        create: {
          role: "ASSISTANT",
          content: "__SYSTEM__", // placeholder — we store the system prompt separately
        },
      },
    },
  });

  // Generate the opening message from the AI interviewer
  const openingPrompt = `${systemPrompt}\n\nBegin the interview now with your introduction and first question.`;
  const openingMessage = await generateWithOpenAI(openingPrompt);

  // Replace the placeholder with the real opening message
  await db.interviewMessage.deleteMany({ where: { sessionId: session.id } });

  await db.interviewMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: openingMessage,
    },
  });

  revalidatePath("/interview/agent");

  return {
    sessionId: session.id,
    openingMessage,
  };
}

/**
 * Send a message in an active interview session and get the AI's response.
 */
export async function sendInterviewMessage(sessionId, userMessage) {
  const user = await getAuthenticatedUserWith({ include: { industryInsight: true } });

  const session = await db.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) throw new Error("Session not found or already completed.");

  // Save user message
  await db.interviewMessage.create({
    data: { sessionId, role: "USER", content: userMessage },
  });

  // Build conversation history for the AI
  const systemPrompt = buildInterviewerSystemPrompt({
    jobTitle: session.jobTitle,
    company: session.company,
    type: session.type,
    difficulty: session.difficulty,
    candidateName: user.name,
    candidateSkills: user.skills,
    candidateIndustry: user.industry,
  });

  const conversationHistory = session.messages
    .filter(m => m.content !== "__SYSTEM__")
    .map(m => `${m.role === "ASSISTANT" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}

CONVERSATION SO FAR:
${conversationHistory}

Candidate: ${userMessage}

Interviewer:`;

  const aiResponse = await generateWithOpenAI(fullPrompt);

  // Save AI response
  await db.interviewMessage.create({
    data: { sessionId, role: "ASSISTANT", content: aiResponse },
  });

  // Check if the interview is complete
  const isComplete = aiResponse.includes("[INTERVIEW_COMPLETE]");

  if (isComplete) {
    const cleanResponse = aiResponse.replace("[INTERVIEW_COMPLETE]", "").trim();

    // Update the saved response without the marker
    await db.interviewMessage.updateMany({
      where: { sessionId, content: aiResponse },
      data: { content: cleanResponse },
    });

    // Mark session as completed and generate score
    await db.interviewSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    return {
      message: cleanResponse,
      isComplete: true,
      sessionId,
    };
  }

  return {
    message: aiResponse,
    isComplete: false,
    sessionId,
  };
}

/**
 * End an interview session early (user clicks "End Interview").
 */
export async function endInterviewSession(sessionId) {
  const user = await getAuthenticatedUserWith({});

  await db.interviewSession.update({
    where: { id: sessionId, userId: user.id },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/interview/agent");
  revalidatePath("/interview");
}

/**
 * Generate and save the score/feedback for a completed session.
 */
export async function generateSessionFeedback(sessionId) {
  const user = await getAuthenticatedUserWith({});

  const session = await db.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) throw new Error("Session not found.");

  // If already scored, return cached result
  if (session.score !== null) {
    return {
      score: session.score,
      feedback: session.feedback,
      strengths: session.strengths,
      improvements: session.improvements,
    };
  }

  const scoringPrompt = buildScoringPrompt({
    messages: session.messages,
    jobTitle: session.jobTitle,
    type: session.type,
    difficulty: session.difficulty,
  });

  const rawResult = await generateWithOpenAI(scoringPrompt);
  const jsonString = extractJSONFromText(rawResult);
  const result = JSON.parse(jsonString);

  if (!result) throw new Error("Failed to generate feedback. Please try again.");

  const updated = await db.interviewSession.update({
    where: { id: sessionId },
    data: {
      score: result.score,
      feedback: result.summary,
      strengths: result.strengths || [],
      improvements: result.improvements || [],
    },
  });

  revalidatePath("/interview");
  revalidatePath("/interview/agent");

  return {
    score: result.score,
    feedback: result.summary,
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    communicationScore: result.communicationScore,
    technicalScore: result.technicalScore,
    confidenceScore: result.confidenceScore,
    recommendation: result.recommendation,
  };
}

/**
 * Get all interview sessions for the current user.
 */
export async function getInterviewSessions() {
  const user = await getAuthenticatedUserWith({});

  return db.interviewSession.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/**
 * Get a single interview session with messages.
 */
export async function getInterviewSession(sessionId) {
  const user = await getAuthenticatedUserWith({});

  return db.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
