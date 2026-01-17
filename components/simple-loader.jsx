"use client";

/**
 * Simple, consistent loader component used across the application
 */
export default function SimpleLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
