"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Building2, Briefcase, Zap, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVIEW_TYPES = [
  { value: "MIXED", label: "Mixed", description: "Behavioral + Technical + HR" },
  { value: "BEHAVIORAL", label: "Behavioral", description: "STAR method, past experiences" },
  { value: "TECHNICAL", label: "Technical", description: "Role-specific technical depth" },
  { value: "SYSTEM_DESIGN", label: "System Design", description: "Architecture & scalability" },
  { value: "HR", label: "HR Round", description: "Culture fit & career goals" },
];

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Entry Level", description: "0-2 years", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { value: "MEDIUM", label: "Mid Level", description: "3-6 years", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { value: "HARD", label: "Senior Level", description: "7+ years", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
];

export default function SessionSetup({ onStart }) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("MIXED");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!jobTitle.trim()) return;
    setLoading(true);
    try {
      await onStart({ jobTitle: jobTitle.trim(), company: company.trim(), type, difficulty });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-brand mb-4 shadow-glow">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Interview Agent</h1>
        <p className="text-muted-foreground">
          Practice with an intelligent AI interviewer that adapts to your answers.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-indigo-400">
          <Zap className="h-3.5 w-3.5" />
          <span>Costs 200 tokens per session</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Job Details */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Position Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm">
                Job Title <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm">
                Company <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, Startup"
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Interview Type */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Interview Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "relative p-3.5 rounded-xl border text-left transition-all duration-200",
                  type === t.value
                    ? "border-indigo-500/50 bg-indigo-500/10 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/5"
                )}
              >
                {type === t.value && (
                  <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-indigo-400" />
                )}
                <div className="text-sm font-medium mb-0.5">{t.label}</div>
                <div className="text-xs opacity-70">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Difficulty Level</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  "p-4 rounded-xl border text-center transition-all duration-200",
                  difficulty === d.value
                    ? `${d.color} border-current`
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                <div className="text-sm font-semibold mb-0.5">{d.label}</div>
                <div className="text-xs opacity-70">{d.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!jobTitle.trim() || loading}
          className="w-full h-12 bg-gradient-brand text-white border-0 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-glow"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Starting interview...
            </>
          ) : (
            <>
              Begin Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
