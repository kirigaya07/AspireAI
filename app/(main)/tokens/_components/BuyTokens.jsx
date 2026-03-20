"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BuyTokens({ packages }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "AspireAI",
        description: `Purchase ${selectedPackage.tokens} tokens`,
        order_id: data.orderId,
        handler: async function (response) {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: selectedPackage.id,
            }),
          });
          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            router.refresh();
            alert("Payment successful! Tokens added to your account.");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: "User", email: "user@example.com" },
        theme: { color: "#6366f1" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which package is "popular" (middle one)
  const popularIdx = Math.floor(packages.length / 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg, idx) => {
          const isSelected = selectedPackage?.id === pkg.id;
          const isPopular = idx === popularIdx;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={cn(
                "relative rounded-2xl border p-5 cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 shadow-glow"
                  : "border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/5"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <Zap className="h-4.5 w-4.5 text-indigo-400" />
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-foreground mb-1">{pkg.description}</h3>
              <p className="text-2xl font-bold text-indigo-400 mb-0.5">₹{pkg.amount}</p>
              <p className="text-sm text-muted-foreground">{pkg.tokens.toLocaleString()} tokens</p>

              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-xs text-muted-foreground">
                  ₹{(pkg.amount / pkg.tokens * 1000).toFixed(2)} per 1000 tokens
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handlePurchase}
        disabled={!selectedPackage || isLoading}
        className={cn(
          "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
          !selectedPackage || isLoading
            ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-glow"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            {selectedPackage ? `Purchase ${selectedPackage.tokens.toLocaleString()} Tokens` : "Select a Package"}
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Secured by Razorpay · Instant delivery · No expiry
      </p>
    </div>
  );
}
