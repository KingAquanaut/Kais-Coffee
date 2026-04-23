"use client";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import Button, { LinkButton } from "@/components/admin/Button";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { SkeletonRow } from "@/components/admin/LoadingState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";
import { IconPlus, IconReceipt, IconChevronLeft, IconChevronRight } from "@/components/admin/Icon";
import { admin as adminApi, type Purchase, type Paginated } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { PURCHASES_ENABLED } from "@/lib/features";

export default function AdminPurchasesPage() {
  if (!PURCHASES_ENABLED) redirect("/admin");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta,      setMeta]      = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [voidId,    setVoidId]    = useState<number | null>(null);
  const [voiding,   setVoiding]   = useState(false);
  const [toast,     setToast]     = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const load = (p: number) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminApi.purchases.list(token, p)
      .then((data: Paginated<Purchase>) => {
        setPurchases(data.data);
        setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      })
      .catch(() => setToast({ kind: "error", message: "Could not load purchases." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleVoid = async () => {
    if (!voidId) return;
    const token = getToken();
    if (!token) return;
    setVoiding(true);
    try {
      await adminApi.purchases.void(token, voidId);
      setToast({ kind: "success", message: "Purchase voided, points reversed." });
      setVoidId(null);
      load(page);
    } catch (err) {
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Could not void purchase" });
    } finally {
      setVoiding(false);
    }
  };

  const statusTone = (s: string): "success" | "danger" | "neutral" =>
    s === "completed" ? "success" : s === "voided" ? "danger" : "neutral";

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Purchases"
        title="Purchase History"
        description={meta ? `${meta.total} total purchases` : undefined}
        actions={
          <LinkButton href="/admin/purchases/record" variant="primary" leftIcon={<IconPlus size={16} />}>
            Record New
          </LinkButton>
        }
      />

      <Card padding="none">
        <div
          className="hidden md:grid items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1.2fr",
            background: "var(--admin-surface-alt)",
            borderBottom: "1px solid var(--admin-border)",
            color: "var(--admin-ink-muted)",
          }}
        >
          <span>Customer</span>
          <span>Date</span>
          <span>Total</span>
          <span>Points</span>
          <span className="text-right">Status</span>
        </div>

        {loading ? (
          <>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</>
        ) : purchases.length === 0 ? (
          <EmptyState
            icon={<IconReceipt />}
            title="No purchases yet"
            description="Record a purchase to see it listed here."
            action={
              <LinkButton href="/admin/purchases/record" variant="primary" leftIcon={<IconPlus size={16} />}>
                Record purchase
              </LinkButton>
            }
          />
        ) : (
          purchases.map((p, i) => {
            const date = new Date(p.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div
                key={p.id}
                className="md:grid md:gap-3 md:items-center px-4 py-3"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1.2fr",
                  borderBottom: i < purchases.length - 1 ? "1px solid var(--admin-border)" : undefined,
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-ink)" }}>
                    {p.user?.name ?? "—"}
                  </p>
                  <p className="md:hidden text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>{date}</p>
                </div>
                <span className="hidden md:inline text-sm" style={{ color: "var(--admin-ink-muted)" }}>
                  {date}
                </span>
                <span className="hidden md:inline text-sm font-bold tabular-nums" style={{ color: "var(--admin-ink)" }}>
                  ${parseFloat(p.total).toFixed(2)}
                </span>
                <span className="hidden md:inline text-sm font-semibold tabular-nums" style={{ color: "var(--admin-gold)" }}>
                  +{p.points_earned}
                </span>
                <div className="flex items-center gap-2 md:justify-end mt-2 md:mt-0">
                  <StatusBadge tone={statusTone(p.status)} size="sm" dot>{p.status}</StatusBadge>
                  {p.status === "completed" && (
                    <Button
                      variant="danger" size="sm"
                      onClick={() => setVoidId(p.id)}
                    >
                      Void
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3"
               style={{ borderTop: "1px solid var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<IconChevronLeft size={14} />}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={meta.current_page === 1}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" rightIcon={<IconChevronRight size={14} />}
                      onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                      disabled={meta.current_page === meta.last_page}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={voidId !== null}
        onCancel={() => !voiding && setVoidId(null)}
        onConfirm={handleVoid}
        title="Void this purchase?"
        description="Points earned will be reversed from the customer's balance. This cannot be undone."
        confirmLabel={voiding ? "Voiding…" : "Void purchase"}
        tone="danger"
        loading={voiding}
      />

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </AdminLayout>
  );
}
