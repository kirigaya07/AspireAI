"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  lazy,
} from "react";
import useFetch from "@/hooks/use-fetch";
import {
  getTokenPackages,
  getPaymentHistory,
  getTokenTransactions,
} from "@/actions/payments";
import { Loader2, Zap, CreditCard, RefreshCw } from "lucide-react";
import TokenUsageSummary from "./TokenUsageSummary";
import TokenUsageChart from "./TokenUsageChart";
import TokenHistory from "./TokenHistory";

const BuyTokens = lazy(() => import("./BuyTokens"));

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Invalid date";
  }
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
    <p className="text-sm text-muted-foreground">Loading payment information...</p>
  </div>
);

const ErrorState = ({ paymentsError, packagesError, onRetry }) => (
  <div className="container mx-auto px-4 py-8 max-w-xl">
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
      <h1 className="text-xl font-semibold text-rose-400 mb-2">Error Loading Payment Information</h1>
      <p className="text-sm text-muted-foreground mb-4">
        There was a problem loading your payment information. Please try again.
      </p>
      {(paymentsError || packagesError) && (
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground mb-4 font-mono">
          {paymentsError && <p>Payments: {paymentsError.message}</p>}
          {packagesError && <p>Packages: {packagesError.message}</p>}
        </div>
      )}
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  </div>
);

const PaymentHistoryTable = React.memo(({ payments, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-border">
      <thead>
        <tr className="bg-muted/30">
          {["Date", "Amount", "Tokens", "Status"].map((h) => (
            <th
              key={h}
              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(payment.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                {payment.currency} {payment.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 font-medium">
                +{payment.tokensAdded.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    payment.status === "COMPLETED"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : payment.status === "PENDING"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {payment.status}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <CreditCard className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No payment history found</p>
                <p className="text-xs opacity-70">Purchase tokens to see your history here</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
});
PaymentHistoryTable.displayName = "PaymentHistoryTable";

export default function TokensContent() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const isMounted = useRef(true);

  const { loading: loadingPayments, data: payments, error: paymentsError, fn: fetchPayments } = useFetch(getPaymentHistory);
  const { loading: loadingPackages, data: packages, error: packagesError, fn: fetchPackages } = useFetch(getTokenPackages);

  const safePayments = useMemo(() => (Array.isArray(payments) ? payments : []), [payments]);
  const safePackages = useMemo(() => (Array.isArray(packages) ? packages : []), [packages]);

  const handleRetry = useCallback(() => {
    setIsInitialLoad(true);
    Promise.all([fetchPayments(), fetchPackages()]).finally(() => {
      if (isMounted.current) setIsInitialLoad(false);
    });
  }, [fetchPayments, fetchPackages]);

  const handleRefreshPackages = useCallback(() => fetchPackages(), [fetchPackages]);

  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      try {
        await Promise.all([fetchPayments(), fetchPackages()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted.current) setIsInitialLoad(false);
      }
    };
    fetchData();
    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTokenTransactions();
        setTransactions(data || []);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoadingTransactions(false);
      }
    }
    loadTransactions();
  }, []);

  if (isInitialLoad) return <LoadingState />;
  if (paymentsError || packagesError) {
    return <ErrorState paymentsError={paymentsError} packagesError={packagesError} onRetry={handleRetry} />;
  }

  const SectionHeader = ({ icon: Icon, label }) => (
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5 mb-4">
      <Icon className="h-5 w-5 text-indigo-400" />
      {label}
    </h2>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Token Management</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-[52px]">
          Tokens power all AI features. Purchase more anytime to keep the momentum going.
        </p>
      </div>

      {/* Token Usage Summary */}
      <section>
        <SectionHeader icon={Zap} label="Token Usage" />
        {loadingTransactions ? (
          <div className="rounded-2xl border border-border bg-card/50 p-6 animate-pulse">
            <div className="h-20 bg-muted/50 rounded-xl" />
          </div>
        ) : (
          <TokenUsageSummary transactions={transactions} />
        )}
      </section>

      {/* Usage Breakdown Chart */}
      <section>
        <SectionHeader icon={Zap} label="Usage Breakdown" />
        {loadingTransactions ? (
          <div className="rounded-2xl border border-border bg-card/50 p-6 animate-pulse">
            <div className="h-64 bg-muted/50 rounded-xl" />
          </div>
        ) : (
          <TokenUsageChart transactions={transactions} />
        )}
      </section>

      {/* Transaction History */}
      <section>
        <SectionHeader icon={Zap} label="Transaction History" />
        <TokenHistory transactions={transactions} isLoading={loadingTransactions} />
      </section>

      {/* Payment History */}
      <section>
        <SectionHeader icon={CreditCard} label="Payment History" />
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <PaymentHistoryTable payments={safePayments} isLoading={loadingPayments} />
        </div>
      </section>

      {/* Purchase Tokens */}
      <section>
        <SectionHeader icon={CreditCard} label="Purchase Tokens" />
        {loadingPackages ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : safePackages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground text-sm">No packages available. Please try again later.</p>
            <button onClick={handleRefreshPackages} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">
              Refresh
            </button>
          </div>
        ) : (
          <BuyTokens packages={safePackages} />
        )}
      </section>
    </div>
  );
}
