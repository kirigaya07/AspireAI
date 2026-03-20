import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto mt-20 mb-16 px-4 md:px-6">
      {children}
    </div>
  );
};

export default MainLayout;
