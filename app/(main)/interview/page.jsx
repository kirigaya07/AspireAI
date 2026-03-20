import { getAssessments } from "@/actions/interview";
import { getInterviewSessions } from "@/actions/interview-agent";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Zap, MessageSquare, Trophy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

function SessionRow({ session }) {
  const statusColor = {
    COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    ACTIVE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ABANDONED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
          <Brain className="h-4.5 w-4.5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium">{session.jobTitle}</p>
          <p className="text-xs text-muted-foreground">
            {session.company ? `${session.company} · ` : ""}{session.type.replace("_", " ")} · {session.difficulty}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {session.score != null && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>{session.score}/100</span>
          </div>
        )}
        <Badge className={`text-xs ${statusColor[session.status] || statusColor.ABANDONED}`}>
          {session.status}
        </Badge>
        <span className="text-xs text-muted-foreground hidden sm:block">
          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

export default async function InterviewPrepPage() {
  const [assessments, sessions] = await Promise.all([
    getAssessments(),
    getInterviewSessions(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight gradient-title">Interview Prep</h1>
      </div>

      {/* AI Agent Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow shrink-0">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-lg">AI Interview Agent</h2>
                <Badge className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30">New</Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Practice with a conversational AI that adapts to your answers, asks follow-ups,
                and provides detailed scoring — just like a real interview.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />Conversational</span>
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />200 tokens/session</span>
                <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />Scored & analyzed</span>
              </div>
            </div>
          </div>
          <Link href="/interview/agent">
            <Button className="shrink-0 bg-gradient-brand text-white border-0 rounded-xl hover:opacity-90">
              Start Session
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards assessments={assessments} />

      {/* Agent Session History */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Agent Sessions</h2>
            <Link href="/interview/agent">
              <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-xs rounded-lg">
                New Session <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {sessions.slice(0, 5).map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Quiz Performance */}
      <PerformanceChart assessments={assessments} />

      {/* Quiz History */}
      <QuizList assessments={assessments} />
    </div>
  );
}
