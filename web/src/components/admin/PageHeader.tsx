import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
};

export default function PageHeader({ title, description, actions, eyebrow, className = "" }: Props) {
  return (
    <div className={`mb-7 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--admin-accent)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: "var(--admin-ink)", letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm" style={{ color: "var(--admin-ink-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
