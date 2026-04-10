"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, type AdminStats } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { PURCHASES_ENABLED } from "@/lib/features";

export default function AdminDashboardPage() {
  const [data,    setData]    = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminApi.dashboard(token)
      .then(setData)
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Dashboard</h1>
        {PURCHASES_ENABLED && (
          <Link href="/admin/purchases/record" className="kc-btn">Record Purchase</Link>
        )}
      </div>

      {error && (
        <div className="mb-6 py-3 px-4 rounded-xl text-sm" style={{ background: "#fee2e2", color: "var(--kc-error)" }}>
          {error}
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Stats grid */}
          <div className={`grid gap-4 mb-8 ${PURCHASES_ENABLED ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
            {[
              { label: "Total Customers", value: data?.stats.total_users ?? "—" },
              ...(PURCHASES_ENABLED ? [
                { label: "Purchases",       value: data?.stats.total_purchases ?? "—" },
                { label: "Revenue (month)", value: data?.stats.month_revenue ? `$${data.stats.month_revenue}` : "—" },
              ] : []),
              { label: "Active Items",    value: data?.stats.active_items ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="kc-card p-5 text-center">
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--kc-muted)" }}>{label}</p>
                <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Top items (purchase-dependent) */}
          {PURCHASES_ENABLED && (data?.top_items.length ?? 0) > 0 && (
            <div className="kc-card mb-6">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>Top Items This Month</h2>
              </div>
              {data!.top_items.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between px-5 py-3 text-sm"
                     style={{ borderBottom: i < data!.top_items.length - 1 ? "1px solid var(--kc-cream-dark)" : undefined }}>
                  <div className="flex items-center gap-3">
                    <span className="kc-badge kc-badge-blue">{i + 1}</span>
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <span style={{ color: "var(--kc-muted)" }}>{item.qty_sold} sold</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent purchases (purchase-dependent) */}
          {PURCHASES_ENABLED && <div className="kc-card">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>Recent Purchases</h2>
              <Link href="/admin/purchases" className="text-sm" style={{ color: "var(--kc-blue-deep)" }}>View all →</Link>
            </div>

            {(data?.recent_purchases.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--kc-muted)" }}>No purchases yet.</p>
            ) : (
              data?.recent_purchases.map((p, i) => {
                const date = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm"
                       style={{ borderBottom: i < (data?.recent_purchases.length ?? 0) - 1 ? "1px solid var(--kc-cream-dark)" : undefined }}>
                    <div>
                      <p className="font-semibold">{p.user?.name ?? "—"}</p>
                      <p className="text-xs" style={{ color: "var(--kc-muted)" }}>{date} · {p.items?.length ?? 0} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${parseFloat(p.total).toFixed(2)}</p>
                      <p className="text-xs" style={{ color: "var(--kc-gold)" }}>+{p.points_earned} pts</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>}
        </>
      )}
    </AdminLayout>
  );
}
