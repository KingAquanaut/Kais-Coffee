import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
};

export default function QuickAction({ href, label, description, icon }: Props) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 rounded-xl transition-all"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        textDecoration: "none",
        color: "var(--admin-ink)",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
        style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: "var(--admin-accent-soft)",
          color: "var(--admin-accent)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
