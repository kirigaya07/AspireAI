"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw, Send, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VoiceRecorder — mic button, live waveform canvas, Whisper transcription.
 * Props:
 *   onSend(text)  — called when the user confirms the transcript
 *   disabled      — disables the recorder (e.g. while AI is thinking/speaking)
 */
export default function VoiceRecorder({ onSend, disabled }) {
  const [state, setState] = useState("idle"); // idle | recording | transcribing | ready | error
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  function stopEverything() {
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  // ── Waveform drawing ─────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const W = rect.width;
    const H = rect.height;
    const barCount = 48;
    const gap = 2;
    const barW = (W - gap * (barCount - 1)) / barCount;

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, W, H);

      const step = Math.floor(bufferLength / barCount);
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        // Add a minimum height so it's always visible
        const barH = Math.max(3, value * H * 0.9);
        const x = i * (barW + gap);
        const y = (H - barH) / 2;

        // Indigo → violet gradient per bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, `rgba(129, 140, 248, ${0.5 + value * 0.5})`);
        gradient.addColorStop(1, `rgba(168, 85, 247, ${0.5 + value * 0.5})`);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fill();
      }
    }

    draw();
  }, []);

  // ── Start recording ──────────────────────────────────────────────
  const startRecording = async () => {
    setErrorMsg("");
    setTranscript("");
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder setup
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        handleTranscription();
      };

      mediaRecorder.start(100); // collect chunks every 100ms
      setState("recording");

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      // Start waveform after next paint (canvas needs to be rendered)
      requestAnimationFrame(drawWaveform);
    } catch (err) {
      console.error("Mic error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone permission denied. Please allow access in your browser.");
      } else {
        setErrorMsg("Could not access microphone. Please check your device settings.");
      }
      setState("error");
    }
  };

  // ── Stop recording ───────────────────────────────────────────────
  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    mediaRecorderRef.current?.stop();
    setState("transcribing");
  };

  // ── Transcribe via Whisper ───────────────────────────────────────
  const handleTranscription = async () => {
    const mimeType = chunksRef.current[0]?.type || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });

    const ext = mimeType.includes("mp4") ? "mp4"
      : mimeType.includes("ogg") ? "ogg"
      : "webm";

    const formData = new FormData();
    formData.append("audio", new File([blob], `recording.${ext}`, { type: mimeType }));

    try {
      const res = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transcription failed");
      }

      const data = await res.json();
      const text = data.text?.trim();

      if (!text) {
        setErrorMsg("No speech detected. Please try again.");
        setState("error");
        return;
      }

      setTranscript(text);
      setState("ready");
    } catch (err) {
      console.error("Transcription error:", err);
      setErrorMsg(err.message || "Transcription failed. Please try again.");
      setState("error");
    }
  };

  // ── Send confirmed transcript ────────────────────────────────────
  const handleSend = () => {
    if (!transcript.trim()) return;
    onSend(transcript);
    setTranscript("");
    setState("idle");
    setDuration(0);
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript("");
    setDuration(0);
    setErrorMsg("");
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Render states ────────────────────────────────────────────────

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleRetry} className="rounded-xl">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (state === "transcribing") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        <p className="text-sm text-muted-foreground">Transcribing your answer...</p>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="space-y-3">
        {/* Transcript preview */}
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
          <p className="text-xs text-indigo-400 mb-1 font-medium">Your answer</p>
          <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="rounded-xl border-border flex-1"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Re-record
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={disabled}
            className="rounded-xl bg-gradient-brand text-white border-0 flex-1 hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Send Answer
          </Button>
        </div>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex flex-col items-center gap-3">
        {/* Waveform canvas */}
        <div className="w-full h-14 rounded-xl bg-muted/50 border border-border overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="flex items-center gap-4">
          {/* Recording indicator */}
          <div className="flex items-center gap-2 text-sm text-rose-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            Recording · {formatDuration(duration)}
          </div>

          {/* Stop button */}
          <Button
            onClick={stopRecording}
            className="h-12 w-12 rounded-full bg-rose-500 hover:bg-rose-600 border-0 text-white p-0 shadow-lg"
          >
            <Square className="h-5 w-5 fill-white" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Click to stop recording</p>
      </div>
    );
  }

  // Idle state
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={startRecording}
        disabled={disabled}
        className={cn(
          "relative h-16 w-16 rounded-full transition-all duration-200",
          "bg-gradient-brand shadow-glow hover:shadow-glow-lg hover:scale-105",
          "flex items-center justify-center",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
      >
        <Mic className="h-7 w-7 text-white" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping opacity-75" />
      </button>
      <p className="text-xs text-muted-foreground">Click to speak your answer</p>
    </div>
  );
}
