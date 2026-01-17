import { Suspense } from "react";
import SimpleLoader from "@/components/simple-loader";

const Layout = ({ children }) => {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">Industry Insight</h1>
      </div>
      <Suspense fallback={<SimpleLoader text="Loading dashboard..." />}>
        {children}
      </Suspense>
    </div>
  );
};

export default Layout;
