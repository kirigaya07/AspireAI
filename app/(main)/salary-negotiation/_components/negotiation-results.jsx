"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  Trophy,
  ArrowRight,
  DollarSign,
  Lightbulb,
  Quote,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function NegotiationResults({ sessionId, onRetry, generateSummary }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateSummary(sessionId)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, generateSummary]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow animate-pulse">
          <DollarSign className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold mb-1">Analyzing your negotiation...</h3>
          <p className="text-sm text-muted-foreground">Our AI coach is reviewing your tactics and outcomes.</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-400" />
        <div className="text-center">
          <h3 className="font-semibold mb-1">Failed to generate debrief</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-brand mb-3 shadow-glow">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Negotiation Complete</h2>
        <p className="text-muted-foreground text-sm">Here&apos;s your coaching debrief</p>
      </div>

      {/* Score + Outcome */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-6">
          <ScoreRing score={result.score} />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Negotiation Score</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.outcome}</p>
          </div>
        </div>
      </div>

      {/* Best line */}
      {result.bestLine && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Quote className="h-3.5 w-3.5" />
            Your Best Line
          </p>
          <p className="text-sm text-foreground italic">&ldquo;{result.bestLine}&rdquo;</p>
        </div>
      )}

      {/* Effective tactics */}
      {result.tactics?.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            What Worked
          </h3>
          <ul className="space-y-2.5">
            {result.tactics.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mistakes */}
      {result.mistakes?.length > 0 && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Missed Opportunities
          </h3>
          <ul className="space-y-2.5">
            {result.mistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips for next time */}
      {result.tips?.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips for Next Time
          </h3>
          <ul className="space-y-2.5">
            {result.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <TrendingUp className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRetry} variant="outline" className="flex-1 rounded-xl border-border">
          <RotateCcw className="h-4 w-4 mr-2" />
          Practice Again
        </Button>
        <Link href="/interview/agent" className="flex-1">
          <Button className="w-full rounded-xl bg-gradient-brand text-white border-0 hover:opacity-90">
            Try AI Interview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
