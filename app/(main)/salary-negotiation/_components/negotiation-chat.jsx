"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  User,
  Send,
  Square,
  Clock,
  Loader2,
  Building2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Message({ msg }) {
  const isAI = msg.role === "ASSISTANT";
  return (
    <div className={cn("flex items-start gap-3", !isAI && "flex-row-reverse")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center",
        isAI
          ? "bg-gradient-brand text-white shadow-glow-sm"
          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
      )}>
        {isAI ? <DollarSign className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className={cn(
        "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
        isAI ? "bg-muted rounded-tl-sm" : "bg-indigo-500/15 border border-indigo-500/20 rounded-tr-sm"
      )}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center shadow-glow-sm">
        <DollarSign className="h-4 w-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
      </div>
    </div>
  );
}

export default function NegotiationChat({ session, messages: initialMessages, onSend, onEnd, isEnding }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(session?.status === "COMPLETED");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);

  const exchangeCount = messages.filter((m) => m.role === "USER").length;

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || sending || isComplete) return;

    const userMsg = { role: "USER", content: trimmed, id: `u-${Date.now()}` };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await onSend(trimmed);
      const aiMsg = { role: "ASSISTANT", content: result.message, id: `a-${Date.now()}` };
      setMessages((prev) => [...prev, aiMsg]);

      if (result.isComplete) {
        setIsComplete(true);
        clearInterval(timerRef.current);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      toast.error(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [input, sending, isComplete, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-border bg-card overflow-hidden">

      {/* Sidebar */}
      <div className="w-60 shrink-0 border-r border-border bg-background/50 hidden md:flex flex-col p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Position</p>
            <p className="text-sm font-semibold leading-tight">{session.jobTitle}</p>
          </div>
          {session.company && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Company</p>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{session.company}</p>
              </div>
            </div>
          )}
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1.5">Offer Summary</p>
            <p className="text-xs text-foreground leading-relaxed line-clamp-6">{session.offerDetails}</p>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Exchanges</span>
            <span className="ml-auto font-semibold">{exchangeCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Time</span>
            <span className="ml-auto font-semibold font-mono">{formatTime(elapsedSeconds)}</span>
          </div>

          {!isComplete && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl mt-1"
              onClick={() => onEnd(session.id)}
              disabled={isEnding}
            >
              {isEnding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Square className="h-3.5 w-3.5 mr-1" />}
              End Session
            </Button>
          )}

          {isComplete && (
            <Badge className="w-full justify-center bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
              Negotiation Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isComplete ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            )} />
            <span className="text-sm font-medium hidden sm:block">
              {isComplete ? "Negotiation Complete" : "Live Negotiation"}
            </span>
          </div>
          {!isComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-auto h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs rounded-lg"
              onClick={() => onEnd(session.id)}
            >
              <Square className="h-3 w-3 mr-1" />
              End
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <Message key={msg.id || i} msg={msg} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {!isComplete ? (
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex gap-2.5 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
                className="resize-none bg-muted/50 border-border focus-visible:ring-indigo-500/30 rounded-xl text-sm min-h-[44px] max-h-32"
                rows={1}
                disabled={sending}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="h-11 w-11 p-0 bg-gradient-brand text-white border-0 rounded-xl shrink-0 hover:opacity-90 disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Enter to send · Shift+Enter for new line · Practice confidently — this is a safe space
            </p>
          </div>
        ) : (
          <div className="p-4 border-t border-border text-center shrink-0">
            <p className="text-sm text-muted-foreground">
              Session complete — your coaching debrief is being generated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
