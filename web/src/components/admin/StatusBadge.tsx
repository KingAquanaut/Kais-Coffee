import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "gold" | "neutral";

const tones: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
  success: { bg: "var(--admin-success-bg)", fg: "var(--admin-success)", dot: "var(--admin-success)" },
  warning: { bg: "var(--admin-warn-bg)",    fg: "var(--admin-warn)",    dot: "var(--admin-warn)"    },
  danger:  { bg: "var(--admin-danger-bg)",  fg: "var(--admin-danger)",  dot: "var(--admin-danger)"  },
  info:    { bg: "#dbeafe",                  fg: "#1e40af",              dot: "#1e40af"              },
  gold:    { bg: "var(--admin-gold-bg)",    fg: "var(--admin-gold)",    dot: "var(--admin-gold)"    },
  neutral: { bg: "var(--admin-surface-hover)", fg: "var(--admin-ink-muted)", dot: "var(--admin-ink-faint)" },
};

type Props = {
  tone?: StatusTone;
  children: ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export default function StatusBadge({ tone = "neutral", children, dot = false, size = "md", className = "" }: Props) {
  const t = tones[tone];
  const sizeStyle = size === "sm"
    ? { padding: "0.125rem 0.5rem", fontSize: "0.6875rem" }
    : { padding: "0.25rem 0.625rem", fontSize: "0.75rem" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${className}`}
      style={{ background: t.bg, color: t.fg, ...sizeStyle }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, display: "inline-block" }}
        />
      )}
      {children}
    </span>
  );
}
