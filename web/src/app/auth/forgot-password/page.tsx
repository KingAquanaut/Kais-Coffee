"use client";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Reset password
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <div className="py-4 px-5 rounded-xl text-sm" style={{ background: "#d1fae5", color: "var(--kc-success)" }}>
            <p className="font-bold mb-1">Check your inbox</p>
            <p style={{ lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
              It may take a minute to arrive.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 py-3 px-4 rounded-xl text-sm"
                   style={{ background: "#fee2e2", color: "var(--kc-error)" }}>
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
              <button type="submit" disabled={loading} className="kc-btn mt-1">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: "var(--kc-muted)" }}>
          Remember your password?{" "}
          <Link href="/auth/login" style={{ color: "var(--kc-blue-deep)", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
