"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

// ── Gear icon ─────────────────────────────────────────────────────────────────
function GearIcon({ color }: { color: string }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Checkmark icon ────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6l3 3 5-5"
        stroke="var(--kc-blue-deep)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Settings menu ─────────────────────────────────────────────────────────────
interface Props {
  /** Pass true when rendered over a hero image (white-tinted icon + ghost border) */
  ghost?: boolean;
}

export default function SettingsMenu({ ghost = false }: Props) {
  const { lang, setLang, strings } = useLang();
  const [open, setOpen]            = useState(false);
  const [hover, setHover]          = useState(false);
  const ref                        = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const iconColor = ghost
    ? "rgba(255,255,255,0.80)"
    : hover || open ? "var(--kc-black)" : "var(--kc-muted)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        id="kc-settings-gear"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={strings.settings.label}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: ghost
            ? open || hover ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"
            : open || hover ? "rgba(26,26,26,0.06)" : "transparent",
          border: ghost
            ? `1.5px solid ${open ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.22)"}`
            : `1.5px solid ${open ? "var(--kc-border)" : "transparent"}`,
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <GearIcon color={iconColor} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 176,
            background: "var(--kc-cream)",
            border: "1.5px solid var(--kc-border)",
            borderRadius: "0.875rem",
            boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Language section */}
          <div style={{ padding: "0.75rem 0.875rem 0.625rem" }}>
            <p style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--kc-muted)",
              marginBottom: "0.5rem",
              fontFamily: "var(--font-body)",
            }}>
              {strings.settings.language}
            </p>

            {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, label]) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  role="menuitem"
                  onClick={() => { setLang(code); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.45rem 0.625rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: active ? "var(--kc-bg)" : "transparent",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--kc-black)" : "var(--kc-muted)",
                    textAlign: "left",
                    marginBottom: "0.2rem",
                    fontFamily: "var(--font-body)",
                    transition: "background 0.1s",
                  }}
                >
                  {label}
                  {active && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
