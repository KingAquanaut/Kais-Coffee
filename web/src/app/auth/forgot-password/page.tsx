"use client";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/api";
import { ApiError } from "@/lib/api";

type Status = "idle" | "loading" | "success";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      await auth.forgotPassword({ email });
      setStatus("success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4" style={{ background: "transparent" }}>
      <div className="kc-card w-full max-w-md px-5 sm:px-8 py-8 sm:py-10">
        <Link href="/auth/login" className="text-sm block mb-6" style={{ color: "var(--kc-muted)" }}>
          ← Back to Sign In
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kai's Coffee" className="mx-auto mb-6" style={{ width: "min(200px, 60vw)", height: "auto" }} />

        {status === "success" ? (
          <div className="flex flex-col items-center text-center kc-fade-in">
            {/* Animated checkmark */}
            <div className="kc-check-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" className="kc-check-stroke" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mt-5 mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--kc-text)" }}>
              Check your inbox
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--kc-muted)", lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: "var(--kc-text)" }}>{email}</strong>,
              we&apos;ve sent a reset link. It may take a minute to arrive.
            </p>

            <Link href="/auth/login" className="kc-btn w-full" style={{ maxWidth: 260 }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className={status === "loading" ? "opacity-70 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Reset password
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div
                className="mb-5 py-3 px-4 rounded-xl text-sm cursor-pointer"
                style={{ background: "#fee2e2", color: "var(--kc-error)" }}
                onClick={() => setError(null)}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="kc-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="kc-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" disabled={status === "loading"} className="kc-btn mt-1">
                {status === "loading" ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </div>
        )}

        {status !== "success" && (
          <p className="mt-6 text-center text-sm" style={{ color: "var(--kc-muted)" }}>
            Remember your password?{" "}
            <Link href="/auth/login" style={{ color: "var(--kc-blue-deep)", fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        )}
      </div>

      <style jsx>{`
        .kc-fade-in {
          animation: kcFadeIn 0.5s ease-out both;
        }
        @keyframes kcFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .kc-check-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--kc-success, #22c55e);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: kcPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes kcPop {
          0%   { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }

        .kc-check-stroke {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: kcDraw 0.4s ease-out 0.3s forwards;
        }
        @keyframes kcDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
