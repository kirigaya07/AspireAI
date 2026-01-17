"use client";

import { useState, useEffect } from "react";

/**
 * DelayedLoader - Shows content after a short delay to prevent flash
 * Reduced delay from 5000ms to 300ms for faster page transitions
 */
export default function DelayedLoader({ children, fallback, delay = 300 }) {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    if (!showContent) {
        return fallback;
    }

    return children;
} 