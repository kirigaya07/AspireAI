import { getIndustryInsights } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";
import { Suspense } from "react";
import SimpleLoader from "@/components/simple-loader";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

// Separate content component that fetches data
const DashboardContent = async () => {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const insights = await getIndustryInsights();

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
};

const IndustryInsight = () => {
  return (
    <Suspense fallback={<SimpleLoader text="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
};

export default IndustryInsight;
