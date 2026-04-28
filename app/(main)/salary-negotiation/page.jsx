"use client";

import { useState, useCallback } from "react";
import NegotiationSetup from "./_components/negotiation-setup";
import NegotiationChat from "./_components/negotiation-chat";
import NegotiationResults from "./_components/negotiation-results";
import {
  createNegotiationSession,
  sendNegotiationMessage,
  endNegotiationSession,
  generateNegotiationSummary,
} from "@/actions/negotiation";
import { toast } from "sonner";

const PHASE = { SETUP: "setup", CHAT: "chat", RESULTS: "results" };

export default function SalaryNegotiationPage() {
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isEnding, setIsEnding] = useState(false);

  const handleStart = useCallback(async (config) => {
    try {
      const result = await createNegotiationSession(config);
      setSession({
        id: result.sessionId,
        jobTitle: config.jobTitle,
        company: config.company,
        offerDetails: config.offerDetails,
        status: "ACTIVE",
      });
      setMessages([{ role: "ASSISTANT", content: result.openingMessage }]);
      setPhase(PHASE.CHAT);
    } catch (err) {
      toast.error(err.message || "Failed to start negotiation session.");
    }
  }, []);

  const handleSend = useCallback(async (text) => {
    const result = await sendNegotiationMessage(session.id, text);
    if (result.isComplete) {
      setSession((prev) => ({ ...prev, status: "COMPLETED" }));
      setTimeout(() => setPhase(PHASE.RESULTS), 1500);
    }
    return result;
  }, [session?.id]);

  const handleEnd = useCallback(async (sessionId) => {
    setIsEnding(true);
    try {
      await endNegotiationSession(sessionId);
      setSession((prev) => ({ ...prev, status: "COMPLETED" }));
      setPhase(PHASE.RESULTS);
    } catch {
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
      {phase === PHASE.SETUP && <NegotiationSetup onStart={handleStart} />}

      {phase === PHASE.CHAT && session && (
        <NegotiationChat
          session={session}
          messages={messages}
          onSend={handleSend}
          onEnd={handleEnd}
          isEnding={isEnding}
        />
      )}

      {phase === PHASE.RESULTS && session && (
        <NegotiationResults
          sessionId={session.id}
          onRetry={handleRetry}
          generateSummary={generateNegotiationSummary}
        />
      )}
    </div>
  );
}
