"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/contexts/LangContext";

/**
 * RewardCelebration — premium confetti + message overlay when the customer
 * completes their stamp card.
 *
 * Triggers ONLY on the transition to a full card (not on every page load at 8).
 * Uses localStorage to track which reward milestones have been acknowledged.
 */

const STORAGE_KEY = "kc_reward_celebrated";

// ── Confetti particle ────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; r: number; d: number; color: string;
  tilt: number; tiltAngle: number; tiltAngleInc: number;
  opacity: number; speed: number;
}

const COLORS = [
  "#b8962e", "#d4af37", "#f0dcaa", // golds
  "#3a7ca5", "#5ba3c9",            // blues
  "#2d7a4e",                       // green
  "#faf7f2",                       // cream
];

function createParticle(w: number): Particle {
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * 200,
    r: 3 + Math.random() * 5,
    d: Math.random() * 80,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    tilt: Math.floor(Math.random() * 10) - 10,
    tiltAngle: 0,
    tiltAngleInc: Math.random() * 0.07 + 0.05,
    opacity: 0.8 + Math.random() * 0.2,
    speed: 1 + Math.random() * 2,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  /** Current points balance */
  points: number;
  /** Threshold to trigger (e.g. 8) */
  threshold: number;
  /** Lifetime points — used to build a unique milestone key */
  lifetimePoints: number;
}

export default function RewardCelebration({ points, threshold, lifetimePoints }: Props) {
  const { strings } = useLang();
  const [show, setShow]       = useState(false);
  const canvasRef              = useRef<HTMLCanvasElement>(null);
  const animRef                = useRef<number>(0);
  const particlesRef           = useRef<Particle[]>([]);

  // Determine if this specific milestone has already been celebrated
  const milestoneKey = `${threshold}-${lifetimePoints}`;

  useEffect(() => {
    if (points < threshold) return;

    // Check if we already celebrated this milestone
    try {
      const celebrated = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
      if (celebrated.includes(milestoneKey)) return;
    } catch { /* empty */ }

    setShow(true);
  }, [points, threshold, milestoneKey]);

  // Canvas confetti animation
  const startConfetti = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width  = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const count = Math.min(120, Math.floor(w * 0.15));

    particlesRef.current = Array.from({ length: count }, () => createParticle(w));

    let frame = 0;
    const maxFrames = 240; // ~4 seconds at 60fps

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      const fadeOut = frame > maxFrames * 0.7 ? 1 - (frame - maxFrames * 0.7) / (maxFrames * 0.3) : 1;

      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.globalAlpha = p.opacity * Math.max(0, fadeOut);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x + p.tilt, p.y);
        ctx.rotate(p.tiltAngle);
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();

        p.y += p.speed;
        p.tiltAngle += p.tiltAngleInc;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        p.x += Math.sin(p.d) * 0.5;
      }

      if (frame < maxFrames) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (!show || !canvasRef.current) return;
    startConfetti(canvasRef.current);
    return () => cancelAnimationFrame(animRef.current);
  }, [show, startConfetti]);

  const handleDismiss = () => {
    setShow(false);
    cancelAnimationFrame(animRef.current);

    // Mark this milestone as celebrated
    try {
      const celebrated = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
      if (!celebrated.includes(milestoneKey)) {
        celebrated.push(milestoneKey);
        // Keep only last 20 milestones to avoid localStorage bloat
        if (celebrated.length > 20) celebrated.splice(0, celebrated.length - 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(celebrated));
      }
    } catch { /* empty */ }
  };

  if (!show) return null;

  return (
    <div
      className="kc-celebrate-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleDismiss}
    >
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* Celebration card */}
      <div
        className="kc-celebrate-card"
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", zIndex: 1,
          background: "var(--kc-cream)",
          border: "2px solid var(--kc-gold)",
          borderRadius: "1.25rem",
          padding: "2.5rem 2rem",
          maxWidth: 380,
          width: "90vw",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px var(--kc-gold-lt)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem", lineHeight: 1 }}>
          ☕
        </div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--kc-black)",
            marginBottom: "0.5rem",
          }}
        >
          {strings.reward.congratulations}
        </h2>
        <p style={{ color: "var(--kc-muted)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
          {strings.reward.earnedFree}
        </p>

        <button
          onClick={handleDismiss}
          className="kc-btn kc-btn-gold mt-5"
          style={{ minWidth: 160 }}
        >
          {strings.reward.awesome}
        </button>
      </div>

      <style>{`
        @keyframes kc-celebrate-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes kc-celebrate-card {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .kc-celebrate-overlay { animation: kc-celebrate-in 0.4s ease-out; }
        .kc-celebrate-card { animation: kc-celebrate-card 0.5s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .kc-celebrate-overlay, .kc-celebrate-card { animation: none; }
        }
      `}</style>
    </div>
  );
}
