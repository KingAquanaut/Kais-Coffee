"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, type User, type RewardAccount } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type UserWithRewards = User & { reward_account?: RewardAccount };

export default function AdminCustomersPage() {
  const [users,   setUsers]   = useState<UserWithRewards[]>([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [meta,    setMeta]    = useState<{ current_page: number; last_page: number } | null>(null);

  const load = useCallback((q: string, p: number) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminApi.users.list(token, q, p)
      .then(data => {
        setUsers(data.data);
        setMeta({ current_page: data.current_page, last_page: data.last_page });
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // prevSearchRef is updated inside the effect (allowed); we use it to distinguish
  // "search changed" (debounce) from "page changed" (immediate) in a single effect.
  const prevSearchRef = useRef("");

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== search;
    prevSearchRef.current = search;
    // Both paths go through setTimeout so setState is never called synchronously
    // in the effect body. Search changes debounce 350 ms; page changes are instant.
    const t = setTimeout(() => load(search, page), searchChanged ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, page, load]);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>Customers</h1>

      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name or email…"
        className="kc-input mb-6"
        style={{ maxWidth: "24rem" }}
      />

      {loading ? <LoadingSpinner /> : (
        <div className="kc-card overflow-hidden">
          <div
            className="grid grid-cols-4 px-4 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: "var(--kc-cream-dark)", borderBottom: "1.5px solid var(--kc-border)" }}
          >
            <span>Name</span><span>Email</span><span>Points</span><span>Lifetime</span>
          </div>

          {users.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--kc-muted)" }}>No customers found.</p>
          ) : (
            users.map((u, i) => (
              <Link
                key={u.id}
                href={`/admin/customers/${u.id}`}
                className="grid grid-cols-4 items-center px-4 py-3 text-sm"
                style={{
                  borderBottom: i < users.length - 1 ? "1px solid var(--kc-cream-dark)" : undefined,
                  textDecoration: "none", color: "inherit", cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--kc-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <div className="flex items-center gap-2">
                  <div className="kc-img-placeholder" style={{ width: 32, height: 32, fontSize: "0.75rem", flexShrink: 0 }}>
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-semibold truncate">{u.name}</span>
                </div>
                <span style={{ color: "var(--kc-muted)" }} className="truncate">{u.email}</span>
                <span style={{ color: "var(--kc-gold)", fontWeight: 700 }}>{u.reward_account?.points_balance ?? 0}</span>
                <span style={{ color: "var(--kc-muted)" }}>{u.reward_account?.lifetime_points ?? 0}</span>
              </Link>
            ))
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
