import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, CheckCircle2, Zap, Brain, FileText, MessageSquare, BarChart3, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/faqs";
import { testimonial } from "@/data/testimonial";

const features = [
  {
    icon: Brain,
    color: "from-indigo-500/20 to-violet-500/20",
    iconColor: "text-indigo-400",
    title: "AI Interview Agent",
    description: "Converse with an intelligent AI interviewer that adapts to your responses, asks follow-ups, and gives you real-time feedback.",
    badge: "New",
  },
  {
    icon: FileText,
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-400",
    title: "LaTeX Resume Builder",
    description: "Generate stunning, ATS-optimized resumes using professional LaTeX templates. Export to PDF in one click.",
    badge: null,
  },
  {
    icon: BarChart3,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
    title: "ATS Score Analysis",
    description: "Instantly analyze your resume against job descriptions. See your match score, missing keywords, and actionable fixes.",
    badge: null,
  },
  {
    icon: MessageSquare,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
    title: "AI Cover Letters",
    description: "Generate tailored, compelling cover letters for any role in seconds. Personalized to the company and job description.",
    badge: null,
  },
  {
    icon: Zap,
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
    title: "Industry Insights",
    description: "Real-time market data: salary ranges, demand levels, trending skills, and growth forecasts for your industry.",
    badge: null,
  },
  {
    icon: Shield,
    color: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
    title: "Career Dashboard",
    description: "Track your interview performance, resume quality, and career progress all in one intelligent, personalized hub.",
    badge: null,
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description: "Sign up and tell us about your industry, experience level, and career goals. Takes less than 2 minutes.",
  },
  {
    number: "02",
    title: "Build Your Assets",
    description: "Create an ATS-optimized resume with LaTeX templates, generate cover letters, and analyze your job fit.",
  },
  {
    number: "03",
    title: "Practice & Improve",
    description: "Run mock interviews with our AI agent, track your scores, and get personalized coaching to land the offer.",
  },
];

const tokenPackages = [
  {
    name: "Starter",
    tokens: "10,000",
    price: "₹499",
    description: "Perfect for active job seekers",
    features: [
      "~50 AI resume improvements",
      "~20 cover letters",
      "~10 interview sessions",
      "ATS score analysis",
    ],
    highlight: false,
    cta: "Get Started",
  },
  {
    name: "Professional",
    tokens: "25,000",
    price: "₹999",
    description: "For serious career changers",
    features: [
      "~125 AI resume improvements",
      "~50 cover letters",
      "~25 interview sessions",
      "Priority AI processing",
    ],
    highlight: true,
    cta: "Most Popular",
  },
  {
    name: "Elite",
    tokens: "50,000",
    price: "₹1,799",
    description: "For career coaches & power users",
    features: [
      "~250 AI resume improvements",
      "~100 cover letters",
      "~50 interview sessions",
      "All features unlocked",
    ],
    highlight: false,
    cta: "Go Elite",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="grid-background" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 hero-glow">
        <div className="container mx-auto px-4 md:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 animate-slide-up leading-[1.08]">
            Land Your Dream Job{" "}
            <span className="gradient-title block">10× Faster</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            AspireAI gives you an AI interview agent, LaTeX resume builder, ATS scoring,
            and personalized industry insights — everything you need in one powerful platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-12 px-8 bg-gradient-brand hover:bg-gradient-brand-hover text-white font-medium rounded-xl border-0 shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02]"
              >
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-xl border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300"
              >
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-col items-center gap-3 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1 font-medium text-foreground">4.9/5</span>
              <span>from 2,000+ professionals</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> No credit card required</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 10,000 free tokens</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/50 py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50+", label: "Industries Covered" },
              { value: "1,000+", label: "Interview Questions" },
              { value: "95%", label: "Success Rate" },
              { value: "24/7", label: "AI Availability" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl md:text-4xl font-bold gradient-title">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/10">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Everything you need to{" "}
              <span className="gradient-title">get hired</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Purpose-built AI tools for every stage of your job search — from resume to offer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="relative overflow-hidden border-border bg-card card-hover group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-base">{feature.title}</h3>
                        {feature.badge && (
                          <Badge className="text-[10px] py-0 px-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interview Agent Spotlight ───────────────────────────── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/10">
                  AI Interview Agent
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                  Practice interviews that{" "}
                  <span className="gradient-title">actually prepare you</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Our AI interviewer adapts to your answers, asks intelligent follow-up questions,
                  and gives you detailed scoring and feedback — just like a real interview.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "FAANG, startup, and consulting interview styles",
                    "Behavioral, technical, system design & more",
                    "Real-time feedback on every answer",
                    "Detailed score card and improvement tips",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/interview/agent">
                  <Button className="bg-gradient-brand text-white border-0 rounded-xl hover:opacity-90 transition-opacity">
                    Try Interview Agent
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Mock Chat Preview */}
              <div className="relative">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-glow-lg">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium">AI Interviewer · Google SWE · Round 1</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%]">
                        Tell me about a time you had to optimize a critical system under time pressure.
                      </div>
                    </div>
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="h-7 w-7 rounded-full bg-indigo-500/30 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-300">You</div>
                      <div className="bg-indigo-500/15 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm max-w-[80%] text-muted-foreground">
                        At my last role, we had a database query taking 8 seconds on our checkout page...
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%]">
                        Interesting approach. What indexing strategy did you use, and how did you measure the improvement?
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      </div>
                      AI is evaluating your answer...
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex gap-2">
                    <div className="flex-1 h-9 rounded-xl bg-muted text-xs flex items-center px-3 text-muted-foreground">Your answer...</div>
                    <Button size="sm" className="h-9 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white border-0">Send</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/10">
              Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              From signup to{" "}
              <span className="gradient-title">job offer</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Three steps. Proven results.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connector line */}
            <div className="absolute top-10 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-purple-500/30 hidden md:block" />

            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                <div key={step.number} className="flex flex-col items-center text-center group">
                  <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors duration-300">
                      <span className="text-3xl font-bold gradient-title">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing / Tokens ───────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/10">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Pay for what you{" "}
              <span className="gradient-title">actually use</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Token-based pricing — no subscriptions, no wasted spend. Start free with 10,000 tokens.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tokenPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                  pkg.highlight
                    ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-card shadow-glow scale-[1.02]"
                    : "border-border bg-card hover:border-indigo-500/30"
                }`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-brand text-white border-0 shadow-glow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className="text-muted-foreground text-sm">one-time</span>
                  </div>
                  <p className="text-sm text-indigo-400 mt-1 font-medium">{pkg.tokens} tokens</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/tokens">
                  <Button
                    className={`w-full rounded-xl ${
                      pkg.highlight
                        ? "bg-gradient-brand text-white border-0 hover:opacity-90"
                        : "bg-secondary hover:bg-muted border border-border"
                    }`}
                  >
                    {pkg.highlight ? pkg.cta : "Buy Tokens"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            New accounts get <span className="text-emerald-400 font-medium">10,000 free tokens</span> — no payment required.
            Powered by <span className="text-indigo-400">Razorpay</span> with instant delivery.
          </p>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Loved by job seekers{" "}
              <span className="gradient-title">worldwide</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonial.map((item, index) => (
              <Card
                key={index}
                className="bg-card border-border card-hover"
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground text-sm leading-relaxed mb-6 italic">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Image
                      width={36}
                      height={36}
                      src={item.image}
                      alt={item.author}
                      className="rounded-full object-cover ring-2 ring-border"
                    />
                    <div>
                      <p className="text-sm font-semibold">{item.author}</p>
                      <p className="text-xs text-muted-foreground">{item.role} · <span className="text-indigo-400">{item.company}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Frequently asked{" "}
              <span className="gradient-title">questions</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about AspireAI.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <AccordionTrigger className="px-5 py-4 text-left text-sm font-medium hover:text-indigo-400 transition-colors [&[data-state=open]]:text-indigo-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-card overflow-hidden p-12 md:p-16 text-center max-w-4xl mx-auto shadow-glow">
            <div className="absolute inset-0 hero-glow opacity-50" />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                Start your career{" "}
                <span className="gradient-title">transformation</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
                Join 2,000+ professionals who use AspireAI to get hired faster.
                Your first 10,000 tokens are free.
              </p>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="h-14 px-10 bg-gradient-brand text-white border-0 rounded-2xl text-base font-semibold shadow-glow-lg hover:scale-[1.02] hover:shadow-glow transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
