"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PointsCard from "@/components/ui/PointsCard";
import { admin as adminApi, type User, type Purchase, type RewardSummary, type ApiError } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDismiss }: { msg: { text: string; ok: boolean }; onDismiss: () => void }) {
  return (
    <div
      className="mb-5 py-3 px-4 rounded-xl text-sm cursor-pointer"
      style={{
        background: msg.ok ? "#d1fae5" : "#fee2e2",
        color: msg.ok ? "var(--kc-success)" : "var(--kc-error)",
      }}
      onClick={onDismiss}
    >
      {msg.text}
    </div>
  );
}

// ── Edit Form ────────────────────────────────────────────────────────────────
function EditForm({
  user,
  onSaved,
  onError,
}: {
  user: User;
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

    // Client-side validation
    const errs: Record<string, string[]> = {};
    if (!name.trim()) errs.name = ["Name is required."];
    if (!email.trim()) errs.email = ["Email is required."];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = ["Invalid email format."];
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setErrors({});
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
      onError(apiErr.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kc-card p-5">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
        Customer Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="kc-label">Name</label>
          <input className="kc-input" value={name} onChange={e => setName(e.target.value)} />
          {errors.name && <p className="text-xs mt-1" style={{ color: "var(--kc-error)" }}>{errors.name[0]}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="kc-label">Email</label>
          <input className="kc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          {errors.email && <p className="text-xs mt-1" style={{ color: "var(--kc-error)" }}>{errors.email[0]}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="kc-label">Phone</label>
          <input className="kc-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
          {errors.phone && <p className="text-xs mt-1" style={{ color: "var(--kc-error)" }}>{errors.phone[0]}</p>}
        </div>

        {/* Language */}
        <div>
          <label className="kc-label">Language Preference</label>
          <select
            className="kc-input"
            value={langPref}
            onChange={e => setLangPref(e.target.value)}
          >
            <option value="">Not set</option>
            {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button type="submit" disabled={saving} className="kc-btn">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Stamp Management ─────────────────────────────────────────────────────────
function StampManager({
  userId,
  reward,
  onUpdated,
  onError,
}: {
  userId: number;
  reward: RewardSummary;
  onUpdated: (r: Partial<RewardSummary>, action?: string) => void;
  onError: (msg: string) => void;
}) {
  const [amount, setAmount]   = useState("");
  const [reason, setReason]   = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    const num = parseInt(amount, 10);
    if (!token || isNaN(num) || num === 0) return;
    if (!reason.trim()) { onError("A reason is required for stamp adjustments."); return; }

    setAdjusting(true);
    try {
      const res = await adminApi.users.adjustStamps(token, userId, { amount: num, reason: reason.trim() });
      onUpdated({ points_balance: res.points_balance, lifetime_points: res.lifetime_points, can_redeem: res.can_redeem }, `Stamps adjusted by ${num}.`);
      setAmount("");
      setReason("");
    } catch (err) {
      onError((err as ApiError).message || "Stamp adjustment failed.");
    } finally {
      setAdjusting(false);
    }
  };

  const handleRedeem = async () => {
    const token = getToken();
    if (!token) return;
    setRedeeming(true);
    try {
      const res = await adminApi.users.redeemReward(token, userId);
      onUpdated({ points_balance: res.points_balance, lifetime_points: res.lifetime_points, can_redeem: res.can_redeem }, "Free coffee redeemed!");
      setShowRedeemConfirm(false);
    } catch (err) {
      onError((err as ApiError).message || "Redemption failed.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="kc-card p-5">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
        Stamp Card Management
      </h2>

      {/* Current stamp card */}
      <PointsCard
        points={reward.points_balance}
        threshold={reward.threshold}
        canRedeem={false}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--kc-bg)" }}>
          <p className="text-xl font-bold" style={{ color: "var(--kc-gold)" }}>{reward.points_balance}</p>
          <p className="text-xs" style={{ color: "var(--kc-muted)" }}>Current stamps</p>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--kc-bg)" }}>
          <p className="text-xl font-bold" style={{ color: "var(--kc-blue-deep)" }}>{reward.lifetime_points}</p>
          <p className="text-xs" style={{ color: "var(--kc-muted)" }}>Lifetime stamps</p>
        </div>
      </div>

      {/* Redeem section */}
      {reward.can_redeem && (
        <div className="mt-5 p-4 rounded-xl" style={{ background: "var(--kc-gold-lt)", border: "1.5px solid var(--kc-gold)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-sm">Reward available!</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
                Customer has {reward.points_balance} stamps ({reward.threshold} needed)
              </p>
            </div>
            {showRedeemConfirm ? (
              <div className="flex gap-2">
                <button onClick={handleRedeem} disabled={redeeming} className="kc-btn kc-btn-gold kc-btn-sm">
                  {redeeming ? "Redeeming..." : "Confirm Redeem"}
                </button>
                <button onClick={() => setShowRedeemConfirm(false)} className="kc-btn kc-btn-outline kc-btn-sm">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setShowRedeemConfirm(true)} className="kc-btn kc-btn-gold kc-btn-sm">
                Redeem Free Coffee
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual adjustment */}
      <form onSubmit={handleAdjust} className="mt-5">
        <p className="kc-label">Manual Stamp Adjustment</p>
        <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
          <input
            className="kc-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="+/- #"
            min={-reward.points_balance}
            max={100}
          />
          <input
            className="kc-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for adjustment (required)"
          />
        </div>
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={adjusting || !amount || parseInt(amount) === 0 || !reason.trim()}
            className="kc-btn kc-btn-outline kc-btn-sm"
          >
            {adjusting ? "Adjusting..." : "Apply Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Recent Purchases ─────────────────────────────────────────────────────────
function RecentPurchases({ purchases }: { purchases: Purchase[] }) {
  if (purchases.length === 0) {
    return (
      <div className="kc-card p-5">
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>Recent Purchases</h2>
        <p className="text-sm" style={{ color: "var(--kc-muted)" }}>No purchases yet.</p>
      </div>
    );
  }

  return (
    <div className="kc-card overflow-hidden">
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>Recent Purchases</h2>
      </div>
      {purchases.map((p, i) => {
        const date = new Date(p.created_at).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });
        return (
          <div
            key={p.id}
            className="flex items-center justify-between px-5 py-3 text-sm"
            style={{ borderTop: "1px solid var(--kc-cream-dark)" }}
          >
            <div className="min-w-0">
              <p className="font-semibold">
                ${parseFloat(p.total).toFixed(2)}
                {p.points_earned > 0 && (
                  <span className="ml-2 text-xs" style={{ color: "var(--kc-success)" }}>+{p.points_earned} stamp</span>
                )}
                {p.points_redeemed > 0 && (
                  <span className="ml-2 text-xs" style={{ color: "var(--kc-gold)" }}>redeemed</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
                {date} · {p.items?.length ?? 0} item{(p.items?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <span
              className="kc-badge"
              style={{
                background: p.status === "completed" ? "#d1fae5" : p.status === "voided" ? "#fee2e2" : "var(--kc-cream-dark)",
                color: p.status === "completed" ? "var(--kc-success)" : p.status === "voided" ? "var(--kc-error)" : "var(--kc-muted)",
              }}
            >
              {p.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminCustomerDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const userId  = Number(params.id);

  const [user,    setUser]    = useState<User | null>(null);
  const [reward,  setReward]  = useState<RewardSummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

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
      setMsg({ text: "Failed to load customer.", ok: false });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  const handleSaved = (updated: User) => {
    setUser(updated);
    setMsg({ text: "Customer updated successfully.", ok: true });
  };

  const handleRewardUpdated = (partial: Partial<RewardSummary>, action?: string) => {
    setReward(prev => prev ? { ...prev, ...partial } : prev);
    setMsg({ text: action ?? "Stamps updated.", ok: true });
  };

  if (loading) {
    return <AdminLayout><LoadingSpinner /></AdminLayout>;
  }

  if (!user) {
    return (
      <AdminLayout>
        <p className="text-sm" style={{ color: "var(--kc-error)" }}>Customer not found.</p>
        <Link href="/admin/customers" className="kc-btn kc-btn-outline kc-btn-sm mt-4 inline-flex">Back to Customers</Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/customers"
          className="kc-btn kc-btn-outline kc-btn-sm"
          style={{ padding: "0.3rem 0.7rem" }}
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{user.name}</h1>
          <p className="text-xs" style={{ color: "var(--kc-muted)" }}>{user.email}</p>
        </div>
      </div>

      {msg && <Toast msg={msg} onDismiss={() => setMsg(null)} />}

      <div className="flex flex-col gap-5 max-w-3xl">
        <EditForm user={user} onSaved={handleSaved} onError={m => setMsg({ text: m, ok: false })} />

        {reward && (
          <StampManager
            userId={user.id}
            reward={reward}
            onUpdated={handleRewardUpdated}
            onError={m => setMsg({ text: m, ok: false })}
          />
        )}

        <RecentPurchases purchases={purchases} />
      </div>
    </AdminLayout>
  );
}
