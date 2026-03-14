"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState("admin@kaiscoffee.com");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (user?.is_admin) router.replace("/admin");
    else if (user)      router.replace("/dashboard");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4" style={{ background: "transparent" }}>
      <div className="kc-card w-full max-w-sm px-8 py-10">
        <p className="text-xs mb-6 tracking-widest uppercase" style={{ color: "var(--kc-muted)" }}>
          Kai&apos;s Coffee
        </p>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Admin Sign In
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>Access the management dashboard.</p>

        {error && (
          <div className="mb-4 py-2.5 px-4 rounded-lg text-xs" style={{ background: "#fee2e2", color: "var(--kc-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="kc-label" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="kc-input" autoComplete="email" required />
          </div>
          <div>
            <label className="kc-label" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="kc-input" placeholder="••••••••" autoComplete="current-password" required />
          </div>
          <button type="submit" disabled={loading} className="kc-btn mt-1">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-xs text-center" style={{ color: "var(--kc-muted)" }}>
          Default: admin@kaiscoffee.com / password
        </p>

        <div className="mt-5 text-center">
          <Link
            href="/"
            style={{
              fontSize: "0.8125rem",
              color: "var(--kc-blue-deep)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Return to Kai&apos;s Coffee
          </Link>
        </div>
      </div>
    </div>
  );
}
