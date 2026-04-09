"use client";
import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "chromium" | "safari" | null;

const DISMISSED_KEY = "kc_install_dismissed";
const INSTALLED_SEEN_KEY = "kc_installed_seen";

// ── Helpers ──────────────────────────────────────────────────────────────────
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Standard check (Chrome, Edge, Firefox)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Safari on iOS sets this when launched from the home screen
  if ("standalone" in window.navigator && (navigator as unknown as { standalone: boolean }).standalone) return true;
  return false;
}

function isSafariIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Must be iOS (iPhone/iPad/iPod) and NOT Chrome/Firefox/Edge on iOS
  return /iP(hone|ad|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function isAdminRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

// ── Installed Toast (auto-dismissing confirmation) ──────────────────────────
function InstalledToast({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2500);
    const removeTimer = setTimeout(onDone, 3200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-50 kc-card px-4 py-3 flex items-center gap-3"
      style={{
        boxShadow: "0 4px 24px rgba(26,26,26,0.12)",
        maxWidth: "360px",
        margin: "0 auto",
        border: "1.5px solid var(--kc-gold-lt)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s ease-out",
      }}
    >
      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>✓</span>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Kai&apos;s Coffee Installed
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
          You&apos;re all set — works offline too.
        </p>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PromptMode>(null);
  const [visible, setVisible] = useState(false);
  const [showInstalledToast, setShowInstalledToast] = useState(false);

  useEffect(() => {
    // Skip admin routes entirely
    if (isAdminRoute()) return;

    // ── Installed state: show a one-time confirmation toast ──
    if (isStandalone()) {
      if (!localStorage.getItem(INSTALLED_SEEN_KEY)) {
        localStorage.setItem(INSTALLED_SEEN_KEY, "1");
        setShowInstalledToast(true);
      }
      return;
    }

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
      localStorage.setItem(INSTALLED_SEEN_KEY, "1");
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // ── Safari iOS: show manual instructions after a short delay ──
    // Only if beforeinstallprompt hasn't fired (Safari never fires it)
    const safariTimer = setTimeout(() => {
      if (isSafariIOS()) {
        setMode("safari");
        setVisible(true);
      }
    }, 3000); // Wait 3s so the page feels settled before prompting

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearTimeout(safariTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!nativePrompt) return;
    await nativePrompt.prompt();
    // appinstalled event handles the success UI transition
    await nativePrompt.userChoice;
  }, [nativePrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }, []);

  // ── Installed toast (auto-dismissing) ──
  if (showInstalledToast) {
    return <InstalledToast onDone={() => setShowInstalledToast(false)} />;
  }

  if (!visible) return null;

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
            {mode === "safari" ? "Get the Kai's Coffee App" : "Add to Home Screen"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
            {mode === "safari"
              ? "Install for the full app experience — works offline too."
              : "Get the full app experience — works offline too."}
          </p>
        </div>
      </div>

      {/* ── Safari iOS: step-by-step share sheet instructions ── */}
      {mode === "safari" && (
        <div
          className="mt-3 rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
          style={{ background: "var(--kc-bg)", border: "1px solid var(--kc-border)", borderColor: "rgba(26,26,26,0.08)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--kc-black)" }}>
            How to install:
          </p>
          <p className="text-xs" style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}>
            1. Tap the <strong style={{ color: "var(--kc-blue-deep)" }}>Share</strong> button
            <span style={{ fontSize: "0.8rem" }}> (the square with an arrow)</span>
          </p>
          <p className="text-xs" style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}>
            2. Scroll down and tap <strong style={{ color: "var(--kc-blue-deep)" }}>Add to Home Screen</strong>
          </p>
          <p className="text-xs" style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}>
            3. Tap <strong style={{ color: "var(--kc-blue-deep)" }}>Add</strong>
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-2 justify-end mt-3">
        <button onClick={handleDismiss} className="kc-btn kc-btn-sm kc-btn-outline">
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
