"use client";
import { useEffect } from "react";

/**
 * Redirects to /offline when the browser goes offline.
 * The /offline page is precached by the service worker so it loads instantly.
 * Does nothing on admin pages (admin stays web-first).
 */
export default function OfflineDetector() {
  useEffect(() => {
    const handleOffline = () => {
      const p = window.location.pathname;
      // Don't redirect if already on /offline or on admin pages
      if (p.startsWith("/offline") || p.startsWith("/admin")) return;
      window.location.href = "/offline";
    };

    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  return null;
}
