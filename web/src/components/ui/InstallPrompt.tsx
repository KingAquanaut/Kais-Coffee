"use client";
import { useEffect, useState, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "chromium" | "safari" | null;

const DISMISSED_KEY = "kc_install_dismissed";
const INSTALLED_SEEN_KEY = "kc_installed_seen";

// ── Detection helpers (client-only, safe to call in lazy initialisers) ───────
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (
    "standalone" in window.navigator &&
    (navigator as unknown as { standalone: boolean }).standalone
  )
    return true;
  return false;
}

function isSafariIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iP(hone|ad|od)/.test(ua) &&
    /WebKit/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS/.test(ua)
  );
}

function isAdminRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

// ── Installed Toast ─────────────────────────────────────────────────────────
// Slides up, holds for 4 s, fades out, then unmounts.
function InstalledToast({ onDone }: Readonly<{ onDone: () => void }>) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // enter → visible on next frame (allows CSS transition to trigger)
    const raf = requestAnimationFrame(() => setPhase("visible"));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;
    const exitTimer = setTimeout(() => setPhase("exit"), 4000);
    return () => clearTimeout(exitTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exit") return;
    const removeTimer = setTimeout(() => onDoneRef.current(), 700);
    return () => clearTimeout(removeTimer);
  }, [phase]);

  const opacity = phase === "visible" ? 1 : 0;
  const translateY = phase === "enter" ? "16px" : "0px";

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3"
      style={{
        maxWidth: "340px",
        margin: "0 auto",
        padding: "14px 18px",
        borderRadius: "16px",
        border: "1.5px solid var(--kc-gold-lt)",
        background: "rgba(250,247,242,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "0 8px 32px rgba(26,26,26,0.10), 0 1.5px 4px rgba(26,26,26,0.06)",
        opacity,
        transform: `translateY(${translateY})`,
        transition:
          "opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--kc-gold-lt)",
          color: "var(--kc-gold)",
          fontSize: "0.85rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✓
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug"
          style={{ fontFamily: "var(--font-heading)", color: "var(--kc-black)" }}
        >
          Kai&apos;s Coffee Installed
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--kc-muted)", marginTop: 2 }}
        >
          You&apos;re all set — works offline too.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [nativePrompt, setNativePrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PromptMode>(null);
  const [visible, setVisible] = useState(false);

  // Derive the initial toast state lazily so we never call setState
  // synchronously inside an effect (react-hooks/set-state-in-effect).
  const [showInstalledToast, setShowInstalledToast] = useState(() => {
    if (typeof window === "undefined") return false;
    if (isAdminRoute()) return false;
    if (!isStandalone()) return false;
    if (localStorage.getItem(INSTALLED_SEEN_KEY)) return false;
    return true;
  });

  // Persist the "seen" flag when the toast first shows (covers both the
  // lazy-init path above and the appinstalled event path below).
  useEffect(() => {
    if (showInstalledToast) {
      localStorage.setItem(INSTALLED_SEEN_KEY, "1");
    }
  }, [showInstalledToast]);

  useEffect(() => {
    // Skip if already in standalone/installed mode or on admin routes
    if (isAdminRoute() || isStandalone()) return;
    // Previously dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // ── Chromium: capture the native prompt ──
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setNativePrompt(e as BeforeInstallPromptEvent);
      setMode("chromium");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // ── Chromium: listen for successful install ──
    const onAppInstalled = () => {
      setVisible(false);
      setShowInstalledToast(true);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // ── Safari iOS: show manual instructions after a short delay ──
    const safariTimer = setTimeout(() => {
      if (isSafariIOS()) {
        setMode("safari");
        setVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearTimeout(safariTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!nativePrompt) return;
    await nativePrompt.prompt();
    await nativePrompt.userChoice;
  }, [nativePrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }, []);

  // ── Render: installed toast ──
  if (showInstalledToast) {
    return <InstalledToast onDone={() => setShowInstalledToast(false)} />;
  }

  if (!visible) return null;

  // ── Render: install prompt ──
  return (
    <div
      role="banner"
      className="fixed bottom-4 left-4 right-4 z-50 kc-card p-4"
      style={{
        boxShadow: "0 4px 24px rgba(26,26,26,0.18)",
        maxWidth: "420px",
        margin: "0 auto",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="kc-img-placeholder flex-shrink-0"
          style={{ width: 44, height: 44, fontSize: "1.25rem" }}
        >
          ☕
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {mode === "safari"
              ? "Get the Kai\u2019s Coffee App"
              : "Add to Home Screen"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
            {mode === "safari"
              ? "Install for the full app experience \u2014 works offline too."
              : "Get the full app experience \u2014 works offline too."}
          </p>
        </div>
      </div>

      {mode === "safari" && (
        <div
          className="mt-3 rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
          style={{
            background: "var(--kc-bg)",
            border: "1px solid rgba(26,26,26,0.08)",
          }}
        >
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--kc-black)" }}
          >
            How to install:
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}
          >
            1. Tap the{" "}
            <strong style={{ color: "var(--kc-blue-deep)" }}>Share</strong>{" "}
            button
            <span style={{ fontSize: "0.8rem" }}>
              {" "}
              (the square with an arrow)
            </span>
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}
          >
            2. Scroll down and tap{" "}
            <strong style={{ color: "var(--kc-blue-deep)" }}>
              Add to Home Screen
            </strong>
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}
          >
            3. Tap{" "}
            <strong style={{ color: "var(--kc-blue-deep)" }}>Add</strong>
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-3">
        <button
          onClick={handleDismiss}
          className="kc-btn kc-btn-sm kc-btn-outline"
        >
          Not now
        </button>
        {mode === "chromium" && (
          <button onClick={handleInstall} className="kc-btn kc-btn-sm">
            Install
          </button>
        )}
      </div>
    </div>
  );
}
