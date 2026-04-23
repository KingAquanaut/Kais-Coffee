"use client";
import { useEffect } from "react";
import { IconCheck, IconClose, IconInfo } from "./Icon";

export type ToastKind = "success" | "error" | "info";

type Props = {
  kind: ToastKind;
  message: string;
  onDismiss: () => void;
  duration?: number;
};

const palette: Record<ToastKind, { bg: string; fg: string; icon: React.ReactNode }> = {
  success: { bg: "var(--admin-success-bg)", fg: "var(--admin-success)", icon: <IconCheck size={16} /> },
  error:   { bg: "var(--admin-danger-bg)",  fg: "var(--admin-danger)",  icon: <IconClose size={16} /> },
  info:    { bg: "#dbeafe",                  fg: "#1e40af",              icon: <IconInfo size={16} />  },
};

export default function Toast({ kind, message, onDismiss, duration = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const p = palette[kind];

  return (
    <div
      className="fixed top-4 right-4 z-[80] admin-dialog flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg max-w-sm cursor-pointer"
      style={{
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.fg}`,
        boxShadow: "var(--admin-shadow-lg)",
      }}
      onClick={onDismiss}
      role="alert"
    >
      <span className="shrink-0">{p.icon}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
