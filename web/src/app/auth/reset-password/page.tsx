"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, ApiError } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="kc-card w-full max-w-md px-5 sm:px-8 py-8 sm:py-10 text-center">
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Invalid Reset Link
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--kc-muted)" }}>
          This password reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password" className="kc-btn inline-flex">
          Request a New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await auth.resetPassword({ token, email, password, password_confirmation: passwordConfirmation });
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        const firstError = err.errors ? Object.values(err.errors)[0]?.[0] : null;
        setError(firstError ?? err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kc-card w-full max-w-md px-5 sm:px-8 py-8 sm:py-10">
      <Link href="/auth/login" className="text-sm block mb-6" style={{ color: "var(--kc-muted)" }}>
        ← Back to Sign In
      </Link>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Kai's Coffee" className="mx-auto mb-6" style={{ width: "min(200px, 60vw)", height: "auto" }} />

      <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Set new password
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>
        Choose a new password for your account.
      </p>

      {success ? (
        <div className="py-4 px-5 rounded-xl text-sm" style={{ background: "#d1fae5", color: "var(--kc-success)" }}>
          <p className="font-bold mb-1">Password reset!</p>
          <p style={{ lineHeight: 1.6 }}>
            Your password has been updated. Redirecting you to sign in…
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
            <div>
              <label className="kc-label" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="kc-input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="kc-label" htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
                className="kc-input"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="kc-btn mt-1">
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4" style={{ background: "transparent" }}>
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
