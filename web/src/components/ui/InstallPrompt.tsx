"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "kc_install_dismissed";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      sessionStorage.getItem(DISMISSED_KEY)
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-4 right-4 z-50 kc-card p-4 flex items-center gap-3"
      style={{ boxShadow: "0 4px 24px rgba(26,26,26,0.18)", maxWidth: "480px", margin: "0 auto" }}
    >
      <div
        className="kc-img-placeholder flex-shrink-0"
        style={{ width: 44, height: 44, fontSize: "1.25rem" }}
      >
        ☕
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
          Add to Home Screen
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
          Get the full app experience — works offline too.
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={handleDismiss} className="kc-btn kc-btn-sm kc-btn-outline">
          Not now
        </button>
        <button onClick={handleInstall} className="kc-btn kc-btn-sm">
          Install
        </button>
      </div>
    </div>
  );
}
