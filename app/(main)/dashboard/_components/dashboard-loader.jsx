"use client";

export default function DashboardLoader() {
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative w-36 h-36 mb-6">
        <div className="absolute inset-0 rounded-2xl border border-border bg-card shadow-card animate-pulse">
          <div className="absolute top-3 left-3 right-3 h-12 rounded-xl overflow-hidden">
            <div className="flex h-full items-end justify-between px-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 bg-indigo-500/60 rounded-t"
                  style={{
                    height: `${Math.max(20, Math.min(100, 30 + Math.sin(i * 0.8) * 60))}%`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute top-18 inset-x-3 flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-1 h-8 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
          <div className="absolute bottom-3 inset-x-3 h-10 rounded-lg bg-muted/60 animate-pulse" />
        </div>
        <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-glow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="absolute -right-2 -top-2 w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-glow animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto space-y-4 px-4">
        <div className="h-8 w-1/2 mx-auto bg-indigo-500/20 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card p-3 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-1/2 bg-indigo-500/15 rounded animate-pulse" />
                <div className="h-4 w-4 rounded-full bg-indigo-500/20 animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-muted/60 rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-72 w-full bg-card rounded-2xl border border-border p-4">
          <div className="h-8 w-1/3 bg-muted/60 rounded animate-pulse mb-4" />
          <div className="h-48 w-full flex items-end justify-between px-2 gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-full">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600/60 to-indigo-400/40 rounded-t animate-pulse"
                  style={{ height: `${Math.max(20, Math.min(100, 40 + Math.sin(i * 0.9) * 50))}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-base font-medium text-foreground flex items-center justify-center gap-1">
          Loading Industry Insights
          <span className="flex ml-1 gap-0.5">
            {[0, 0.2, 0.4].map((d) => (
              <span key={d} className="animate-bounce text-indigo-400" style={{ animationDelay: `${d}s` }}>.</span>
            ))}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Analyzing industry data and market trends</p>
      </div>
    </div>
  );
}
