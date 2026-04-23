"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";

// ── Lightweight QR analytics ─────────────────────────────────────────────────
// Fires once per page load. Uses navigator.sendBeacon when available so the
// event survives tab-close / navigation. Falls back to fetch for older browsers.
// No heavy SDK — just a POST to our own API.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function trackQr(event: string, meta?: Record<string, string | number | boolean>) {
  const payload = JSON.stringify({ event, ts: Date.now(), ...meta });
  const url = `${BASE}/analytics/qr`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch { /* analytics must never break the page */ }
}

// ── Mini stamp grid (compact, inline) ────────────────────────────────────────
function MiniStamps({ filled, total }: { filled: number; total: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${total}, 1fr)`, gap: "0.3rem", width: total * 22 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isFinal = i === total - 1 && !isFilled;
        return (
          <div
            key={i}
            style={{
              width: "100%", aspectRatio: "1", borderRadius: "50%",
              background: isFilled ? "var(--kc-gold-lt)" : "var(--kc-bg)",
              border: isFilled ? "1.5px solid var(--kc-gold)" : "1.5px dashed var(--kc-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.55rem",
            }}
          >
            {isFilled ? "\u2615" : isFinal ? (
              <span style={{ fontSize: "0.28rem", fontWeight: 900, color: "var(--kc-muted)", fontFamily: "var(--font-heading)" }}>FREE</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ── QR Hero ──────────────────────────────────────────────────────────────────
// Conversion-focused first screen for visitors arriving via QR code scan.
// Adapts to logged-in vs logged-out state.
export default function QrHero() {
  const { strings } = useLang();
  const { user, loading } = useAuth();
  const s = strings.qr;

  const loggedIn = !loading && Boolean(user);
  const firstName = user?.name?.split(" ")[0];

  // Stamp progress for logged-in users
  const THRESHOLD = 8;
  const points = user?.reward_account?.points_balance ?? 0;
  const stampsInCycle = points % THRESHOLD;
  const remaining = THRESHOLD - stampsInCycle;

  // ── Analytics: track QR landing view (once) ────────────────────────────
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackQr("qr_landing_view", { authenticated: loggedIn });
  }, [loggedIn]);

  const trackCta = (cta: string) => trackQr("qr_cta_click", { cta, authenticated: loggedIn });

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "100dvh", overflow: "hidden" }}
    >
      {/* Background — soft brand gradient */}
      <div
        className="kc-hero-bg-motion"
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(160deg, rgba(196,217,236,0.72) 0%, rgba(214,232,245,0.58) 55%, rgba(229,240,248,0.30) 100%)",
        }}
      />

      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "46%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, 85vw)", height: "min(560px, 85vw)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.32) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Bottom fade into page */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
          background: "linear-gradient(to bottom, transparent, var(--kc-bg))",
          pointerEvents: "none", zIndex: 1,
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center"
        style={{ zIndex: 2, gap: "0.85rem", marginTop: "-2vh", maxWidth: 400, width: "100%" }}
      >
        {/* Badge */}
        <p className="kc-badge kc-badge-blue" style={{ fontSize: "0.6875rem" }}>
          {loggedIn && firstName
            ? `\u2615 ${s.welcomeBack}, ${firstName}!`
            : `\u2615 ${s.welcomeBadge}`}
        </p>

        {/* Headline */}
        <h1
          className="font-bold text-4xl sm:text-5xl"
          style={{
            fontFamily: "var(--font-heading)",
            lineHeight: 1.08,
            letterSpacing: "-0.01em",
            maxWidth: "14ch",
          }}
        >
          {s.headline.split("\n").map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h1>

        {/* Tagline */}
        <p
          className="text-sm"
          style={{
            color: "var(--kc-muted)", letterSpacing: "0.08em",
            fontWeight: 600, textTransform: "uppercase",
          }}
        >
          {s.tagline}
        </p>

        {/* ── Value prop card ─────────────────────────────────────────── */}
        <div
          className="kc-card"
          style={{
            padding: "1rem 1.25rem", width: "100%", maxWidth: 320,
            marginTop: "0.5rem",
            display: "flex", alignItems: "center", gap: "1rem",
          }}
        >
          <MiniStamps
            filled={loggedIn ? stampsInCycle : 5}
            total={THRESHOLD}
          />
          <div className="text-left flex-1 min-w-0">
            {loggedIn ? (
              <>
                <p className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)", lineHeight: 1.2 }}>
                  {stampsInCycle} / {THRESHOLD}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
                  {stampsInCycle > 0
                    ? `${s.stampProgress} \u00b7 ${remaining} ${s.moreToGo}`
                    : s.earnFree}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)", lineHeight: 1.2 }}>
                  {s.earnFree}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
                  {s.afterVisits}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── CTAs ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 w-full" style={{ maxWidth: 280, marginTop: "0.5rem" }}>
          {/* Primary: View Menu (always) */}
          <Link
            href="/menu"
            onClick={() => trackCta("view_menu")}
            className="kc-btn kc-btn-gold py-3 text-sm text-center"
            style={{ width: "100%" }}
          >
            {s.viewMenu}
          </Link>

          {loggedIn ? (
            /* Logged in: dashboard */
            <Link
              href="/dashboard"
              onClick={() => trackCta("my_rewards")}
              className="kc-btn kc-btn-outline py-3 text-sm text-center"
              style={{ width: "100%" }}
            >
              {s.myRewards}
            </Link>
          ) : (
            /* Logged out: join + sign in */
            <div className="flex gap-2.5">
              <Link
                href="/auth/register"
                onClick={() => trackCta("join_rewards")}
                className="kc-btn kc-btn-outline py-3 text-sm text-center flex-1"
              >
                {s.joinRewards}
              </Link>
              <Link
                href="/auth/login"
                onClick={() => trackCta("sign_in")}
                className="kc-btn kc-btn-ghost py-3 text-sm text-center flex-1"
                style={{ color: "var(--kc-blue-deep)", fontWeight: 700 }}
              >
                {s.signIn}
              </Link>
            </div>
          )}
        </div>

        {/* Install hint — subtle, non-intrusive */}
        <p className="text-xs mt-2" style={{ color: "var(--kc-muted)", opacity: 0.7 }}>
          {s.installHint}
        </p>
      </div>

      {/* Scroll chevron */}
      <div
        className="absolute"
        style={{ bottom: "2.25rem", left: "50%", transform: "translateX(-50%)", zIndex: 2 }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 8l5 5 5-5"
            stroke="rgba(26,26,26,0.28)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
