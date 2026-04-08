"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PointsCard from "@/components/ui/PointsCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RewardCelebration from "@/components/ui/RewardCelebration";
import { account as accountApi, type DashboardData, type RewardTx, type Paginated } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

// ── Reward transaction row ────────────────────────────────────────────────────

const TX_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  earn:   { label: "Stamp earned",    icon: "☕", color: "var(--kc-success)", bg: "#d1fae5" },
  redeem: { label: "Reward redeemed", icon: "🎁", color: "var(--kc-gold)",    bg: "var(--kc-gold-lt)" },
  adjust: { label: "Adjustment",      icon: "⟳", color: "var(--kc-blue-deep)", bg: "#dbeafe" },
  expire: { label: "Expired",         icon: "↓", color: "var(--kc-muted)",   bg: "var(--kc-cream-dark)" },
};

function TxRow({ tx }: { tx: RewardTx }) {
  const meta = TX_META[tx.type] ?? TX_META.adjust;
  const date = new Date(tx.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const signed = tx.points > 0 ? `+${tx.points}` : `${tx.points}`;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5"
         style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}>
      {/* Type icon */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full text-sm font-bold"
        style={{ width: 36, height: 36, background: meta.bg, color: meta.color }}
      >
        {meta.icon}
      </div>

      {/* Description + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{tx.description}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>{date}</p>
      </div>

      {/* Stamps */}
      <span className="font-bold text-sm shrink-0" style={{ color: meta.color }}>
        {signed} {Math.abs(tx.points) === 1 ? "stamp" : "stamps"}
      </span>
    </div>
  );
}

// ── Available reward card ─────────────────────────────────────────────────────

function RewardCard({
  threshold, points, canRedeem, onRedeem, redeeming,
}: {
  threshold: number; points: number; canRedeem: boolean;
  onRedeem: () => void; redeeming: boolean;
}) {
  const progress = Math.min(100, Math.round((points / threshold) * 100));
  const remaining = Math.max(0, threshold - (points % threshold));

  return (
    <div
      className="kc-card p-5 flex gap-4"
      style={{ borderLeft: `4px solid ${canRedeem ? "var(--kc-gold)" : "var(--kc-border)"}` }}
    >
      {/* Icon */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full text-2xl"
        style={{
          width: 56, height: 56,
          background: canRedeem ? "var(--kc-gold-lt)" : "var(--kc-cream-dark)",
        }}
      >
        ☕
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>
              Free Coffee
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
              Any espresso-based drink on us
            </p>
          </div>
          <span
            className="kc-badge shrink-0"
            style={{
              background: canRedeem ? "var(--kc-gold-lt)" : "var(--kc-cream-dark)",
              color: canRedeem ? "var(--kc-gold)" : "var(--kc-muted)",
            }}
          >
            {threshold} stamps
          </span>
        </div>

        {/* Mini progress */}
        <div className="mt-3">
          <div className="w-full rounded-full overflow-hidden h-1.5" style={{ background: "var(--kc-bg-mid)" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress % 100 === 0 && points > 0 ? 100 : progress % 100}%`, background: "var(--kc-gold)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--kc-muted)" }}>
            {canRedeem ? "Ready to redeem!" : `${remaining} more stamp${remaining !== 1 ? "s" : ""} needed`}
          </p>
        </div>

        {canRedeem && (
          <button
            onClick={onRedeem}
            disabled={redeeming}
            className="kc-btn kc-btn-gold kc-btn-sm mt-3"
          >
            {redeeming ? "Redeeming…" : "Redeem now"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data,     setData]     = useState<DashboardData | null>(null);
  const [history,  setHistory]  = useState<Paginated<RewardTx> | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [dash, hist] = await Promise.all([
        accountApi.dashboard(token),
        accountApi.rewardsHistory(token),
      ]);
      setData(dash);
      setHistory(hist);
    } catch {
      // errors handled by AppLayout auth guard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRedeem = async () => {
    const token = getToken();
    if (!token) return;
    setRedeeming(true);
    try {
      const res = await accountApi.redeem(token);
      setMsg({ text: res.message, ok: true });
      load();
    } catch {
      setMsg({ text: "Could not redeem. Please try again.", ok: false });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <AppLayout>
      {/* Celebration animation — triggers once when stamp card fills */}
      {data && (
        <RewardCelebration
          points={data.points_balance}
          threshold={data.points_threshold}
          lifetimePoints={data.lifetime_points}
        />
      )}

      {loading ? <LoadingSpinner text="Loading your rewards…" /> : (
        <div className="max-w-2xl">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Your Rewards
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--kc-muted)" }}>
              Welcome back, {data?.user.name.split(" ")[0]}!
            </p>
          </div>

          {/* ── Toast message ───────────────────────────────────────────────── */}
          {msg && (
            <div
              className="mb-5 py-3 px-4 rounded-xl text-sm"
              style={{
                background: msg.ok ? "#d1fae5" : "#fee2e2",
                color: msg.ok ? "var(--kc-success)" : "var(--kc-error)",
              }}
              onClick={() => setMsg(null)}
            >
              {msg.text}
            </div>
          )}

          {/* ── Points overview ─────────────────────────────────────────────── */}
          {data && (
            <PointsCard
              points={data.points_balance}
              threshold={data.points_threshold}
              canRedeem={data.can_redeem}
              onRedeem={handleRedeem}
              redeeming={redeeming}
            />
          )}

          {/* ── Stats row ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="kc-card p-4 text-center">
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--kc-gold)" }}>
                {data?.lifetime_points ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--kc-muted)" }}>Total stamps earned</p>
            </div>
            <div className="kc-card p-4 text-center">
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--kc-blue-deep)" }}>
                {history?.data.filter(t => t.type === "redeem").length ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--kc-muted)" }}>Free coffees redeemed</p>
            </div>
          </div>

          {/* ── Available rewards ───────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Available Rewards
            </h2>
            {data && (
              <RewardCard
                threshold={data.points_threshold}
                points={data.points_balance}
                canRedeem={data.can_redeem}
                onRedeem={handleRedeem}
                redeeming={redeeming}
              />
            )}
          </section>

          {/* ── Reward history ──────────────────────────────────────────────── */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                Reward History
              </h2>
              {(history?.total ?? 0) > 0 && (
                <span className="text-xs" style={{ color: "var(--kc-muted)" }}>
                  {history!.total} transaction{history!.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {(history?.data.length ?? 0) === 0 ? (
              <div className="kc-card p-8 text-center">
                <p className="text-sm" style={{ color: "var(--kc-muted)" }}>
                  No stamps yet. Make your first $6+ purchase to earn your first stamp!
                </p>
                <Link href="/menu" className="kc-btn mt-4 inline-flex">
                  View Menu
                </Link>
              </div>
            ) : (
              <div className="kc-card overflow-hidden">
                {history!.data.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                  />
                ))}
                {history!.last_page > 1 && (
                  <p className="text-xs text-center py-3" style={{ color: "var(--kc-muted)" }}>
                    Showing {history!.per_page} of {history!.total} — visit{" "}
                    <Link href="/purchases" style={{ color: "var(--kc-blue-deep)" }}>purchase history</Link>
                    {" "}for the full list.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Quick links ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 mt-8">
            <Link href="/purchases" className="kc-btn kc-btn-outline flex-1 text-center">
              Purchase History
            </Link>
            <Link href="/menu" className="kc-btn flex-1 text-center">
              Order Now
            </Link>
          </div>

        </div>
      )}
    </AppLayout>
  );
}
