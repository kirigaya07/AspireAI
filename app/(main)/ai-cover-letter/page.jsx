import { Suspense } from "react";
import CoverLetterContent from "./_components/cover-letter-content";
import SimpleLoader from "@/components/simple-loader";

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<SimpleLoader text="Loading cover letters..." />}>
      <CoverLetterContent />
    </Suspense>
  );
}
