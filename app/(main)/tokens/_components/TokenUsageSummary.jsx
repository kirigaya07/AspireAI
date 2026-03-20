"use client";

import { Zap, TrendingDown, Star } from "lucide-react";

export default function TokenUsageSummary({ transactions }) {
  const totalConsumed = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalPurchased = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const featureUsage = {};
  transactions
    .filter((t) => t.amount < 0 && t.featureType)
    .forEach((t) => {
      if (!featureUsage[t.featureType]) featureUsage[t.featureType] = 0;
      featureUsage[t.featureType] += Math.abs(t.amount);
    });

  const mostUsedFeature = Object.entries(featureUsage).sort((a, b) => b[1] - a[1])[0] || [];

  const formatFeatureName = (name) => {
    if (!name) return "N/A";
    return name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const stats = [
    {
      label: "Total Consumed",
      value: totalConsumed.toLocaleString(),
      sub: "tokens used",
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Total Purchased",
      value: totalPurchased.toLocaleString(),
      sub: "tokens added",
      icon: Zap,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Most Used Feature",
      value: formatFeatureName(mostUsedFeature[0]),
      sub: mostUsedFeature[1] ? `${mostUsedFeature[1].toLocaleString()} tokens` : "No usage yet",
      icon: Star,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={`rounded-2xl border ${border} ${bg} p-5 flex items-start gap-4`}
        >
          <div className={`h-10 w-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value || "0"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
