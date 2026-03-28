"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema } from "@/app/lib/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { updateUser } from "@/actions/user";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Briefcase, Wrench, User, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Industry",   icon: Briefcase, title: "What's your field?",        subtitle: "We use this to personalize market insights and interview questions." },
  { id: 2, label: "Experience", icon: Wrench,    title: "Your experience & skills",   subtitle: "Help us match you with the right resources and difficulty levels." },
  { id: 3, label: "Profile",    icon: User,      title: "Your professional story",    subtitle: "A strong bio helps AI generate better resumes and cover letters for you." },
];

const EXPERIENCE_LEVELS = [
  { range: "0–1", label: "Student / Intern" },
  { range: "1–3", label: "Junior (1–3 yrs)" },
  { range: "3–6", label: "Mid-level (3–6 yrs)" },
  { range: "6–10", label: "Senior (6–10 yrs)" },
  { range: "10+", label: "Lead / Principal (10+ yrs)" },
];

const OnboardingForm = ({ industries }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const { loading: updateLoading, fn: updateUserFn, data: updateResult } = useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  });

  const watchIndustry = watch("industry");
  const watchSubIndustry = watch("subIndustry");
  const watchExperience = watch("experience");

  useEffect(() => {
    if (updateResult?.success && !updateLoading) {
      toast.success("Profile set up! Welcome to AspireAI.");
      router.push("/dashboard");
      router.refresh();
    }
  }, [updateResult, updateLoading]);

  const onSubmit = async (values) => {
    try {
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`;
      await updateUserFn({ ...values, industry: formattedIndustry });
    } catch (error) {
      console.error("Onboarding error:", error);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["industry", "subIndustry"];
    if (step === 2) fieldsToValidate = ["experience", "skills"];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Quick setup — takes under 2 minutes
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-title mb-2">Set up your profile</h1>
          <p className="text-muted-foreground text-sm">Personalize AspireAI to your career goals</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-2 px-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                step === s.id ? "text-foreground" : step > s.id ? "text-emerald-400" : "text-muted-foreground"
              )}>
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                  step === s.id ? "bg-indigo-500 border-indigo-500 text-white" :
                  step > s.id ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                  "bg-muted border-border text-muted-foreground"
                )}>
                  {step > s.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-px bg-border overflow-hidden rounded-full">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: step > s.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct + (100 / (STEPS.length - 1)) * (1 / STEPS.length)}%` }}
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          {/* Step heading */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">{STEPS[step - 1].title}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[step - 1].subtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── Step 1: Industry ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("industry", value);
                      setSelectedIndustry(industries.find((ind) => ind.id === value));
                      setValue("subIndustry", "");
                    }}
                  >
                    <SelectTrigger id="industry" className="rounded-xl bg-muted/50 border-border">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Industries</SelectLabel>
                        {industries.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.industry && <p className="text-xs text-rose-400">{errors.industry.message}</p>}
                </div>

                {watchIndustry && (
                  <div className="space-y-2">
                    <Label htmlFor="subIndustry">Specialization</Label>
                    <Select onValueChange={(value) => setValue("subIndustry", value)}>
                      <SelectTrigger id="subIndustry" className="rounded-xl bg-muted/50 border-border">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Specializations</SelectLabel>
                          {selectedIndustry?.subIndustries.map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.subIndustry && <p className="text-xs text-rose-400">{errors.subIndustry.message}</p>}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Experience & Skills ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {EXPERIENCE_LEVELS.map(({ range, label }) => {
                      const val = range === "10+" ? 10 : parseInt(range.split("–")[0]);
                      const isSelected = Number(watchExperience) === val;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setValue("experience", val, { shouldValidate: true })}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left transition-all",
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/10 text-foreground"
                              : "border-border bg-muted/30 text-muted-foreground hover:border-indigo-500/30"
                          )}
                        >
                          <span className="font-medium">{label}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.experience && <p className="text-xs text-rose-400">{errors.experience.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Key Skills</Label>
                  <Input
                    id="skills"
                    placeholder="e.g., Python, React, Project Management, SQL"
                    {...register("skills")}
                    className="rounded-xl bg-muted/50 border-border"
                  />
                  <p className="text-xs text-muted-foreground">Separate skills with commas — used for ATS scoring and interview prep</p>
                  {errors.skills && <p className="text-xs text-rose-400">{errors.skills.message}</p>}
                </div>
              </div>
            )}

            {/* ── Step 3: Bio ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="e.g., Full-stack engineer with 4 years building SaaS products. Passionate about developer tooling and clean architecture..."
                    className="h-36 rounded-xl bg-muted/50 border-border resize-none text-sm"
                    {...register("bio")}
                  />
                  <p className="text-xs text-muted-foreground">2–4 sentences works best. AI uses this to write your resume summary and cover letters.</p>
                  {errors.bio && <p className="text-xs text-rose-400">{errors.bio.message}</p>}
                </div>

                {/* What you unlock */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">What you unlock after this</p>
                  {[
                    "Personalized market insights for your industry",
                    "AI resume tailored to your experience level",
                    "Interview questions matched to your skills",
                    "10,000 free tokens — ready to use immediately",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-gradient-brand text-white border-0 hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={updateLoading}
                  className="rounded-xl bg-gradient-brand text-white border-0 hover:opacity-90"
                >
                  {updateLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Setting up...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Complete Setup</>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update this anytime from your profile settings.
        </p>
      </div>
    </div>
  );
};

export default OnboardingForm;
