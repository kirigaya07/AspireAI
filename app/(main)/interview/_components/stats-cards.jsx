import { useMemo } from "react";
import { Brain, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCards({ assessments }) {
  const averageScore = useMemo(() => {
    if (!assessments?.length) return "0.0";
    const total = assessments.reduce((sum, a) => sum + (a.quizScore || 0), 0);
    return (total / assessments.length).toFixed(1);
  }, [assessments]);

  const latestAssessment = useMemo(
    () => (assessments?.length ? assessments[assessments.length - 1] : null),
    [assessments]
  );

  const totalQuestions = useMemo(() => {
    if (!assessments?.length) return 0;
    return assessments.reduce((sum, a) => sum + (a.questions?.length || 0), 0);
  }, [assessments]);

  const cards = [
    {
      title: "Average Score",
      value: `${averageScore}%`,
      sub: "Across all assessments",
      icon: Trophy,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Questions Practiced",
      value: totalQuestions,
      sub: "Total questions",
      icon: Brain,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/10",
    },
    {
      title: "Latest Score",
      value: latestAssessment?.quizScore !== undefined
        ? `${latestAssessment.quizScore.toFixed(1)}%`
        : "0%",
      sub: "Most recent quiz",
      icon: Target,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ title, value, sub, icon: Icon, iconColor, iconBg }) => (
        <Card
          key={title}
          className="border border-border bg-card shadow-card hover:shadow-card-hover transition-shadow duration-200 rounded-2xl"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", iconBg)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
