"use client";

import { Loader2, History } from "lucide-react";

const formatFeatureName = (name) => {
  if (!name) return "N/A";
  return name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

export default function TokenHistory({ transactions, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-8 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        <span className="text-sm text-muted-foreground">Loading transaction history...</span>
      </div>
    );
  }

  const consumptionTransactions = (transactions || []).filter((t) => t.amount < 0);

  if (consumptionTransactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-10 flex flex-col items-center gap-3 text-muted-foreground">
        <History className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">No token usage recorded yet</p>
        <p className="text-xs opacity-70">Your AI feature usage will appear here</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/30">
              {["Date", "Description", "Feature", "Tokens Used"].map((h, i) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    i === 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {consumptionTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                    {formatFeatureName(transaction.featureType || "N/A")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-rose-400">
                  -{Math.abs(transaction.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
