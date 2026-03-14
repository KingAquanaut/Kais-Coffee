"use client";
import { useState } from "react";
import type { Purchase } from "@/lib/api";

type Props = { purchase: Purchase };

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="6" viewBox="0 0 10 6" fill="none"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        transition: "transform 0.15s",
        transform: open ? "rotate(180deg)" : "none",
      }}
    >
      <path
        d="M1 1l4 4 4-4"
        stroke="var(--kc-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PurchaseRow({ purchase }: Props) {
  const [open, setOpen] = useState(false);

  const date = new Date(purchase.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const time = new Date(purchase.created_at).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  const total    = `$${parseFloat(purchase.total).toFixed(2)}`;
  const subtotal = parseFloat(purchase.subtotal);
  const discount = parseFloat(purchase.discount);
  const itemCount = purchase.items?.length ?? 0;

  const statusStyle: Record<string, { bg: string; color: string }> = {
    completed: { bg: "#d1fae5", color: "var(--kc-success)" },
    voided:    { bg: "#fee2e2", color: "var(--kc-error)" },
    pending:   { bg: "#e5e7eb", color: "var(--kc-muted)" },
  };
  const st = statusStyle[purchase.status] ?? statusStyle.pending;

  return (
    <div className="kc-card mb-3 overflow-hidden">

      {/* ── Collapsed header (always visible) ─────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        {/* Left: date + item summary */}
        <div className="min-w-0">
          <p className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>
            {date}
            <span className="font-normal ml-2" style={{ color: "var(--kc-muted)", fontSize: "0.75rem" }}>
              {time}
            </span>
          </p>
          <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--kc-muted)" }}>
            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            {purchase.points_earned > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "var(--kc-gold)", fontWeight: 700 }}>
                  +{purchase.points_earned} stamp{purchase.points_earned !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Right: status badge + total + chevron */}
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          <span
            className="kc-badge"
            style={{ background: st.bg, color: st.color }}
          >
            {purchase.status}
          </span>
          <span className="font-bold text-sm">{total}</span>
          <Chevron open={open} />
        </div>
      </button>

      {/* ── Expanded item detail ───────────────────────────────────────────── */}
      {open && (
        <div style={{ borderTop: "1px solid var(--kc-cream-dark)" }}>

          {/* Line items */}
          {(purchase.items ?? []).map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-5 py-2.5 text-sm"
              style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}
            >
              <span style={{ color: "var(--kc-black)" }}>
                <span
                  className="inline-flex items-center justify-center mr-2 rounded-full font-bold text-xs"
                  style={{
                    width: 20, height: 20,
                    background: "var(--kc-bg-mid)",
                    color: "var(--kc-blue-deep)",
                    flexShrink: 0,
                  }}
                >
                  {item.quantity}
                </span>
                {item.name}
              </span>
              <span className="font-semibold ml-4 shrink-0">
                ${parseFloat(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Subtotal (only show when there's a discount) */}
          {discount > 0 && (
            <div
              className="flex justify-between px-5 py-2 text-sm"
              style={{ borderBottom: "1px solid var(--kc-cream-dark)", color: "var(--kc-muted)" }}
            >
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          )}

          {/* Reward discount */}
          {discount > 0 && (
            <div
              className="flex justify-between px-5 py-2 text-sm"
              style={{ borderBottom: "1px solid var(--kc-cream-dark)", color: "var(--kc-gold)", fontWeight: 600 }}
            >
              <span>Reward discount</span>
              <span>−${discount.toFixed(2)}</span>
            </div>
          )}

          {/* Total row */}
          <div className="flex justify-between px-5 py-3 font-bold text-sm">
            <span>Total</span>
            <span>{total}</span>
          </div>

          {/* Stamp footer — only when stamps were earned/redeemed */}
          {(purchase.points_earned > 0 || purchase.points_redeemed > 0) && (
            <div
              className="flex items-center justify-end gap-3 px-5 py-2.5 text-xs"
              style={{ background: "var(--kc-cream-dark)" }}
            >
              {purchase.points_earned > 0 && (
                <span style={{ color: "var(--kc-success)", fontWeight: 700 }}>
                  +{purchase.points_earned} stamp{purchase.points_earned !== 1 ? "s" : ""} earned
                </span>
              )}
              {purchase.points_redeemed > 0 && (
                <span style={{ color: "var(--kc-gold)", fontWeight: 700 }}>
                  Free coffee redeemed ☕
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
