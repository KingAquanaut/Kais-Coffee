"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PurchaseRow from "@/components/ui/PurchaseRow";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { account as accountApi, type Purchase, type Paginated } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="kc-card p-10 text-center">
      <p className="text-4xl mb-4">☕</p>
      <p className="font-bold text-lg mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        No orders yet
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--kc-muted)" }}>
        Your purchase history will appear here after your first order.
      </p>
      <Link href="/menu" className="kc-btn">
        Browse the Menu
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  } | null>(null);
  // `loadedPage` tracks which page we have data for; derive `loading` from it.
  const [loadedPage, setLoadedPage] = useState(0);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);

  const loading = loadedPage !== page;

  useEffect(() => {
    const token = getToken();
    if (!token) return; // AppLayout auth guard handles the redirect
    accountApi.purchases(token, page)
      .then((data: Paginated<Purchase>) => {
        setPurchases(data.data);
        setMeta({
          current_page: data.current_page,
          last_page:    data.last_page,
          total:        data.total,
        });
        setError(null);
        setLoadedPage(page);
      })
      .catch(() => {
        setError("Could not load your purchases. Please try again.");
        setLoadedPage(page);
      });
  }, [page]);

  return (
    <AppLayout>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Purchase History
        </h1>
        {meta && meta.total > 0 && (
          <span className="kc-badge kc-badge-blue">
            {meta.total} order{meta.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--kc-muted)" }}>
        All your past orders and stamps earned.
      </p>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="mb-5 py-3 px-4 rounded-xl text-sm"
          style={{ background: "#fee2e2", color: "var(--kc-error)" }}
        >
          {error}
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner text="Loading your orders…" />
      ) : (
        <>
          {purchases.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {purchases.map(p => <PurchaseRow key={p.id} purchase={p} />)}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={meta.current_page === 1}
                    className="kc-btn kc-btn-outline kc-btn-sm"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm" style={{ color: "var(--kc-muted)" }}>
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={meta.current_page === meta.last_page}
                    className="kc-btn kc-btn-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

    </AppLayout>
  );
}
