"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import QuickAction from "@/components/admin/QuickAction";
import { Card, CardHeader, CardTitle } from "@/components/admin/Card";
import EmptyState from "@/components/admin/EmptyState";
import LoadingState from "@/components/admin/LoadingState";
import StatusBadge from "@/components/admin/StatusBadge";
import { LinkButton } from "@/components/admin/Button";
import {
  IconUsers, IconGift, IconSparkle, IconReceipt, IconCoffee,
  IconPlus, IconInfo, IconQr, IconTrendUp,
} from "@/components/admin/Icon";
import { admin as adminApi, type AdminStats } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";
import { PURCHASES_ENABLED } from "@/lib/features";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function rewardActivityTone(type: string): "success" | "danger" | "gold" | "neutral" {
  if (type === "redeem")     return "gold";
  if (type === "earn")       return "success";
  if (type === "adjustment") return "neutral";
  if (type === "void")       return "danger";
  return "neutral";
}

function rewardActivityLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

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

  const stats = data?.stats;

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Overview"
        title="Good morning ☕"
        description="Here's what's happening at Kai's Coffee today."
        actions={
          PURCHASES_ENABLED ? (
            <LinkButton href="/admin/purchases/record" variant="primary" leftIcon={<IconPlus size={16} />}>
              Record Purchase
            </LinkButton>
          ) : null
        }
      />

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "var(--admin-danger-bg)",
            color: "var(--admin-danger)",
            border: "1px solid var(--admin-danger)",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState text="Loading dashboard…" />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 mb-8 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Customers"
              value={stats?.total_users ?? "—"}
              icon={<IconUsers size={20} />}
              tone="accent"
            />
            <StatCard
              label="Reward Ready"
              value={stats?.reward_ready ?? 0}
              hint={stats?.reward_threshold ? `${stats.reward_threshold}+ stamps` : undefined}
              icon={<IconGift size={20} />}
              tone="gold"
            />
            <StatCard
              label="Redemptions (mo)"
              value={stats?.redemptions_mo ?? 0}
              icon={<IconSparkle size={20} />}
              tone="success"
            />
            {PURCHASES_ENABLED ? (
              <StatCard
                label="Revenue (mo)"
                value={stats?.month_revenue ? `$${stats.month_revenue}` : "—"}
                hint={stats?.total_purchases ? `${stats.total_purchases} purchases` : undefined}
                icon={<IconTrendUp size={20} />}
                tone="default"
              />
            ) : (
              <StatCard
                label="Active Items"
                value={stats?.active_items ?? 0}
                icon={<IconCoffee size={20} />}
                tone="default"
              />
            )}
          </div>

          {/* Quick actions */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--admin-ink-muted)" }}>
              Quick Actions
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                href="/admin/scan"
                label="Scan QR"
                description="Redeem or stamp a customer"
                icon={<IconQr size={20} />}
              />
              <QuickAction
                href="/admin/customers"
                label="Manage Customers"
                description="Search, edit, adjust stamps"
                icon={<IconUsers size={20} />}
              />
              <QuickAction
                href="/admin/menu"
                label="Add Menu Item"
                description="Update drinks & categories"
                icon={<IconCoffee size={20} />}
              />
              <QuickAction
                href="/admin/content/about"
                label="Edit About Page"
                description="Team members & story"
                icon={<IconInfo size={20} />}
              />
            </div>
          </section>

          {/* Two-column activity */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
            {/* Recent reward activity */}
            <Card className="lg:col-span-3" padding="none">
              <CardHeader>
                <CardTitle>Recent Reward Activity</CardTitle>
                <Link
                  href="/admin/customers"
                  className="text-sm font-semibold"
                  style={{ color: "var(--admin-accent)", textDecoration: "none" }}
                >
                  View customers →
                </Link>
              </CardHeader>
              {(data?.recent_rewards?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={<IconGift />}
                  title="No reward activity yet"
                  description="Stamp adjustments and redemptions will appear here."
                />
              ) : (
                <ul>
                  {data!.recent_rewards!.map((tx, i, arr) => (
                    <li
                      key={tx.id}
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--admin-border)" : undefined }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          background: "var(--admin-accent-soft)",
                          color: "var(--admin-accent-deep)",
                        }}
                        aria-hidden
                      >
                        {tx.user_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-ink)" }}>
                          {tx.user_id ? (
                            <Link
                              href={`/admin/customers/${tx.user_id}`}
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              {tx.user_name ?? "Customer"}
                            </Link>
                          ) : (tx.user_name ?? "Customer")}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--admin-ink-muted)" }}>
                          {tx.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold tabular-nums"
                              style={{ color: tx.points > 0 ? "var(--admin-success)" : "var(--admin-danger)" }}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </span>
                        <StatusBadge tone={rewardActivityTone(tx.type)} size="sm">
                          {rewardActivityLabel(tx.type)}
                        </StatusBadge>
                        <span className="text-xs tabular-nums hidden sm:inline"
                              style={{ color: "var(--admin-ink-faint)" }}>
                          {timeAgo(tx.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Right column — purchases or top items */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {PURCHASES_ENABLED && (data?.top_items.length ?? 0) > 0 && (
                <Card padding="none">
                  <CardHeader><CardTitle>Top Items (mo)</CardTitle></CardHeader>
                  <ul>
                    {data!.top_items.map((item, i, arr) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--admin-border)" : undefined }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: "var(--admin-gold-bg)", color: "var(--admin-gold)",
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: "var(--admin-ink-muted)" }}>
                          {item.qty_sold} sold
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {PURCHASES_ENABLED && (
                <Card padding="none">
                  <CardHeader>
                    <CardTitle>Recent Purchases</CardTitle>
                    <Link
                      href="/admin/purchases"
                      className="text-sm font-semibold"
                      style={{ color: "var(--admin-accent)", textDecoration: "none" }}
                    >
                      View all →
                    </Link>
                  </CardHeader>
                  {(data?.recent_purchases.length ?? 0) === 0 ? (
                    <EmptyState
                      icon={<IconReceipt />}
                      title="No purchases yet"
                      description="Record your first purchase to see it here."
                    />
                  ) : (
                    <ul>
                      {data!.recent_purchases.slice(0, 5).map((p, i, arr) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between px-5 py-3"
                          style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--admin-border)" : undefined }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-ink)" }}>
                              {p.user?.name ?? "—"}
                            </p>
                            <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
                              {timeAgo(p.created_at)} · {p.items?.length ?? 0} items
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--admin-ink)" }}>
                              ${parseFloat(p.total).toFixed(2)}
                            </p>
                            {p.points_earned > 0 && (
                              <p className="text-[11px] tabular-nums" style={{ color: "var(--admin-gold)" }}>
                                +{p.points_earned} pts
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {!PURCHASES_ENABLED && (
                <Card>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
                      }}
                    >
                      <IconCoffee />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--admin-ink)" }}>
                        Active Menu Items
                      </p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5"
                         style={{ color: "var(--admin-ink)", fontFamily: "var(--font-heading)" }}>
                        {stats?.active_items ?? 0}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
