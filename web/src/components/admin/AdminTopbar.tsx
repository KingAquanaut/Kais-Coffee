"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconMenu, IconChevronRight, IconQr, IconPlus } from "./Icon";
import { PURCHASES_ENABLED } from "@/lib/features";

type Crumb = { label: string; href?: string };

const crumbMap: Record<string, Crumb[]> = {
  "/admin":                   [{ label: "Dashboard" }],
  "/admin/scan":              [{ label: "Scan QR" }],
  "/admin/customers":         [{ label: "Customers" }],
  "/admin/menu":              [{ label: "Menu" }],
  "/admin/purchases":         [{ label: "Purchase History" }],
  "/admin/purchases/record":  [{ label: "Purchases", href: "/admin/purchases" }, { label: "Record" }],
  "/admin/content/home":      [{ label: "Content", href: "/admin/content/home" }, { label: "Home" }],
  "/admin/content/about":     [{ label: "Content", href: "/admin/content/home" }, { label: "About" }],
};

function crumbsFor(pathname: string): Crumb[] {
  if (crumbMap[pathname]) return crumbMap[pathname];
  // Sub-routes: /admin/customers/123
  if (pathname.startsWith("/admin/customers/")) {
    return [{ label: "Customers", href: "/admin/customers" }, { label: "Detail" }];
  }
  return [{ label: "Admin" }];
}

type Props = {
  onMobileMenuOpen: () => void;
};

export default function AdminTopbar({ onMobileMenuOpen }: Props) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 h-16 shrink-0"
      style={{
        background: "rgba(247, 244, 239, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--admin-border)",
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 -ml-2 rounded-md"
        style={{ color: "var(--admin-ink)" }}
        aria-label="Open menu"
      >
        <IconMenu />
      </button>

      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-1.5 text-sm min-w-0 flex-1"
        aria-label="Breadcrumb"
      >
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <IconChevronRight size={14} className="shrink-0" />}
            {c.href ? (
              <Link
                href={c.href}
                className="truncate"
                style={{ color: "var(--admin-ink-muted)", textDecoration: "none" }}
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="font-semibold truncate"
                style={{ color: "var(--admin-ink)" }}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/scan"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--admin-surface)",
            color: "var(--admin-ink)",
            border: "1px solid var(--admin-border-strong)",
            textDecoration: "none",
          }}
          title="Scan QR"
        >
          <IconQr size={16} />
          <span className="hidden lg:inline">Scan</span>
        </Link>
        {PURCHASES_ENABLED && (
          <Link
            href="/admin/purchases/record"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--admin-ink)",
              color: "#fff",
              border: "1px solid var(--admin-ink)",
              textDecoration: "none",
            }}
          >
            <IconPlus size={16} />
            <span className="hidden sm:inline">Record Purchase</span>
          </Link>
        )}
      </div>
    </header>
  );
}
