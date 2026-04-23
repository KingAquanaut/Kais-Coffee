import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "section" | "article";
};

const padMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" } as const;

export function Card({ children, className = "", padding = "md", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={`${padMap[padding]} ${className}`}
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        borderRadius: "var(--admin-radius-lg)",
        boxShadow: "var(--admin-shadow-sm)",
      }}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`px-5 py-4 flex items-center justify-between gap-3 ${className}`}
      style={{ borderBottom: "1px solid var(--admin-border)" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-base font-semibold ${className}`}>{children}</h2>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
