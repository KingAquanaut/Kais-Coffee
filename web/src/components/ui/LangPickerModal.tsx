"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

/**
 * LangPickerModal — shown once on first visit to let the user pick a language.
 *
 * - Only shows if localStorage has no "kc-lang" AND no "kc-lang-picked" flag.
 * - After selection, sets both "kc-lang" (via context) and "kc-lang-picked".
 * - Never shows again once dismissed.
 */

const PICKED_KEY = "kc-lang-picked";

export default function LangPickerModal() {
  const { setLang } = useLang();
  const [show, setShow] = useState(() => {
    if (globalThis.window === undefined) return false;
    return !localStorage.getItem(PICKED_KEY);
  });

  const handleSelect = (code: LangCode) => {
    setLang(code);
    localStorage.setItem(PICKED_KEY, "1");
    setShow(false);
    globalThis.dispatchEvent(new CustomEvent("kc-lang-first-pick"));
  };

  const handleDismiss = () => {
    localStorage.setItem(PICKED_KEY, "1");
    setShow(false);
    globalThis.dispatchEvent(new CustomEvent("kc-lang-first-pick"));
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
      className="kc-modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleDismiss}
      onKeyDown={e => { if (e.key === "Escape") handleDismiss(); }}
    >
      <div
        role="document"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        className="kc-modal-card"
        style={{
          background: "var(--kc-cream)",
          border: "1.5px solid var(--kc-border)",
          borderRadius: "1.25rem",
          padding: "2rem 1.75rem",
          maxWidth: 340,
          width: "88vw",
          textAlign: "center",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🌐</div>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--kc-black)",
            marginBottom: "0.25rem",
          }}
        >
          Choose your language
        </h2>
        <p style={{ color: "var(--kc-muted)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
          Elige tu idioma / Choose your language
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, label]) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="kc-btn kc-btn-outline"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "0.9375rem",
                textTransform: "none",
                letterSpacing: "0",
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes kc-modal-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes kc-modal-card {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .kc-modal-overlay { animation: kc-modal-in 0.3s ease-out; }
        .kc-modal-card { animation: kc-modal-card 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .kc-modal-overlay, .kc-modal-card { animation: none; }
        }
      `}</style>
    </div>
  );
}
