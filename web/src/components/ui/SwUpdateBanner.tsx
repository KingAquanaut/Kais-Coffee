"use client";
import { useEffect, useState } from "react";

/**
 * Shows a non-intrusive banner when a new service worker has taken control,
 * prompting the user to refresh and get the latest version.
 *
 * With skipWaiting: true in next-pwa, the new SW activates immediately.
 * We detect this via the `controllerchange` event on navigator.serviceWorker.
 * A page refresh is still needed so the browser loads assets from the new cache.
 *
 * Safety:
 * - Only shows once per controller change (flag prevents re-renders).
 * - Does not show on the very first SW install (no previous controller).
 * - Dismissible — user can ignore it.
 * - Does not auto-refresh; avoids infinite loops.
 * - Skipped on admin routes to avoid disrupting active workflows.
 */
export default function SwUpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Only show update banner if there was already a controller (not first install)
    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      // Skip admin routes — don't interrupt mid-workflow
      if (window.location.pathname.startsWith("/admin")) return;
      if (hadController) setShow(true);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-4 right-4 z-50 kc-card p-4 flex items-center gap-3"
      style={{
        boxShadow: "0 4px 24px rgba(26,26,26,0.18)",
        maxWidth: "420px",
        margin: "0 auto",
        border: "1.5px solid var(--kc-gold-lt)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          New version available
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
          Refresh to get the latest Kai&apos;s Coffee experience.
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShow(false)}
          className="kc-btn kc-btn-sm kc-btn-outline"
        >
          Later
        </button>
        <button
          onClick={() => window.location.reload()}
          className="kc-btn kc-btn-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
