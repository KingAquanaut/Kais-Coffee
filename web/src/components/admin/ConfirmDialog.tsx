"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Button from "./Button";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "gold";
  loading?: boolean;
};

export default function ConfirmDialog({
  open, onCancel, onConfirm, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  tone = "primary", loading,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, loading]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 admin-overlay"
      style={{ background: "rgba(42, 35, 28, 0.55)" }}
      onClick={e => {
        if (loading) return;
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="admin-dialog w-full max-w-sm outline-none"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius-lg)",
          boxShadow: "var(--admin-shadow-lg)",
        }}
      >
        <div className="p-6">
          <h3
            id="confirm-title"
            className="text-base font-semibold"
            style={{ color: "var(--admin-ink)" }}
          >
            {title}
          </h3>
          {description && (
            <div className="mt-2 text-sm" style={{ color: "var(--admin-ink-muted)" }}>
              {description}
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: "1px solid var(--admin-border)", background: "var(--admin-surface-alt)" }}
        >
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : tone === "gold" ? "gold" : "primary"}
                  size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
