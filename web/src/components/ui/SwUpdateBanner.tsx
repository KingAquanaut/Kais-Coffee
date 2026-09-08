"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Update available" prompt for the installed PWA and the browser tab alike.
 *
 * Lifecycle (next-pwa is configured with skipWaiting: false, so a new worker
 * genuinely waits instead of swapping the user mid-session):
 *
 *   1. A new service worker installs and reaches `waiting`.
 *   2. We detect it — either already waiting at load, or via `updatefound`.
 *   3. This prompt appears. Nothing has changed for the user yet.
 *   4. Refresh Now posts SKIP_WAITING to the waiting worker.
 *   5. It activates, clientsClaim() fires `controllerchange`.
 *   6. We reload exactly once, and the new build is live.
 *
 * The first-ever install is skipped: with no existing controller there is no
 * older version to update from, so there is nothing to announce.
 */

/** Set the moment we begin reloading, so a second controllerchange is ignored. */
let reloading = false;

const DISMISS_KEY = "kc-sw-update-dismissed";

export default function SwUpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [busy, setBusy] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  // Only a reload we asked for should follow a controllerchange. Without this,
  // the claim that happens on a first install would reload an innocent visitor.
  const userTriggered = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const dismissedThisSession = () => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  };

  const offerUpdate = useCallback((sw: ServiceWorker | null) => {
    if (!sw) return;
    // Respect a "Later" for the rest of this session rather than re-nagging on
    // every focus, but the prompt returns on the next visit while it's pending.
    if (dismissedThisSession()) return;
    setWaiting(sw);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    const wire = (reg: ServiceWorkerRegistration) => {
      if (cancelled) return;
      regRef.current = reg;

      // Case A: a worker was already waiting when this page loaded (the update
      // landed during a previous visit, or in another tab).
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);

      // Case B: an update is found while the app is open.
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // `controller` is null on the very first install — nothing to update.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            offerUpdate(reg.waiting ?? installing);
          }
        });
      });
    };

    navigator.serviceWorker.getRegistration().then(reg => { if (reg) wire(reg); }).catch(() => {});

    // Reload once the new worker has taken control — but only if this session
    // asked for it. Guarded so multiple events can't loop the page.
    const onControllerChange = () => {
      if (!userTriggered.current || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Re-check for updates when the app comes back to the foreground. An
    // installed PWA can sit open for days without ever re-requesting the SW.
    // Offline, update() just rejects — nothing to handle.
    const checkForUpdate = () => {
      if (document.visibilityState !== "visible") return;
      regRef.current?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, [offerUpdate]);

  // Deliberately no focus steal. This is a non-blocking notice that can appear
  // while an admin is mid-form; yanking focus would lose their place. It is
  // announced politely instead, and both buttons are in the normal tab order.

  const handleRefresh = () => {
    if (!waiting) return;
    setBusy(true);
    userTriggered.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });

    // Safety net: if the worker never activates (an odd browser state, or it
    // was already gone), reload anyway rather than leaving a dead button.
    window.setTimeout(() => {
      if (!reloading) { reloading = true; window.location.reload(); }
    }, 3000);
  };

  const handleLater = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
    setWaiting(null);
  };

  if (!waiting) return null;

  const version = process.env.NEXT_PUBLIC_BUILD_ID;

  return (
    <div
      ref={boxRef}
      role="status"
      aria-live="polite"
      aria-labelledby="kc-update-title"
      className="fixed z-50 kc-card p-4"
      style={{
        // Bottom sheet on phones, compact card bottom-right from sm up. Sits
        // above the iOS home indicator via the safe-area inset.
        left: "1rem",
        right: "1rem",
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        maxWidth: "26rem",
        marginLeft: "auto",
        border: "1.5px solid var(--kc-gold-lt)",
        boxShadow: "0 8px 32px rgba(26,26,26,0.22)",
        outline: "none",
      }}
    >
      <p
        id="kc-update-title"
        className="font-bold text-sm leading-snug"
        style={{ fontFamily: "var(--font-heading)", color: "var(--kc-blue-deep)" }}
      >
        Kai&apos;s Coffee has been updated
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--kc-muted)" }}>
        Refresh now to get the latest changes.
        {version && (
          <>
            {" "}
            <span className="tabular-nums">Version {version} is ready.</span>
          </>
        )}
      </p>
      <div className="flex gap-2 justify-end mt-3">
        <button onClick={handleLater} className="kc-btn kc-btn-sm kc-btn-outline" disabled={busy}>
          Later
        </button>
        <button onClick={handleRefresh} className="kc-btn kc-btn-sm kc-btn-gold" disabled={busy}>
          {busy ? "Refreshing…" : "Refresh Now"}
        </button>
      </div>
    </div>
  );
}
