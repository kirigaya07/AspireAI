"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Building2, DollarSign, ArrowRight, Loader2, Zap } from "lucide-react";

const OFFER_EXAMPLES = [
  "Base salary: ₹18 LPA\nRole: Senior Software Engineer\nJoining bonus: ₹1 lakh\nEquity: None\nWork mode: 3 days in-office",
  "Base: $120,000/year\nRole: Product Manager\nSignin bonus: $10,000\nEquity: 0.05% over 4 years\nPTO: 15 days",
];

export default function NegotiationSetup({ onStart }) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!jobTitle.trim() || !offerDetails.trim()) return;
    setLoading(true);
    try {
      await onStart({ jobTitle: jobTitle.trim(), company: company.trim(), offerDetails: offerDetails.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-brand mb-4 shadow-glow">
          <DollarSign className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Salary Negotiation Coach</h1>
        <p className="text-muted-foreground">
          Paste your offer and practice negotiating with an AI hiring manager before the real conversation.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-indigo-400">
          <Zap className="h-3.5 w-3.5" />
          <span>Costs 150 tokens per session</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Position */}
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
                  placeholder="e.g. Google, Startup, Fintech Co."
                  className="pl-9 bg-muted/50 border-border focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Offer Details */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Offer Details <span className="text-rose-400">*</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Paste your offer letter or describe the package — salary, bonus, equity, perks.
              </p>
            </div>
          </div>
          <Textarea
            value={offerDetails}
            onChange={(e) => setOfferDetails(e.target.value)}
            placeholder={OFFER_EXAMPLES[0]}
            rows={6}
            className="bg-muted/50 border-border focus-visible:ring-indigo-500/30 rounded-xl text-sm resize-none"
          />
          {/* Quick fill examples */}
          <div className="flex flex-wrap gap-2">
            {OFFER_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setOfferDetails(ex)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
              >
                Load example {i + 1}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={!jobTitle.trim() || !offerDetails.trim() || loading}
          className="w-full h-12 bg-gradient-brand text-white border-0 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-glow"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Starting session...
            </>
          ) : (
            <>
              Start Negotiation Practice
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
