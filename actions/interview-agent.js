"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { consumeTokens, addTokens } from "@/lib/tokens";
import { buildInterviewerSystemPrompt, buildScoringPrompt, buildGapAnalysisPrompt } from "@/lib/interview-prompts";
import { extractJSONFromText } from "@/lib/ai-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
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

  try {
    const systemPrompt = buildInterviewerSystemPrompt({
      jobTitle,
      company,
      type,
      difficulty,
      candidateName: user.name,
      candidateSkills: user.skills,
      candidateIndustry: user.industry,
    });

    // Generate the opening message from the AI interviewer
    const openingPrompt = `${systemPrompt}\n\nBegin the interview now with your introduction and first question.`;
    const openingMessage = await generateWithOpenAI(openingPrompt);

    // Create the session with its opening message in one write
    const session = await db.interviewSession.create({
      data: {
        userId: user.id,
        jobTitle,
        company: company || null,
        type,
        difficulty,
        status: "ACTIVE",
        messages: {
          create: { role: "ASSISTANT", content: openingMessage },
        },
      },
    });

    revalidatePath("/interview/agent");

    return {
      sessionId: session.id,
      openingMessage,
    };
  } catch (err) {
    // Refund: the AI call or DB write failed, so nothing usable was created.
    await addTokens(SESSION_TOKEN_COST, "Refund: AI Interview Session failed").catch(() => {});
    throw err;
  }
}

/**
 * Send a message in an active interview session and get the AI's response.
 */
export async function sendInterviewMessage(sessionId, userMessage) {
  const user = await getAuthenticatedUserWith({ include: { industryInsight: true } });
  await checkRateLimit(user.id, "ai.interview.message", 30, 60_000);

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

  // Check if the interview is complete
  const isComplete = aiResponse.includes("[INTERVIEW_COMPLETE]");
  // Strip the sentinel before persisting so the DB never stores it
  const messageContent = isComplete
    ? aiResponse.replace("[INTERVIEW_COMPLETE]", "").trim()
    : aiResponse;

  // Save AI response
  await db.interviewMessage.create({
    data: { sessionId, role: "ASSISTANT", content: messageContent },
  });

  if (isComplete) {
    // Mark session as completed and generate score
    await db.interviewSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    return {
      message: messageContent,
      isComplete: true,
      sessionId,
    };
  }

  return {
    message: messageContent,
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
 * Analyze resume gaps based on interview weaknesses.
 * Costs 100 tokens.
 */
export async function analyzeResumeGaps(sessionId) {
  const user = await getAuthenticatedUserWith({ include: { resume: true } });
  await checkRateLimit(user.id, "ai.gap-analysis", 5, 300_000);

  const session = await db.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) throw new Error("Session not found.");

  // Return cached result if already analyzed
  if (session.gapAnalysis) return session.gapAnalysis;

  if (!session.improvements?.length) {
    throw new Error("Complete the interview and generate feedback before analyzing gaps.");
  }

  if (!user.resume?.content) {
    throw new Error("No resume found. Please build your resume first.");
  }

  try {
    await consumeTokens(100, "Resume Gap Analysis", "gap_analyzer");
  } catch {
    throw new Error("Insufficient tokens. Please purchase more tokens to continue.");
  }

  try {
    const prompt = buildGapAnalysisPrompt({
      improvements: session.improvements,
      jobTitle: session.jobTitle,
      type: session.type,
      resumeContent: user.resume.content,
    });

    const raw = await generateWithOpenAI(prompt);
    const jsonString = extractJSONFromText(raw);
    const result = JSON.parse(jsonString);

    await db.interviewSession.update({
      where: { id: sessionId },
      data: { gapAnalysis: result },
    });

    revalidatePath("/interview/agent");
    return result;
  } catch (err) {
    // Refund: the AI call or JSON parse failed, so the user got nothing usable.
    await addTokens(100, "Refund: Resume Gap Analysis failed").catch(() => {});
    throw err;
  }
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
