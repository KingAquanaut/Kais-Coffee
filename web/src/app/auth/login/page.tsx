"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated (runs after hydration, no render-phase side-effects)
  useEffect(() => {
    if (!loading && user) {
      router.replace(user.is_admin ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  // Show spinner while the AuthContext is rehydrating from localStorage
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center" style={{ background: "transparent" }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Don't flash the form while the redirect above is executing
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      router.push(loggedInUser.is_admin ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo  = () => { setEmail("demo@kaiscoffee.com");  setPassword("password"); };
  const fillAdmin = () => { setEmail("admin@kaiscoffee.com"); setPassword("password"); };

  return (
    <div className="flex min-h-svh items-center justify-center px-4" style={{ background: "transparent" }}>
      <div className="kc-card w-full max-w-md px-8 py-10">

        <Link href="/" className="text-sm block mb-6" style={{ color: "var(--kc-muted)" }}>
          ← Back
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Kai's Coffee" className="mx-auto mb-6" style={{ width: 200, height: "auto" }} />

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Welcome back
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>
          Sign in to view your rewards.
        </p>

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
            <label className="kc-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="kc-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="kc-btn mt-1">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--kc-muted)" }}>
          No account?{" "}
          <Link href="/auth/register" style={{ color: "var(--kc-blue-deep)", fontWeight: 700 }}>
            Create one
          </Link>
        </p>

        {/* Demo quick-fill */}
        <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--kc-cream-dark)" }}>
          <p className="text-xs text-center mb-3" style={{ color: "var(--kc-muted)" }}>
            Demo credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={fillDemo}  className="kc-btn kc-btn-outline kc-btn-sm">
              Customer
            </button>
            <button type="button" onClick={fillAdmin} className="kc-btn kc-btn-outline kc-btn-sm">
              Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
