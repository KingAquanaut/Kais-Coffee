"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { IconClose } from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** If true, clicking the backdrop will NOT close the drawer (use for unsaved changes). */
  disableBackdropClose?: boolean;
};

const widthMap = { sm: 380, md: 480, lg: 600 } as const;

export default function FormDrawer({
  open, onClose, title, description, children, footer, size = "md", disableBackdropClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Focus the panel when opening
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex admin-overlay"
      style={{ background: "rgba(42, 35, 28, 0.5)" }}
      onClick={e => {
        if (disableBackdropClose) return;
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="flex-1" aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="admin-drawer-panel flex flex-col shadow-2xl outline-none"
        style={{
          width: "100%",
          maxWidth: widthMap[size],
          height: "100%",
          background: "var(--admin-surface)",
          borderLeft: "1px solid var(--admin-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <div className="min-w-0">
            <h2
              id="drawer-title"
              className="text-lg font-semibold truncate"
              style={{ color: "var(--admin-ink)" }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mt-1 -mr-2 rounded-md shrink-0"
            style={{ color: "var(--admin-ink-muted)" }}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer (sticky, optional) */}
        {footer && (
          <div
            className="px-6 py-4 shrink-0 flex items-center justify-end gap-3"
            style={{
              borderTop: "1px solid var(--admin-border)",
              background: "var(--admin-surface-alt)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
