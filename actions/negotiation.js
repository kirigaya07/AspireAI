"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateWithOpenAI } from "@/lib/openai";
import { consumeTokens, addTokens } from "@/lib/tokens";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildNegotiatorSystemPrompt, buildNegotiationSummaryPrompt } from "@/lib/negotiation-prompts";
import { extractJSONFromText } from "@/lib/ai-helpers";
import { revalidatePath } from "next/cache";

const SESSION_TOKEN_COST = 150;

export async function createNegotiationSession({ jobTitle, company, offerDetails }) {
  if (!jobTitle?.trim() || jobTitle.length > 120)
    throw new Error("Job title is required and must be under 120 characters.");
  if (!offerDetails?.trim() || offerDetails.length > 3000)
    throw new Error("Offer details are required and must be under 3000 characters.");

  const user = await getAuthenticatedUserWith({});

  try {
    await consumeTokens(
      SESSION_TOKEN_COST,
      `Salary Negotiation: ${jobTitle}`,
      "negotiation_coach"
    );
  } catch {
    throw new Error("Insufficient tokens. Please purchase more tokens to continue.");
  }

  try {
    const systemPrompt = buildNegotiatorSystemPrompt({
      jobTitle,
      company,
      offerDetails,
      candidateName: user.name,
    });

    const openingPrompt = `${systemPrompt}\n\nBegin the negotiation by greeting the candidate and referencing the specific offer you've extended.`;
    const openingMessage = await generateWithOpenAI(openingPrompt);

    // Create the session with its opening message in one write
    const session = await db.negotiationSession.create({
      data: {
        userId: user.id,
        jobTitle,
        company: company || null,
        offerDetails,
        status: "ACTIVE",
        messages: {
          create: { role: "ASSISTANT", content: openingMessage },
        },
      },
    });

    revalidatePath("/salary-negotiation");

    return { sessionId: session.id, openingMessage };
  } catch (err) {
    // Refund: the AI call or DB write failed, so nothing usable was created.
    await addTokens(SESSION_TOKEN_COST, "Refund: Salary Negotiation session failed").catch(() => {});
    throw err;
  }
}

export async function sendNegotiationMessage(sessionId, userMessage) {
  const user = await getAuthenticatedUserWith({});
  await checkRateLimit(user.id, "ai.negotiation.message", 30, 60_000);

  const session = await db.negotiationSession.findFirst({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) throw new Error("Session not found or already completed.");

  await db.negotiationMessage.create({
    data: { sessionId, role: "USER", content: userMessage },
  });

  const systemPrompt = buildNegotiatorSystemPrompt({
    jobTitle: session.jobTitle,
    company: session.company,
    offerDetails: session.offerDetails,
    candidateName: user.name,
  });

  const conversationHistory = session.messages
    .map((m) => `${m.role === "ASSISTANT" ? "Hiring Manager" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}

CONVERSATION SO FAR:
${conversationHistory}

Candidate: ${userMessage}

Hiring Manager:`;

  const aiResponse = await generateWithOpenAI(fullPrompt);

  const isComplete = aiResponse.includes("[NEGOTIATION_COMPLETE]");
  // Strip the sentinel before persisting so the DB never stores it
  const messageContent = isComplete
    ? aiResponse.replace("[NEGOTIATION_COMPLETE]", "").trim()
    : aiResponse;

  await db.negotiationMessage.create({
    data: { sessionId, role: "ASSISTANT", content: messageContent },
  });

  if (isComplete) {
    await db.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });
    return { message: messageContent, isComplete: true, sessionId };
  }

  return { message: aiResponse, isComplete: false, sessionId };
}

export async function endNegotiationSession(sessionId) {
  const user = await getAuthenticatedUserWith({});

  await db.negotiationSession.update({
    where: { id: sessionId, userId: user.id },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/salary-negotiation");
}

export async function generateNegotiationSummary(sessionId) {
  const user = await getAuthenticatedUserWith({});
  await checkRateLimit(user.id, "ai.negotiation.summary", 3, 300_000);

  const session = await db.negotiationSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) throw new Error("Session not found.");

  if (session.summary) return session.summary;

  const prompt = buildNegotiationSummaryPrompt({
    messages: session.messages,
    jobTitle: session.jobTitle,
  });

  const raw = await generateWithOpenAI(prompt);
  const jsonString = extractJSONFromText(raw);
  const result = JSON.parse(jsonString);

  if (!result) throw new Error("Failed to generate summary. Please try again.");

  await db.negotiationSession.update({
    where: { id: sessionId },
    data: { summary: result },
  });

  return result;
}

export async function getNegotiationSessions() {
  const user = await getAuthenticatedUserWith({});

  return db.negotiationSession.findMany({
    where: { userId: user.id },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
