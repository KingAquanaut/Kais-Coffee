"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { SkeletonRow } from "@/components/admin/LoadingState";
import StampProgress from "@/components/admin/StampProgress";
import Button from "@/components/admin/Button";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";
import { IconSearch, IconUsers, IconChevronLeft, IconChevronRight, IconGift, IconEdit, IconEye } from "@/components/admin/Icon";
import { admin as adminApi, type User, type RewardAccount, type ApiError } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

type UserWithRewards = User & { reward_account?: RewardAccount };
type LangFilter = "all" | LangCode | "unset";
type RewardFilter = "all" | "ready";

// Reward threshold is returned by dashboard endpoint but not by users list;
// fall back to 8 (matches server default and customer detail page).
const DEFAULT_THRESHOLD = 8;

function langLabel(code: string | null): { tone: "info" | "neutral" | "gold"; text: string } {
  if (!code)         return { tone: "neutral", text: "Unset" };
  if (code === "en") return { tone: "info",    text: "EN" };
  if (code === "es") return { tone: "gold",    text: "ES" };
  return { tone: "neutral", text: code.toUpperCase() };
}

export default function AdminCustomersPage() {
  const [users,   setUsers]   = useState<UserWithRewards[]>([]);
  const [search,  setSearch]  = useState("");
  const [langFilter,   setLangFilter]   = useState<LangFilter>("all");
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>("all");
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [meta,    setMeta]    = useState<{ current_page: number; last_page: number; total: number } | null>(null);

  // Drawer / dialog state
  const [editUser,   setEditUser]   = useState<UserWithRewards | null>(null);
  const [stampUser,  setStampUser]  = useState<UserWithRewards | null>(null);
  const [redeemUser, setRedeemUser] = useState<UserWithRewards | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const threshold = DEFAULT_THRESHOLD;

  const load = useCallback((q: string, p: number) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminApi.users.list(token, q, p)
      .then(data => {
        setUsers(data.data);
        setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const prevSearchRef = useRef("");
  useEffect(() => {
    const searchChanged = prevSearchRef.current !== search;
    prevSearchRef.current = search;
    const t = setTimeout(() => load(search, page), searchChanged ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, page, load]);

  const visibleUsers = users.filter(u => {
    if (langFilter === "unset" && u.language_preference) return false;
    if (langFilter !== "all" && langFilter !== "unset" && u.language_preference !== langFilter) return false;
    if (rewardFilter === "ready" && (u.reward_account?.points_balance ?? 0) < threshold) return false;
    return true;
  });

  const showMsg = (kind: "success" | "error", message: string) => setToast({ kind, message });

  const handleUserUpdated = (updated: User) => {
    setUsers(list => list.map(u => u.id === updated.id ? { ...u, ...updated } : u));
    setEditUser(null);
    showMsg("success", "Customer updated");
  };

  const handleStampUpdated = (userId: number, balance: number, lifetime: number) => {
    setUsers(list => list.map(u => u.id === userId
      ? { ...u, reward_account: { ...(u.reward_account as RewardAccount), points_balance: balance, lifetime_points: lifetime } }
      : u));
  };

  const handleRedeem = async () => {
    if (!redeemUser) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await adminApi.users.redeemReward(token, redeemUser.id);
      handleStampUpdated(redeemUser.id, res.points_balance, res.lifetime_points);
      setRedeemUser(null);
      showMsg("success", `Free coffee redeemed for ${redeemUser.name}`);
    } catch (err) {
      showMsg("error", (err as ApiError).message || "Redemption failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filtersActive = search !== "" || langFilter !== "all" || rewardFilter !== "all";

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Customers"
        title="All Customers"
        description={meta ? `${meta.total} total · ${visibleUsers.length} visible` : "Manage customers, stamps, and rewards"}
      />

      {/* Filters */}
      <Card padding="none" className="mb-5">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-55">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--admin-ink-faint)" }}
            >
              <IconSearch size={16} />
            </span>
            <input
              className="admin-input"
              style={{ paddingLeft: "2.25rem" }}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email…"
            />
          </div>

          <select
            className="admin-select"
            style={{ width: "auto", minWidth: 140 }}
            value={langFilter}
            onChange={e => setLangFilter(e.target.value as LangFilter)}
          >
            <option value="all">All languages</option>
            <option value="unset">No preference</option>
            {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          <select
            className="admin-select"
            style={{ width: "auto", minWidth: 160 }}
            value={rewardFilter}
            onChange={e => setRewardFilter(e.target.value as RewardFilter)}
          >
            <option value="all">All customers</option>
            <option value="ready">Reward ready</option>
          </select>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setLangFilter("all"); setRewardFilter("all"); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {/* Header row — desktop */}
        <div
          className="hidden md:grid items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2fr 2fr 1.2fr 0.8fr 1.5fr 0.6fr",
            background: "var(--admin-surface-alt)",
            borderBottom: "1px solid var(--admin-border)",
            color: "var(--admin-ink-muted)",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Lang</span>
          <span>Stamps</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</>
        ) : visibleUsers.length === 0 ? (
          <EmptyState
            icon={<IconUsers />}
            title={filtersActive ? "No matching customers" : "No customers yet"}
            description={filtersActive
              ? "Try adjusting your search or filters."
              : "Customers will appear here once they sign up."}
            action={filtersActive
              ? <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setLangFilter("all"); setRewardFilter("all"); }}>Clear filters</Button>
              : undefined}
          />
        ) : (
          visibleUsers.map((u, i) => {
            const stamps = u.reward_account?.points_balance ?? 0;
            const ready  = stamps >= threshold;
            const lang   = langLabel(u.language_preference);

            return (
              <div
                key={u.id}
                className="md:grid md:gap-3 md:items-center px-4 py-3 admin-row"
                style={{
                  gridTemplateColumns: "2fr 2fr 1.2fr 0.8fr 1.5fr 0.6fr",
                  borderBottom: i < visibleUsers.length - 1 ? "1px solid var(--admin-border)" : undefined,
                  background: ready ? "rgba(184, 150, 46, 0.05)" : undefined,
                }}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center shrink-0 font-bold text-xs"
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: ready ? "var(--admin-gold-bg)" : "var(--admin-accent-soft)",
                      color: ready ? "var(--admin-gold)" : "var(--admin-accent-deep)",
                    }}
                    aria-hidden
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-ink)" }}>
                      {u.name}
                    </p>
                    <p className="text-xs md:hidden truncate" style={{ color: "var(--admin-ink-muted)" }}>
                      {u.email}
                    </p>
                  </div>
                  {ready && (
                    <span className="ml-auto md:hidden">
                      <StatusBadge tone="gold" size="sm" dot>Ready</StatusBadge>
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="hidden md:block min-w-0 text-sm truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  {u.email}
                </div>

                {/* Phone */}
                <div className="hidden md:block text-sm truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  {u.phone ?? "—"}
                </div>

                {/* Language */}
                <div className="hidden md:flex">
                  <StatusBadge tone={lang.tone} size="sm">{lang.text}</StatusBadge>
                </div>

                {/* Stamps */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex-1"><StampProgress value={stamps} threshold={threshold} size="sm" /></div>
                  <span className="text-xs font-semibold tabular-nums shrink-0" style={{
                    color: ready ? "var(--admin-gold)" : "var(--admin-ink-muted)",
                    minWidth: 36,
                  }}>
                    {stamps}/{threshold}
                  </span>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-1 justify-end">
                  {ready && (
                    <Button variant="gold" size="sm" onClick={() => setRedeemUser(u)}>
                      Redeem
                    </Button>
                  )}
                  <button
                    onClick={() => setStampUser(u)}
                    className="p-2 rounded-md"
                    style={{ color: "var(--admin-ink-muted)" }}
                    title="Adjust stamps"
                    aria-label="Adjust stamps"
                  >
                    <IconGift size={16} />
                  </button>
                  <button
                    onClick={() => setEditUser(u)}
                    className="p-2 rounded-md"
                    style={{ color: "var(--admin-ink-muted)" }}
                    title="Edit customer"
                    aria-label="Edit customer"
                  >
                    <IconEdit size={16} />
                  </button>
                  <Link
                    href={`/admin/customers/${u.id}`}
                    className="p-2 rounded-md"
                    style={{ color: "var(--admin-ink-muted)" }}
                    title="View detail"
                    aria-label="View detail"
                  >
                    <IconEye size={16} />
                  </Link>
                </div>

                {/* Mobile extra row */}
                <div className="md:hidden mt-3 flex items-center gap-3">
                  <div className="flex-1"><StampProgress value={stamps} threshold={threshold} size="sm" /></div>
                  <StatusBadge tone={lang.tone} size="sm">{lang.text}</StatusBadge>
                  <Link href={`/admin/customers/${u.id}`} className="text-xs font-semibold"
                        style={{ color: "var(--admin-accent)", textDecoration: "none" }}>
                    Open →
                  </Link>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderTop: "1px solid var(--admin-border)" }}
          >
            <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary" size="sm"
                leftIcon={<IconChevronLeft size={14} />}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary" size="sm"
                rightIcon={<IconChevronRight size={14} />}
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page === meta.last_page}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit drawer */}
      {editUser && (
        <EditCustomerDrawer
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={handleUserUpdated}
          onError={msg => showMsg("error", msg)}
        />
      )}

      {/* Stamp adjustment drawer */}
      {stampUser && (
        <AdjustStampsDrawer
          user={stampUser}
          threshold={threshold}
          onClose={() => setStampUser(null)}
          onUpdated={(balance, lifetime) => {
            handleStampUpdated(stampUser.id, balance, lifetime);
            showMsg("success", "Stamps updated");
          }}
          onError={msg => showMsg("error", msg)}
        />
      )}

      {/* Redeem confirm */}
      <ConfirmDialog
        open={!!redeemUser}
        onCancel={() => !actionLoading && setRedeemUser(null)}
        onConfirm={handleRedeem}
        title="Redeem free coffee?"
        description={redeemUser ? (
          <>Redeem a free coffee for <strong>{redeemUser.name}</strong>? This will deduct{" "}
            {threshold} stamps from their balance.</>
        ) : null}
        confirmLabel={actionLoading ? "Redeeming…" : "Redeem"}
        tone="gold"
        loading={actionLoading}
      />

      {toast && (
        <Toast
          kind={toast.kind}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Edit Customer Drawer                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function EditCustomerDrawer({
  user, onClose, onSaved, onError,
}: {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        name: name.trim(),
        email: email.trim(),
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

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit customer"
      description={user.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Save changes
          </Button>
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

/* ──────────────────────────────────────────────────────────────────────── */
/*  Adjust Stamps Drawer                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function AdjustStampsDrawer({
  user, threshold, onClose, onUpdated, onError,
}: {
  user: UserWithRewards;
  threshold: number;
  onClose: () => void;
  onUpdated: (balance: number, lifetime: number) => void;
  onError: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const current = user.reward_account?.points_balance ?? 0;
  const parsed  = parseInt(amount, 10);
  const valid   = !isNaN(parsed) && parsed !== 0 && reason.trim().length > 0;
  const preview = !isNaN(parsed) ? Math.max(0, current + parsed) : current;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = getToken();
    if (!token || !valid) return;
    setSaving(true);
    try {
      const res = await adminApi.users.adjustStamps(token, user.id, { amount: parsed, reason: reason.trim() });
      onUpdated(res.points_balance, res.lifetime_points);
      onClose();
    } catch (err) {
      onError((err as ApiError).message || "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Adjust stamps"
      description={user.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={saving} disabled={!valid}>
            Apply adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Preview */}
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
              {current} → {preview}
            </span>
          </div>
          <StampProgress value={preview} threshold={threshold} size="md" />
        </div>

        <div>
          <label className="admin-label">Amount (positive to add, negative to remove)</label>
          <input
            className="admin-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. +1 or -2"
            min={-current}
            max={100}
            autoFocus
          />
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
