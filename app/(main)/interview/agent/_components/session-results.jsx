"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BarChart3,
  Loader2,
  Trophy,
  ArrowRight,
  MessageSquare,
  Zap,
  Target,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const RECOMMENDATION_MAP = {
  STRONG_HIRE: { label: "Strong Hire", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  HIRE:        { label: "Hire",        color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  BORDERLINE:  { label: "Borderline",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  NO_HIRE:     { label: "No Hire",     color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ats-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
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

function SubScore({ label, score, icon: Icon, color }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", color)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-semibold">{score}%</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

export default function SessionResults({ sessionId, onRetry, generateFeedback }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateFeedback(sessionId)
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, generateFeedback]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow animate-pulse">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-semibold mb-1">Analyzing your performance...</h3>
          <p className="text-sm text-muted-foreground">Our AI is evaluating your responses and generating feedback.</p>
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
          <h3 className="font-semibold mb-1">Failed to generate feedback</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  const rec = RECOMMENDATION_MAP[result.recommendation] || RECOMMENDATION_MAP.BORDERLINE;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-brand mb-3 shadow-glow">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Interview Complete</h2>
        <p className="text-muted-foreground text-sm">Here&apos;s your performance breakdown</p>
      </div>

      {/* Score Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-6">
          <ScoreRing score={result.score} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">Overall Score</h3>
              <Badge className={cn("text-xs", rec.color)}>{rec.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      {(result.communicationScore || result.technicalScore || result.confidenceScore) && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skill Breakdown</h3>
          {result.communicationScore && (
            <SubScore label="Communication" score={result.communicationScore} icon={MessageSquare} color="text-blue-400" />
          )}
          {result.technicalScore && (
            <SubScore label="Technical Knowledge" score={result.technicalScore} icon={Zap} color="text-amber-400" />
          )}
          {result.confidenceScore && (
            <SubScore label="Confidence & Clarity" score={result.confidenceScore} icon={Target} color="text-emerald-400" />
          )}
        </div>
      )}

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-2.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {result.improvements?.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Areas to Improve
          </h3>
          <ul className="space-y-2.5">
            {result.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 rounded-xl border-border"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Another
        </Button>
        <Link href="/interview" className="flex-1">
          <Button className="w-full rounded-xl bg-gradient-brand text-white border-0 hover:opacity-90">
            View All Sessions
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
