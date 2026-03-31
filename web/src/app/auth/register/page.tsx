"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "", phone: "" });
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await register(form);
      router.push(user.is_admin ? "/admin" : "/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        const firstError = err.errors ? Object.values(err.errors)[0]?.[0] : null;
        setError(firstError ?? err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4" style={{ background: "transparent" }}>
      <div className="kc-card w-full max-w-md px-5 sm:px-8 py-8 sm:py-10">
        <Link href="/" className="text-sm block mb-6" style={{ color: "var(--kc-muted)" }}>
          ← Back
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kai's Coffee" className="mx-auto mb-6" style={{ width: "min(200px, 60vw)", height: "auto" }} />

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Create account
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--kc-muted)" }}>
          Start earning reward points today.
        </p>

        {error && (
          <div className="mb-4 py-2.5 px-4 rounded-lg text-xs" style={{ background: "#fee2e2", color: "var(--kc-error)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="kc-label" htmlFor="name">Full name</label>
            <input id="name" type="text" value={form.name} onChange={set("name")}
              className="kc-input" placeholder="Emma Hartwell" autoComplete="name" required />
          </div>
          <div>
            <label className="kc-label" htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={set("email")}
              className="kc-input" placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div>
            <label className="kc-label" htmlFor="phone">Phone <span style={{ color: "var(--kc-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input id="phone" type="tel" value={form.phone} onChange={set("phone")}
              className="kc-input" placeholder="(555) 000-0000" autoComplete="tel" />
          </div>
          <div>
            <label className="kc-label" htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={set("password")}
              className="kc-input" placeholder="Min. 8 characters" autoComplete="new-password" required minLength={8} />
          </div>
          <div>
            <label className="kc-label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" value={form.password_confirmation} onChange={set("password_confirmation")}
              className="kc-input" placeholder="••••••••" autoComplete="new-password" required />
          </div>
          <button type="submit" disabled={loading} className="kc-btn mt-2">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--kc-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--kc-blue-deep)", fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
