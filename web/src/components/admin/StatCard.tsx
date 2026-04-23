import type { ReactNode } from "react";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "gold" | "success";
};

const toneMap = {
  default: { bg: "var(--admin-surface-hover)", fg: "var(--admin-ink-muted)" },
  accent:  { bg: "var(--admin-accent-soft)",   fg: "var(--admin-accent)" },
  gold:    { bg: "var(--admin-gold-bg)",       fg: "var(--admin-gold)" },
  success: { bg: "var(--admin-success-bg)",    fg: "var(--admin-success)" },
};

export default function StatCard({ label, value, icon, hint, tone = "default" }: Props) {
  const t = toneMap[tone];
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-ink-muted)" }}>
            {label}
          </p>
          <p
            className="mt-2 text-3xl font-bold leading-none"
            style={{ color: "var(--admin-ink)", fontFamily: "var(--font-heading)" }}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-xs" style={{ color: "var(--admin-ink-muted)" }}>
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: t.bg,
              color: t.fg,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
