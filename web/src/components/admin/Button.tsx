import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md";

type Base = {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

type ButtonProps = Base & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = Base & { href: string; children: ReactNode; className?: string; target?: string };

const sizeMap = {
  sm: { padding: "0.375rem 0.75rem", fontSize: "0.8125rem", height: 32 },
  md: { padding: "0.5rem 1rem",       fontSize: "0.875rem",  height: 38 },
} as const;

function variantStyle(v: Variant): React.CSSProperties {
  switch (v) {
    case "primary":
      return { background: "var(--admin-ink)", color: "#fff", borderColor: "var(--admin-ink)" };
    case "secondary":
      return { background: "var(--admin-surface)", color: "var(--admin-ink)", borderColor: "var(--admin-border-strong)" };
    case "ghost":
      return { background: "transparent", color: "var(--admin-ink)", borderColor: "transparent" };
    case "danger":
      return { background: "var(--admin-danger)", color: "#fff", borderColor: "var(--admin-danger)" };
    case "gold":
      return { background: "var(--admin-gold)", color: "#fff", borderColor: "var(--admin-gold)" };
  }
}

function baseClass(fullWidth?: boolean) {
  return [
    "admin-btn inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
    "transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
    fullWidth ? "w-full" : "",
  ].filter(Boolean).join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading,
  fullWidth,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const sz = sizeMap[size];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${baseClass(fullWidth)} ${className}`}
      style={{
        ...variantStyle(variant),
        border: "1px solid",
        padding: sz.padding,
        fontSize: sz.fontSize,
        minHeight: sz.height,
        ...(rest.style ?? {}),
      }}
    >
      {loading ? (
        <span
          className="animate-spin rounded-full"
          style={{
            width: 14, height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
          }}
        />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth,
  className = "",
  children,
  href,
  target,
}: LinkButtonProps) {
  const sz = sizeMap[size];
  return (
    <Link
      href={href}
      target={target}
      className={`${baseClass(fullWidth)} ${className}`}
      style={{
        ...variantStyle(variant),
        border: "1px solid",
        padding: sz.padding,
        fontSize: sz.fontSize,
        minHeight: sz.height,
        textDecoration: "none",
      }}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
