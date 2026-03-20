export default function CoverLetterLoader() {
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative w-28 h-36 mb-6">
        <div className="absolute inset-0 rounded-xl border border-border animate-pulse">
          <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden">
            <div className="w-full h-16 bg-indigo-500/20 rounded-full transform -translate-y-8 animate-pulse" />
          </div>
          <div className="absolute top-3 left-3 right-3 bottom-3 bg-card rounded-lg border border-border flex flex-col justify-center items-center p-2 gap-1.5">
            <div className="h-2 w-3/4 bg-indigo-500/30 rounded animate-pulse" />
            <div className="h-2 w-4/5 bg-muted/70 rounded animate-pulse" />
            <div className="h-2 w-4/5 bg-muted/70 rounded animate-pulse" />
            <div className="h-2 w-3/4 bg-muted/70 rounded animate-pulse" />
          </div>
        </div>
        <div className="absolute -right-3 -bottom-3 w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center animate-pulse shadow-glow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-4 px-4">
        <div className="h-8 w-3/4 mx-auto bg-indigo-500/20 rounded-xl animate-pulse" />
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="h-24 w-full bg-card border border-border rounded-2xl p-4 flex justify-between items-center"
          >
            <div className="space-y-2 flex-1">
              <div className="h-5 w-1/3 bg-indigo-500/20 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/60 rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-muted/40 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-base font-medium text-foreground flex items-center justify-center gap-1">
          Loading Cover Letters
          <span className="flex ml-1 gap-0.5">
            {[0, 0.2, 0.4].map((d) => (
              <span key={d} className="animate-bounce text-indigo-400" style={{ animationDelay: `${d}s` }}>.</span>
            ))}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Preparing your professional correspondence</p>
      </div>
    </div>
  );
}
