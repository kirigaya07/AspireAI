"use client";

import { useState, useCallback } from "react";
import SessionSetup from "./_components/session-setup";
import ChatInterface from "./_components/chat-interface";
import SessionResults from "./_components/session-results";
import {
  createInterviewSession,
  sendInterviewMessage,
  endInterviewSession,
  generateSessionFeedback,
} from "@/actions/interview-agent";
import { toast } from "sonner";

// Three phases: setup → chat → results
const PHASE = { SETUP: "setup", CHAT: "chat", RESULTS: "results" };

export default function InterviewAgentPage() {
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isEnding, setIsEnding] = useState(false);

  const handleStart = useCallback(async (config) => {
    try {
      const result = await createInterviewSession(config);
      setSession({
        id: result.sessionId,
        jobTitle: config.jobTitle,
        company: config.company,
        type: config.type,
        difficulty: config.difficulty,
        status: "ACTIVE",
      });
      setMessages([{ role: "ASSISTANT", content: result.openingMessage }]);
      setPhase(PHASE.CHAT);
    } catch (err) {
      toast.error(err.message || "Failed to start interview session.");
    }
  }, []);

  const handleSend = useCallback(async (text) => {
    const result = await sendInterviewMessage(session.id, text);
    if (result.isComplete) {
      setSession(prev => ({ ...prev, status: "COMPLETED" }));
      // Small delay before switching to results
      setTimeout(() => setPhase(PHASE.RESULTS), 1500);
    }
    return result;
  }, [session?.id]);

  const handleEnd = useCallback(async (sessionId) => {
    setIsEnding(true);
    try {
      await endInterviewSession(sessionId);
      setSession(prev => ({ ...prev, status: "COMPLETED" }));
      setPhase(PHASE.RESULTS);
    } catch (err) {
      toast.error("Failed to end session.");
    } finally {
      setIsEnding(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setSession(null);
    setMessages([]);
    setPhase(PHASE.SETUP);
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {phase === PHASE.SETUP && (
        <SessionSetup onStart={handleStart} />
      )}

      {phase === PHASE.CHAT && session && (
        <ChatInterface
          session={session}
          messages={messages}
          onSend={handleSend}
          onEnd={handleEnd}
          isEnding={isEnding}
        />
      )}

      {phase === PHASE.RESULTS && session && (
        <SessionResults
          sessionId={session.id}
          onRetry={handleRetry}
          generateFeedback={generateSessionFeedback}
        />
      )}
    </div>
  );
}
