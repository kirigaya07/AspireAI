"use client";

import { useState, useEffect } from "react";
import { getUserTokenInfo } from "@/actions/payments";
import { Zap } from "lucide-react";

export default function TokenBalance() {
  const [tokenInfo, setTokenInfo] = useState({ tokens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTokenInfo() {
      try {
        const info = await getUserTokenInfo();
        setTokenInfo(info);
      } catch (error) {
        console.error("Error loading token info:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTokenInfo();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-muted/50 h-9 w-32 rounded-xl" />;
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
      <Zap className="h-4 w-4 text-indigo-400" />
      <span className="text-sm font-medium text-indigo-300">
        {tokenInfo.tokens.toLocaleString()} tokens
      </span>
    </div>
  );
}
