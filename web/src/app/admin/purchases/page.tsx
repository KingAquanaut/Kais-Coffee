"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, type Purchase, type Paginated } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { PURCHASES_ENABLED } from "@/lib/features";

export default function AdminPurchasesPage() {
  if (!PURCHASES_ENABLED) redirect("/admin");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta,      setMeta]      = useState<{ current_page: number; last_page: number } | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [voidingId, setVoidingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const load = (p: number) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    adminApi.purchases.list(token, p)
      .then((data: Paginated<Purchase>) => {
        setPurchases(data.data);
        setMeta({ current_page: data.current_page, last_page: data.last_page });
      })
      .catch(() => setError("Could not load purchases."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const [msg, setMsg] = useState<string | null>(null);

  const handleVoid = async (id: number) => {
    const token = getToken();
    if (!token || !confirm("Void this purchase? Points will be reversed.")) return;
    setVoidingId(id);
    setError(null);
    try {
      await adminApi.purchases.void(token, id);
      setMsg("Purchase voided and points reversed.");
      load(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not void purchase.");
    } finally {
      setVoidingId(null);
    }
  };

  const statusClass = (s: string) =>
    s === "completed" ? "kc-badge-success" : s === "voided" ? "kc-badge-error" : "kc-badge-muted";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Purchase History</h1>
        <Link href="/admin/purchases/record" className="kc-btn">Record New</Link>
      </div>

      {msg && (
        <div
          className="mb-5 py-3 px-4 rounded-xl text-sm cursor-pointer"
          style={{ background: "#d1fae5", color: "var(--kc-success)" }}
          onClick={() => setMsg(null)}
        >
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-5 py-3 px-4 rounded-xl text-sm cursor-pointer" style={{ background: "#fee2e2", color: "var(--kc-error)" }} onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="kc-card overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-5 px-4 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: "var(--kc-cream-dark)", borderBottom: "1.5px solid var(--kc-border)" }}
          >
            <span>Customer</span><span>Date</span><span>Total</span><span>Points</span><span>Status</span>
          </div>

          {purchases.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--kc-muted)" }}>No purchases found.</p>
          ) : (
            purchases.map((p, i) => {
              const date = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-5 items-center px-4 py-3 text-sm"
                  style={{ borderBottom: i < purchases.length - 1 ? "1px solid var(--kc-cream-dark)" : undefined }}
                >
                  <span className="font-semibold truncate pr-2">{p.user?.name ?? "—"}</span>
                  <span style={{ color: "var(--kc-muted)" }}>{date}</span>
                  <span className="font-bold">${parseFloat(p.total).toFixed(2)}</span>
                  <span style={{ color: "var(--kc-gold)" }}>+{p.points_earned}</span>
                  <div className="flex items-center gap-2">
                    <span className={`kc-badge ${statusClass(p.status)}`}>{p.status}</span>
                    {p.status === "completed" && (
                      <button
                        onClick={() => handleVoid(p.id)}
                        disabled={voidingId === p.id}
                        className="kc-btn kc-btn-sm kc-btn-danger"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.625rem" }}
                      >
                        {voidingId === p.id ? "…" : "Void"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-4 p-4" style={{ borderTop: "1px solid var(--kc-cream-dark)" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1} className="kc-btn kc-btn-outline kc-btn-sm">Previous</button>
              <span className="self-center text-sm" style={{ color: "var(--kc-muted)" }}>Page {meta.current_page} / {meta.last_page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page} className="kc-btn kc-btn-sm">Next</button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
