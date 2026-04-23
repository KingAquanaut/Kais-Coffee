"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/admin/Card";
import Button from "@/components/admin/Button";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import LoadingState from "@/components/admin/LoadingState";
import StampProgress from "@/components/admin/StampProgress";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";
import { IconChevronLeft, IconEdit, IconGift, IconReceipt } from "@/components/admin/Icon";
import {
  admin as adminApi,
  type User, type Purchase, type RewardSummary, type ApiError,
} from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { PURCHASES_ENABLED } from "@/lib/features";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function langLabel(code: string | null): { tone: "info" | "neutral" | "gold"; text: string } {
  if (!code)         return { tone: "neutral", text: "Unset" };
  if (code === "en") return { tone: "info",    text: "English" };
  if (code === "es") return { tone: "gold",    text: "Español" };
  return { tone: "neutral", text: code.toUpperCase() };
}

export default function AdminCustomerDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const userId  = Number(params.id);

  const [user,    setUser]    = useState<User | null>(null);
  const [reward,  setReward]  = useState<RewardSummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const [editOpen,     setEditOpen]     = useState(false);
  const [adjustOpen,   setAdjustOpen]   = useState(false);
  const [redeemOpen,   setRedeemOpen]   = useState(false);
  const [redeeming,    setRedeeming]    = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token || isNaN(userId)) return;
    setLoading(true);
    try {
      const data = await adminApi.users.get(token, userId);
      setUser(data.user);
      setReward(data.reward_summary);
      setPurchases(data.user.purchases ?? []);
    } catch {
      setToast({ kind: "error", message: "Failed to load customer" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRedeem = async () => {
    const token = getToken();
    if (!token || !user) return;
    setRedeeming(true);
    try {
      const res = await adminApi.users.redeemReward(token, user.id);
      setReward(prev => prev ? {
        ...prev,
        points_balance: res.points_balance,
        lifetime_points: res.lifetime_points,
        can_redeem: res.can_redeem,
      } : prev);
      setRedeemOpen(false);
      setToast({ kind: "success", message: "Free coffee redeemed!" });
    } catch (err) {
      setToast({ kind: "error", message: (err as ApiError).message || "Redemption failed" });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return <AdminLayout><LoadingState text="Loading customer…" /></AdminLayout>;
  }

  if (!user || !reward) {
    return (
      <AdminLayout>
        <EmptyState
          title="Customer not found"
          description="This customer may have been deleted or doesn't exist."
          action={<Button variant="secondary" onClick={() => router.push("/admin/customers")}>
            Back to Customers
          </Button>}
        />
      </AdminLayout>
    );
  }

  const lang = langLabel(user.language_preference);

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--admin-ink-muted)", textDecoration: "none" }}
        >
          <IconChevronLeft size={16} />
          All customers
        </Link>
      </div>

      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Button variant="secondary" leftIcon={<IconEdit size={16} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Main column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Profile summary */}
          <Card>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-ink-muted)" }}>Phone</dt>
                <dd className="text-sm font-medium mt-0.5">{user.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-ink-muted)" }}>Language</dt>
                <dd className="mt-1"><StatusBadge tone={lang.tone} size="sm">{lang.text}</StatusBadge></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-ink-muted)" }}>Lifetime stamps</dt>
                <dd className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: "var(--admin-accent-deep)" }}>
                  {reward.lifetime_points}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-ink-muted)" }}>Customer since</dt>
                <dd className="text-sm mt-0.5">{user.created_at ? fmtDate(user.created_at) : "—"}</dd>
              </div>
            </dl>
          </Card>

          {/* Recent purchases */}
          {PURCHASES_ENABLED && (
            <Card padding="none">
              <CardHeader><CardTitle>Recent Purchases</CardTitle></CardHeader>
              {purchases.length === 0 ? (
                <EmptyState
                  icon={<IconReceipt />}
                  title="No purchases yet"
                  description="This customer hasn't made a purchase."
                />
              ) : (
                <ul>
                  {purchases.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < purchases.length - 1 ? "1px solid var(--admin-border)" : undefined }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-ink)" }}>
                          ${parseFloat(p.total).toFixed(2)}
                          {p.points_earned > 0 && (
                            <span className="ml-2 text-xs font-medium" style={{ color: "var(--admin-success)" }}>
                              +{p.points_earned} stamp
                            </span>
                          )}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                          {fmtDate(p.created_at)} · {p.items?.length ?? 0} item{(p.items?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <StatusBadge
                        tone={p.status === "completed" ? "success" : p.status === "voided" ? "danger" : "neutral"}
                        size="sm"
                      >
                        {p.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* Rewards sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider"
                 style={{ color: "var(--admin-ink-muted)" }}>Stamp Card</p>
              {reward.can_redeem && <StatusBadge tone="gold" dot size="sm">Ready</StatusBadge>}
            </div>
            <p
              className="text-5xl font-bold tabular-nums mt-2"
              style={{ color: "var(--admin-ink)", fontFamily: "var(--font-heading)" }}
            >
              {reward.points_balance}
              <span className="text-2xl font-normal ml-1" style={{ color: "var(--admin-ink-faint)" }}>
                / {reward.threshold}
              </span>
            </p>
            <div className="mt-4">
              <StampProgress value={reward.points_balance} threshold={reward.threshold} size="lg" showLabel />
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="gold"
                fullWidth
                disabled={!reward.can_redeem}
                leftIcon={<IconGift size={16} />}
                onClick={() => setRedeemOpen(true)}
              >
                {reward.can_redeem ? "Redeem Free Coffee" : `${reward.threshold - reward.points_balance} more stamps needed`}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setAdjustOpen(true)}
              >
                Adjust Stamps
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit drawer */}
      <EditDrawer
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSaved={updated => {
          setUser(updated);
          setEditOpen(false);
          setToast({ kind: "success", message: "Customer updated" });
        }}
        onError={msg => setToast({ kind: "error", message: msg })}
      />

      {/* Adjust drawer */}
      <AdjustDrawer
        open={adjustOpen}
        userId={user.id}
        currentBalance={reward.points_balance}
        threshold={reward.threshold}
        onClose={() => setAdjustOpen(false)}
        onUpdated={(balance, lifetime, canRedeem) => {
          setReward(prev => prev ? { ...prev, points_balance: balance, lifetime_points: lifetime, can_redeem: canRedeem } : prev);
          setAdjustOpen(false);
          setToast({ kind: "success", message: "Stamps adjusted" });
        }}
        onError={msg => setToast({ kind: "error", message: msg })}
      />

      {/* Redeem confirm */}
      <ConfirmDialog
        open={redeemOpen}
        onCancel={() => !redeeming && setRedeemOpen(false)}
        onConfirm={handleRedeem}
        title="Redeem free coffee?"
        description={
          <>This will deduct <strong>{reward.threshold} stamps</strong> from {user.name}&apos;s balance
            (current: {reward.points_balance}).</>
        }
        confirmLabel={redeeming ? "Redeeming…" : "Redeem"}
        tone="gold"
        loading={redeeming}
      />

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </AdminLayout>
  );
}

/* ─── Drawers ─────────────────────────────────────────────────────────── */

function EditDrawer({
  open, user, onClose, onSaved, onError,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: (u: User) => void;
  onError: (msg: string) => void;
}) {
  const [name,  setName]  = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [langPref, setLangPref] = useState(user.language_preference ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Reset when opened for a different user
  useEffect(() => {
    if (open) {
      setName(user.name); setEmail(user.email);
      setPhone(user.phone ?? ""); setLangPref(user.language_preference ?? "");
      setErrors({});
    }
  }, [open, user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = getToken();
    if (!token) return;

    const errs: Record<string, string[]> = {};
    if (!name.trim()) errs.name = ["Name is required."];
    if (!email.trim()) errs.email = ["Email is required."];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = ["Invalid email format."];
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true); setErrors({});
    try {
      const updated = await adminApi.users.update(token, user.id, {
        name: name.trim(), email: email.trim(),
        phone: phone.trim() || null,
        language_preference: langPref || null,
      });
      onSaved(updated);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
      onError(apiErr.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit customer"
      description={user.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={saving}>Save changes</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="admin-label">Name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} />
          {errors.name && <p className="text-xs mt-1" style={{ color: "var(--admin-danger)" }}>{errors.name[0]}</p>}
        </div>
        <div>
          <label className="admin-label">Email</label>
          <input className="admin-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          {errors.email && <p className="text-xs mt-1" style={{ color: "var(--admin-danger)" }}>{errors.email[0]}</p>}
        </div>
        <div>
          <label className="admin-label">Phone</label>
          <input className="admin-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="admin-label">Language preference</label>
          <select className="admin-select" value={langPref} onChange={e => setLangPref(e.target.value)}>
            <option value="">Not set</option>
            {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
      </form>
    </FormDrawer>
  );
}

function AdjustDrawer({
  open, userId, currentBalance, threshold, onClose, onUpdated, onError,
}: {
  open: boolean;
  userId: number;
  currentBalance: number;
  threshold: number;
  onClose: () => void;
  onUpdated: (balance: number, lifetime: number, canRedeem: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setAmount(""); setReason(""); } }, [open]);

  const parsed  = parseInt(amount, 10);
  const valid   = !isNaN(parsed) && parsed !== 0 && reason.trim().length > 0;
  const preview = !isNaN(parsed) ? Math.max(0, currentBalance + parsed) : currentBalance;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = getToken();
    if (!token || !valid) return;
    setSaving(true);
    try {
      const res = await adminApi.users.adjustStamps(token, userId, { amount: parsed, reason: reason.trim() });
      onUpdated(res.points_balance, res.lifetime_points, res.can_redeem);
    } catch (err) {
      onError((err as ApiError).message || "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Adjust stamps"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={saving} disabled={!valid}>
            Apply
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--admin-ink-muted)" }}>
              After adjustment
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-ink)" }}>
              {currentBalance} → {preview}
            </span>
          </div>
          <StampProgress value={preview} threshold={threshold} size="md" />
        </div>

        <div>
          <label className="admin-label">Amount</label>
          <input
            className="admin-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. +1 or -2"
            min={-currentBalance}
            max={100}
            autoFocus
          />
          <p className="text-xs mt-1" style={{ color: "var(--admin-ink-muted)" }}>
            Positive to add, negative to remove.
          </p>
        </div>

        <div>
          <label className="admin-label">Reason (required)</label>
          <textarea
            className="admin-textarea"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is this adjustment being made?"
            rows={3}
          />
        </div>
      </form>
    </FormDrawer>
  );
}
