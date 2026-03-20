"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  User,
  Send,
  Square,
  Clock,
  MessageCircle,
  Loader2,
  Building2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronDown,
  Settings2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import VoiceRecorder from "./voice-recorder";

// ── Voice persona options ────────────────────────────────────────
const VOICE_PERSONAS = [
  { id: "onyx",    label: "Marcus",  description: "Deep · Authoritative", gender: "M" },
  { id: "echo",    label: "Alex",    description: "Clear · Professional",  gender: "M" },
  { id: "fable",   label: "James",   description: "Warm · Engaging",       gender: "M" },
  { id: "nova",    label: "Sarah",   description: "Warm · Encouraging",    gender: "F" },
  { id: "shimmer", label: "Emily",   description: "Crisp · Energetic",     gender: "F" },
  { id: "alloy",   label: "Jordan",  description: "Neutral · Balanced",    gender: "N" },
];

const SPEED_OPTIONS = [
  { value: 0.85, label: "0.85×  Slow" },
  { value: 1.0,  label: "1.0×  Normal" },
  { value: 1.15, label: "1.15×  Fast" },
];

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 chat-bubble-ai">
      <div className="h-8 w-8 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center shadow-glow-sm">
        <Brain className="h-4 w-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
      </div>
    </div>
  );
}

// ── Chat message bubble ──────────────────────────────────────────
function Message({ msg }) {
  const isAI = msg.role === "ASSISTANT";
  return (
    <div className={cn("flex items-start gap-3", !isAI && "flex-row-reverse", isAI ? "chat-bubble-ai" : "chat-bubble-user")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center",
        isAI ? "bg-gradient-brand text-white shadow-glow-sm" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
      )}>
        {isAI ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className={cn(
        "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
        isAI ? "bg-muted rounded-tl-sm" : "bg-indigo-500/15 border border-indigo-500/20 rounded-tr-sm"
      )}>
        {msg.content}
      </div>
    </div>
  );
}

// ── Speaking indicator ───────────────────────────────────────────
function SpeakingIndicator({ persona, onStop }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 animate-pulse-glow">
      <div className="flex items-center gap-1.5">
        <Volume2 className="h-4 w-4 text-indigo-400" />
        <span className="text-sm text-indigo-300 font-medium">
          {persona?.label || "Interviewer"} is speaking...
        </span>
      </div>
      <div className="flex gap-0.5 items-end h-4">
        {[1,2,3,4,3,2,1].map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-indigo-400"
            style={{
              height: `${h * 3 + 2}px`,
              animation: `typing 0.8s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>
      <button
        onClick={onStop}
        className="ml-auto text-xs text-indigo-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
      >
        <VolumeX className="h-3.5 w-3.5" />
        Stop
      </button>
    </div>
  );
}

// ── Main ChatInterface ───────────────────────────────────────────
export default function ChatInterface({ session, messages: initialMessages, onSend, onEnd, isEnding }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(session?.status === "COMPLETED");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("onyx");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const bottomRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const selectedPersona = VOICE_PERSONAS.find(v => v.id === selectedVoice) || VOICE_PERSONAS[0];

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, isSpeaking]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const questionCount = messages.filter(m => m.role === "ASSISTANT").length;

  // ── TTS playback ─────────────────────────────────────────────────
  const speakText = useCallback(async (text) => {
    if (!voiceMode || !text) return;

    stopSpeaking();

    try {
      setIsSpeaking(true);
      const res = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice, speed: playbackSpeed }),
      });

      if (!res.ok) throw new Error("TTS request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS playback error:", err);
      setIsSpeaking(false);
    }
  }, [voiceMode, selectedVoice, playbackSpeed]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // ── Send message (text or voice) ─────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || sending || isComplete) return;

    const userMsg = { role: "USER", content: trimmed, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    stopSpeaking();

    try {
      const result = await onSend(trimmed);
      const aiMsg = { role: "ASSISTANT", content: result.message, id: `a-${Date.now()}` };
      setMessages(prev => [...prev, aiMsg]);

      if (result.isComplete) {
        setIsComplete(true);
        clearInterval(timerRef.current);
      }

      // Auto-play AI response in voice mode
      if (voiceMode) {
        speakText(result.message);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      console.error(err);
    } finally {
      setSending(false);
    }
  }, [input, sending, isComplete, onSend, voiceMode, speakText, stopSpeaking]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    stopSpeaking();
    setVoiceMode(v => !v);
  };

  // Auto-play first AI message when voice mode is enabled
  useEffect(() => {
    if (voiceMode && messages.length > 0) {
      const lastAI = [...messages].reverse().find(m => m.role === "ASSISTANT");
      if (lastAI) speakText(lastAI.content);
    } else {
      stopSpeaking();
    }
  }, [voiceMode]); // only runs when voiceMode toggles

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-border bg-card overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
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
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <p className="text-xs font-semibold">{session.type.replace("_", " ")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Level</p>
              <p className="text-xs font-semibold">{session.difficulty}</p>
            </div>
          </div>

          {/* Voice persona display */}
          {voiceMode && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3">
              <p className="text-xs text-indigo-400 mb-1.5 font-medium">Voice Interviewer</p>
              <p className="text-sm font-semibold">{selectedPersona.label}</p>
              <p className="text-xs text-muted-foreground">{selectedPersona.description}</p>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Questions</span>
            <span className="ml-auto font-semibold">{questionCount}</span>
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
              End Interview
            </Button>
          )}

          {isComplete && (
            <Badge className="w-full justify-center bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
              Interview Complete
            </Badge>
          )}
        </div>
      </div>

      {/* ── Chat Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isComplete ? "bg-emerald-400" : "bg-indigo-400 animate-pulse"
            )} />
            <span className="text-sm font-medium hidden sm:block">
              {isComplete ? "Interview Complete" : "Live Session"}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Voice settings dropdown */}
            {voiceMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground rounded-lg">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:block">{selectedPersona.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                    Interviewer Voice
                  </DropdownMenuLabel>
                  {VOICE_PERSONAS.map(v => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => { setSelectedVoice(v.id); stopSpeaking(); }}
                      className={cn("rounded-lg cursor-pointer px-3 py-2", selectedVoice === v.id && "bg-indigo-500/10")}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <span className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          selectedVoice === v.id ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {v.gender}
                        </span>
                        <div>
                          <p className="text-sm font-medium leading-none">{v.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{v.description}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                    Playback Speed
                  </DropdownMenuLabel>
                  {SPEED_OPTIONS.map(s => (
                    <DropdownMenuItem
                      key={s.value}
                      onClick={() => setPlaybackSpeed(s.value)}
                      className={cn("rounded-lg cursor-pointer px-3 py-2 text-sm", playbackSpeed === s.value && "bg-indigo-500/10 text-indigo-300")}
                    >
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Voice mode toggle */}
            <Button
              variant={voiceMode ? "default" : "outline"}
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                "h-7 gap-1.5 text-xs rounded-lg transition-all",
                voiceMode
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white border-0"
                  : "border-border text-muted-foreground hover:border-indigo-500/40"
              )}
            >
              {voiceMode ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:block">{voiceMode ? "Voice On" : "Voice Off"}</span>
            </Button>

            {/* Mobile end button */}
            {!isComplete && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs rounded-lg"
                onClick={() => onEnd(session.id)}
              >
                <Square className="h-3 w-3 mr-1" />
                End
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <Message key={msg.id || i} msg={msg} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="px-4 pb-2">
            <SpeakingIndicator persona={selectedPersona} onStop={stopSpeaking} />
          </div>
        )}

        {/* Input area */}
        {!isComplete ? (
          <div className="p-4 border-t border-border shrink-0">
            {voiceMode ? (
              /* ── Voice input ── */
              <div className="min-h-[100px] flex flex-col items-center justify-center">
                <VoiceRecorder
                  onSend={(text) => handleSend(text)}
                  disabled={sending || isSpeaking}
                />
              </div>
            ) : (
              /* ── Text input ── */
              <>
                <div className="flex gap-2.5 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
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
                  Enter to send · Shift+Enter for new line ·{" "}
                  <button
                    onClick={handleVoiceToggle}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Switch to voice mode
                  </button>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 border-t border-border text-center shrink-0">
            <p className="text-sm text-muted-foreground">
              Interview complete — your results are being generated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
