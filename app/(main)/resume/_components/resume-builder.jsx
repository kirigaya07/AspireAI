"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Save,
  Loader2,
  Sparkles,
  Target,
  FileText,
  Edit3,
  Eye,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { saveResume, improveWithAI, analyzeATS } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import { TEMPLATES, generateResumeHTML } from "@/lib/latex-templates";
import { cn } from "@/lib/utils";

// ── Template Picker ──────────────────────────────────────────────
function TemplatePicker({ value, onChange }) {
  return (
    <div className="flex gap-2.5 flex-wrap">
      {Object.values(TEMPLATES).map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "group px-4 py-2.5 rounded-xl border text-left transition-all duration-200",
            value === t.id
              ? "border-indigo-500/50 bg-indigo-500/10 text-foreground"
              : "border-border bg-card hover:border-indigo-500/30 text-muted-foreground"
          )}
        >
          <div className="text-sm font-medium">{t.name}</div>
          <div className="text-xs opacity-60 mt-0.5">{t.description}</div>
        </button>
      ))}
    </div>
  );
}

// ── ATS Score Ring ───────────────────────────────────────────────
function ATSScoreRing({ score, size = 100 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ats-ring">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── ATS Panel ───────────────────────────────────────────────────
function ATSPanel({ resumeContent }) {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    if (!resumeContent?.trim()) {
      toast.error("Please build and save your resume first.");
      return;
    }
    setAnalyzing(true);
    try {
      const data = await analyzeATS({ jobDescription });
      setResult(data);
      toast.success("ATS analysis complete!");
    } catch (err) {
      toast.error(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Label className="text-sm font-medium mb-2 block">Paste Job Description</Label>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here to analyze how well your resume matches..."
          className="h-40 bg-muted/50 border-border focus-visible:ring-indigo-500/30 resize-none text-sm"
        />
        <Button
          onClick={handleAnalyze}
          disabled={analyzing || !jobDescription.trim()}
          className="mt-3 bg-gradient-brand text-white border-0 rounded-xl hover:opacity-90"
        >
          {analyzing ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</>
          ) : (
            <><BarChart3 className="h-4 w-4 mr-2" />Analyze ATS Score</>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Score Overview */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-6">
              <ATSScoreRing score={result.score} />
              <div>
                <h3 className="font-semibold mb-1">
                  ATS Match Score
                  <Badge className={cn("ml-2 text-xs", result.score >= 75 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : result.score >= 50 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-rose-500/15 text-rose-400 border-rose-500/20")}>
                    {result.score >= 75 ? "Strong Match" : result.score >= 50 ? "Moderate Match" : "Low Match"}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          {result.sectionScores && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Section Scores</h3>
              {Object.entries(result.sectionScores).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <span className="font-semibold">{val}%</span>
                  </div>
                  <Progress value={val} className="h-1.5" />
                </div>
              ))}
            </div>
          )}

          {/* Keywords */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <button
              onClick={() => setShowKeywords(!showKeywords)}
              className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <span>Keyword Analysis</span>
              {showKeywords ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showKeywords && (
              <div className="space-y-4">
                {result.matchedKeywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Matched ({result.matchedKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedKeywords.map(k => (
                        <Badge key={k} className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.missingKeywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-rose-400 mb-2 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" /> Missing ({result.missingKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingKeywords.map(k => (
                        <Badge key={k} className="text-xs bg-rose-500/10 text-rose-400 border-rose-500/20">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {result.topSuggestions?.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Top Suggestions
              </h3>
              <ul className="space-y-2">
                {result.topSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function ResumeBuilder({ initialContent, initialTemplate }) {
  const [activeTab, setActiveTab] = useState(initialContent ? "preview" : "form");
  const [previewContent, setPreviewContent] = useState(initialContent || "");
  const [template, setTemplate] = useState(initialTemplate || "CLASSIC");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeMode, setResumeMode] = useState("preview");
  const { user } = useUser();

  const { control, register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const { loading: isSaving, fn: saveResumeFn, data: saveResult, error: saveError } = useFetch(saveResume);

  const formValues = watch();

  const getContactMarkdown = useCallback(() => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(contactInfo.email);
    if (contactInfo.mobile) parts.push(contactInfo.mobile);
    if (contactInfo.linkedin) parts.push(contactInfo.linkedin);
    if (contactInfo.twitter) parts.push(contactInfo.twitter);
    return parts.length > 0
      ? `# ${user?.fullName || "Your Name"}\n\n${parts.join(" | ")}`
      : "";
  }, [formValues, user]);

  const getCombinedContent = useCallback(() => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ].filter(Boolean).join("\n\n");
  }, [formValues, getContactMarkdown]);

  useEffect(() => {
    if (activeTab === "form") {
      const content = getCombinedContent();
      if (content) setPreviewContent(content);
    }
  }, [formValues, activeTab, getCombinedContent]);

  useEffect(() => {
    if (saveResult && !isSaving) toast.success("Resume saved successfully!");
    if (saveError) toast.error(saveError.message || "Failed to save resume");
  }, [saveResult, saveError, isSaving]);

  const onSubmit = async () => {
    const content = previewContent.replace(/\n\s*\n/g, "\n\n").trim();
    await saveResumeFn(content);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const htmlContent = generateResumeHTML(previewContent, template);
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: 0,
          filename: "resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" data-color-mode="dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-title">Resume Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build, optimize, and export your professional resume
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onSubmit()}
            disabled={isSaving}
            className="rounded-xl border-border"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating || !previewContent}
            className="rounded-xl bg-gradient-brand text-white border-0 hover:opacity-90"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Template Picker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resume Template
        </h3>
        <TemplatePicker value={template} onChange={setTemplate} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 rounded-xl p-1 gap-1">
          <TabsTrigger value="form" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            Form
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Markdown
          </TabsTrigger>
          <TabsTrigger value="ats" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Target className="h-3.5 w-3.5 mr-1.5" />
            ATS Score
          </TabsTrigger>
        </TabsList>

        {/* ── Form Tab ── */}
        <TabsContent value="form" className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Contact Info */}
            <SectionCard title="Contact Information" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "contactInfo.email", label: "Email", type: "email", placeholder: "you@example.com" },
                  { name: "contactInfo.mobile", label: "Phone", type: "tel", placeholder: "+1 234 567 8900" },
                  { name: "contactInfo.linkedin", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/..." },
                  { name: "contactInfo.twitter", label: "Portfolio / Website", type: "url", placeholder: "https://yoursite.com" },
                ].map(field => (
                  <FormField
                    key={field.name}
                    label={field.label}
                    error={errors.contactInfo?.[field.name.split(".")[1]]}
                  >
                    <Input
                      {...register(field.name)}
                      type={field.type}
                      placeholder={field.placeholder}
                      className="bg-muted/50 border-border focus-visible:ring-indigo-500/30 rounded-xl"
                    />
                  </FormField>
                ))}
              </div>
            </SectionCard>

            {/* Summary */}
            <SectionCard title="Professional Summary" icon={Sparkles}>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <AITextarea
                    field={field}
                    placeholder="Write a compelling 2-3 sentence professional summary highlighting your key strengths and value proposition..."
                    type="summary"
                  />
                )}
              />
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skills" icon={Wand2}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <AITextarea
                    field={field}
                    placeholder="e.g., JavaScript, React, Node.js, Python, AWS, Docker, System Design..."
                    type="skills"
                  />
                )}
              />
            </SectionCard>

            {/* Experience */}
            <SectionCard title="Work Experience" icon={Edit3}>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm type="Experience" entries={field.value} onChange={field.onChange} />
                )}
              />
            </SectionCard>

            {/* Education */}
            <SectionCard title="Education" icon={Edit3}>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm type="Education" entries={field.value} onChange={field.onChange} />
                )}
              />
            </SectionCard>

            {/* Projects */}
            <SectionCard title="Projects" icon={Edit3}>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm type="Project" entries={field.value} onChange={field.onChange} />
                )}
              />
            </SectionCard>
          </form>
        </TabsContent>

        {/* ── Preview Tab ── */}
        <TabsContent value="preview" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Edit your resume in Markdown format. The template is applied when exporting to PDF.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
              className="rounded-lg text-xs"
            >
              {resumeMode === "preview" ? <><Edit3 className="h-3.5 w-3.5 mr-1.5" />Edit</> : <><Eye className="h-3.5 w-3.5 mr-1.5" />Preview</>}
            </Button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border">
            <MDEditor
              value={previewContent}
              onChange={setPreviewContent}
              height={700}
              preview={resumeMode}
            />
          </div>
        </TabsContent>

        {/* ── ATS Tab ── */}
        <TabsContent value="ats" className="mt-6">
          <ATSPanel resumeContent={previewContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-400">{error.message}</p>}
    </div>
  );
}

function AITextarea({ field, placeholder, type }) {
  const [improving, setImproving] = useState(false);

  const handleImprove = async () => {
    if (!field.value?.trim()) {
      toast.error("Please write some content first.");
      return;
    }
    setImproving(true);
    try {
      const improved = await improveWithAI({ current: field.value, type });
      field.onChange(improved);
      toast.success("Content improved with AI!");
    } catch (err) {
      toast.error(err.message || "Failed to improve content.");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        {...field}
        placeholder={placeholder}
        className="min-h-[100px] bg-muted/50 border-border focus-visible:ring-indigo-500/30 rounded-xl resize-none text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImprove}
        disabled={improving}
        className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg"
      >
        {improving ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Improving...</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Improve with AI</>
        )}
      </Button>
    </div>
  );
}
