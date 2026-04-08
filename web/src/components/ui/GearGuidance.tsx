"use client";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/contexts/LangContext";

/**
 * GearGuidance — subtle one-time callout pointing to the settings gear,
 * teaching users they can change their language later.
 *
 * Appears after the first language pick (listens for "kc-lang-first-pick" event).
 * Auto-dismisses after a few seconds, or on click.
 * Only shows once (tracked by localStorage).
 */

const SHOWN_KEY = "kc-gear-guidance-shown";

export default function GearGuidance() {
  const { strings } = useLang();
  const [show, setShow] = useState(false);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(SHOWN_KEY, "1");
  }, []);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(SHOWN_KEY);
    if (alreadyShown) return;

    const handlePick = () => {
      setTimeout(() => setShow(true), 600);
    };

    globalThis.addEventListener("kc-lang-first-pick", handlePick);
    return () => globalThis.removeEventListener("kc-lang-first-pick", handlePick);
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <button
      onClick={dismiss}
      aria-label={strings.gearGuide.title}
      className="kc-guidance-btn"
      style={{
        position: "fixed",
        top: 56,
        right: 12,
        zIndex: 9997,
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        textAlign: "left",
      }}
    >
      {/* Arrow pointing up-right toward the gear */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -6,
          right: 16,
          width: 12,
          height: 12,
          background: "var(--kc-cream)",
          border: "1.5px solid var(--kc-blue-deep)",
          borderRight: "none",
          borderBottom: "none",
          transform: "rotate(45deg)",
        }}
      />

      <div
        style={{
          background: "var(--kc-cream)",
          border: "1.5px solid var(--kc-blue-deep)",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          maxWidth: 240,
          boxShadow: "0 8px 24px rgba(58,124,165,0.2)",
        }}
      >
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--kc-black)", marginBottom: "0.25rem" }}>
          {strings.gearGuide.title}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--kc-muted)", lineHeight: 1.4 }}>
          {strings.gearGuide.body}
        </p>
      </div>

      <style>{`
        @keyframes kc-guidance-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kc-guidance-btn { animation: kc-guidance-in 0.4s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .kc-guidance-btn { animation: none; }
        }
      `}</style>
    </button>
  );
}
