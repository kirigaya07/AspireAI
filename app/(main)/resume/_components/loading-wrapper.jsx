"use client";

import React, { useState, useEffect } from "react";

/**
 * LoadingWrapper - Shows content after a short delay to prevent flash
 * Reduced delay from 5000ms to 300ms for faster page transitions
 */
const LoadingWrapper = ({ children, fallback, minLoadingTime = 300 }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout for the minimum loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadingTime);

    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  // Show fallback while loading
  if (isLoading) {
    return fallback;
  }

  // Show the actual content after loading
  return children;
};

export default LoadingWrapper;
