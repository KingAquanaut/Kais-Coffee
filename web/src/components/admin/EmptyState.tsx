import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon, title, description, action, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}
      style={{ color: "var(--admin-ink-muted)" }}
    >
      {icon && (
        <div
          className="mb-4 flex items-center justify-center"
          style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: "var(--admin-accent-soft)",
            color: "var(--admin-accent)",
          }}
        >
          {icon}
        </div>
      )}
      <p className="text-base font-semibold" style={{ color: "var(--admin-ink)" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
