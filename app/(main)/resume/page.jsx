import { getResume } from "@/actions/resume";
import React, { Suspense } from "react";
import ResumeBuilder from "./_components/resume-builder";
import SimpleLoader from "@/components/simple-loader";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

// Resume page component
const ResumeContent = async () => {
  const resume = await getResume();
  return <ResumeBuilder initialContent={resume?.content} />;
};

const ResumePage = async () => {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<SimpleLoader text="Loading resume builder..." />}>
        <ResumeContent />
      </Suspense>
    </div>
  );
};

export default ResumePage;
