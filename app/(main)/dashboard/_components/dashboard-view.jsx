"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Lightbulb,
  CalendarDays,
  Clock,
  ArrowUpRight,
  Activity,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Animate numbers on load
const AnimatedValue = ({
  value,
  prefix = "",
  suffix = "",
  duration = 1000,
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const startValue = 0;
    const endValue = Number(value);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = progress * (endValue - startValue) + startValue;

      setDisplayValue(parseFloat(currentValue.toFixed(decimals)));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration, decimals]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

// Enhanced tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg transition-all duration-200 animate-in fade-in">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm gap-4"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">
                  {item.name.replace(" (K)", "")}:
                </span>
              </div>
              <span className="font-medium">₹{item.value}LPA</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Updated StatCard with expandable skills section
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  secondaryValue,
  footer,
  classNames = {},
  skills = [],
}) => {
  // Add state to track if skills are expanded
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  // Check if this is the Skills card and has skills data
  const isSkillsCard = title === "Top Skills" && skills.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        classNames.card
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          classNames.header
        )}
      >
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={cn(
            `h-4 w-4 ${color || "text-muted-foreground"}`,
            classNames.icon
          )}
        />
      </CardHeader>
      <CardContent className={classNames.content}>
        <div className={cn("text-2xl font-bold", classNames.value)}>
          {typeof value === "number" ? (
            <AnimatedValue
              value={value}
              suffix={title === "Industry Growth" ? "%" : ""}
              decimals={title === "Industry Growth" ? 1 : 0}
            />
          ) : (
            value
          )}
        </div>

        {/* Skills display section */}
        {isSkillsCard && (
          <div className="flex flex-wrap gap-1 mt-2">
            {/* Show all skills if expanded, otherwise only show first 3 */}
            {(skillsExpanded ? skills : skills.slice(0, 3)).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}

            {/* Toggle button */}
            {skills.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSkillsExpanded(!skillsExpanded)}
              >
                {skillsExpanded ? "Show less" : `+${skills.length - 3} more`}
              </Badge>
            )}
          </div>
        )}

        {/* For non-skills cards with secondary value */}
        {!isSkillsCard && <div className="mt-2">{secondaryValue}</div>}
      </CardContent>
      <CardFooter className="pt-0 pb-3 px-6 text-xs text-muted-foreground">
        {footer}
      </CardFooter>
    </Card>
  );
};

const DashboardView = ({ insights }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: range.min,
    max: range.max,
    median: range.median,
  }));

  const barColors = ["#94a3b8", "#3b82f6", "#475569"];

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500", emoji: "📈" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500", emoji: "📊" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500", emoji: "📉" };
      default:
        return { icon: LineChart, color: "text-gray-500", emoji: "📊" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;
  const outlookEmoji = getMarketOutlookInfo(insights.marketOutlook).emoji;

  // Format dates using date-fns
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd MMM yyyy");
  const nextUpdateDistance = formatDistanceToNow(
    new Date(insights.nextUpdate),
    { addSuffix: true }
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header section with info and tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Market Dashboard
          </h1>
          <p className="text-muted-foreground">
            Industry insights and career analytics for your field
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs">Updated: {lastUpdatedDate}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Next: {nextUpdateDistance}</span>
          </Badge>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="trends">Skills & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-2">
          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Market Outlook"
              value={insights.marketOutlook}
              icon={OutlookIcon}
              color={outlookColor}
              secondaryValue={
                <div className="flex items-center mt-2 text-lg">
                  <span className="mr-1">{outlookEmoji}</span>
                  <span className={`text-sm ${outlookColor}`}>
                    {insights.marketOutlook === "POSITIVE"
                      ? "Growing market"
                      : insights.marketOutlook === "NEGATIVE"
                      ? "Contracting market"
                      : "Stable market"}
                  </span>
                </div>
              }
              footer={
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Next update {nextUpdateDistance}
                </div>
              }
            />

            <StatCard
              title="Industry Growth"
              value={insights.growthRate}
              icon={Activity}
              color="text-indigo-400"
              secondaryValue={
                <div className="mt-2">
                  <Progress value={insights.growthRate} className="h-2" />
                </div>
              }
              footer={
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {insights.growthRate > 5
                    ? "Strong growth"
                    : insights.growthRate > 2
                    ? "Moderate growth"
                    : "Slow growth"}
                </div>
              }
            />

            <StatCard
              title="Demand Level"
              value={insights.demandLevel}
              icon={BriefcaseIcon}
              color={
                insights.demandLevel === "HIGH"
                  ? "text-green-500"
                  : insights.demandLevel === "MEDIUM"
                  ? "text-yellow-500"
                  : "text-red-500"
              }
              secondaryValue={
                <div
                  className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                    insights.demandLevel
                  )}`}
                />
              }
              footer={
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {insights.demandLevel === "HIGH"
                    ? "High demand for roles"
                    : insights.demandLevel === "MEDIUM"
                    ? "Balanced job market"
                    : "Competitive job market"}
                </div>
              }
            />

            <StatCard
              title="Top Skills"
              value={`${insights.topSkills.length} Key Skills`}
              icon={Brain}
              skills={insights.topSkills}
              footer={
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Most in-demand abilities
                </div>
              }
            />
          </div>

          {/* Salary Ranges Chart */}
          <Card className="col-span-4 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Ranges by Role</CardTitle>
                <Badge variant="secondary" className="text-xs font-normal">
                  Values in ₹LPA
                </Badge>
              </div>
              <CardDescription>
                Minimum, median, and maximum salary comparison across roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salaryData}
                    barGap={2}
                    barCategoryGap="15%"
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}LPA`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="min"
                      fill={barColors[0]}
                      name="Min Salary (LPA)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="median"
                      fill={barColors[1]}
                      name="Median Salary (LPA)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="max"
                      fill={barColors[2]}
                      name="Max Salary (LPA)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between text-xs text-muted-foreground">
              <div>Data source: Glassdoor Community</div>
              <div>Updated {lastUpdatedDate}</div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-2">
          {/* Industry Trends and Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-indigo-500/5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/15 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Key Industry Trends</CardTitle>
                    <CardDescription>
                      Current trends shaping the industry
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {insights.keyTrends.map((trend, index) => (
                    <li key={index} className="flex gap-3 items-start group">
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/15 flex items-center justify-center mt-0.5 group-hover:bg-indigo-500/25 transition-colors">
                          <span className="text-indigo-400 text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        {index < insights.keyTrends.length - 1 && (
                          <div className="absolute top-6 bottom-0 left-1/2 w-0.5 -ml-[1px] h-full bg-indigo-500/15" />
                        )}
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg flex-1 group-hover:bg-muted transition-colors">
                        <p>{trend}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="bg-muted/30 py-3 text-xs text-muted-foreground">
                Based on analysis of current market conditions
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="bg-amber-500/5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/15 rounded-xl">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle>Recommended Skills</CardTitle>
                      <CardDescription>Enhance your expertise</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {insights.recommendedSkills.map((skill, index) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="py-1.5 px-3 bg-gradient-to-r from-card to-muted/80 hover:from-muted/80 hover:to-muted transition-colors cursor-default"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 py-3 text-xs text-muted-foreground">
                  Skills with highest growth in job listings
                </CardFooter>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Market Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    {insights.demandLevel === "HIGH" ? (
                      <>
                        The market currently shows{" "}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          strong demand
                        </span>{" "}
                        with a growth rate of{" "}
                        <span className="font-medium">
                          {insights.growthRate}%
                        </span>
                        . Companies are actively hiring and expanding their
                        teams.
                      </>
                    ) : insights.demandLevel === "MEDIUM" ? (
                      <>
                        The market currently shows{" "}
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          moderate demand
                        </span>{" "}
                        with a growth rate of{" "}
                        <span className="font-medium">
                          {insights.growthRate}%
                        </span>
                        . Job openings remain stable with selective hiring in
                        key areas.
                      </>
                    ) : (
                      <>
                        The market currently shows{" "}
                        <span className="font-medium text-red-600 dark:text-red-400">
                          limited demand
                        </span>{" "}
                        with a growth rate of{" "}
                        <span className="font-medium">
                          {insights.growthRate}%
                        </span>
                        . Competition for positions is high with selective
                        hiring processes.
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardView;
