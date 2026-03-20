"use client";

import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { BarChart3 } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e879f9", "#f0abfc"];

export default function TokenUsageChart({ transactions }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [], backgroundColor: PALETTE, borderWidth: 0 }] });

  useEffect(() => {
    const featureUsage = {};
    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const key = t.featureType || "Other";
        featureUsage[key] = (featureUsage[key] || 0) + Math.abs(t.amount);
      });

    setChartData({
      labels: Object.keys(featureUsage).map((k) =>
        k.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      ),
      datasets: [{
        data: Object.values(featureUsage),
        backgroundColor: PALETTE,
        borderWidth: 0,
        hoverOffset: 6,
      }],
    });
  }, [transactions]);

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "hsl(215, 20%, 65%)",
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${(ctx.raw || 0).toLocaleString()} tokens`,
        },
      },
    },
    cutout: "72%",
    responsive: true,
    maintainAspectRatio: false,
  };

  if (chartData.labels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-10 flex flex-col items-center gap-3 text-muted-foreground">
        <BarChart3 className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">No usage data yet</p>
        <p className="text-xs opacity-70">Start using AI features to see your usage breakdown</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
