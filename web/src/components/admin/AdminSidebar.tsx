"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconDashboard, IconUsers, IconCoffee,
  IconHome, IconInfo, IconQr, IconReceipt,
  IconChevronLeft, IconChevronRight, IconClose, IconLogout,
} from "./Icon";
import { PURCHASES_ENABLED } from "@/lib/features";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  purchaseOnly?: boolean;
};

// Icon nodes pre-rendered so we can pass them as children
const buildNav = (): NavItem[] => [
  { href: "/admin",                  label: "Dashboard",        icon: <IconDashboard /> },
  { href: "/admin/scan",             label: "Scan QR",          icon: <IconQr /> },
  { href: "/admin/purchases/record", label: "Record Purchase",  icon: <IconReceipt />, purchaseOnly: true },
  { href: "/admin/purchases",        label: "Purchase History", icon: <IconReceipt />, purchaseOnly: true },
  { href: "/admin/customers",        label: "Customers",        icon: <IconUsers /> },
  { href: "/admin/menu",             label: "Menu",             icon: <IconCoffee /> },
  { href: "/admin/content/home",     label: "Home Page",        icon: <IconHome /> },
  { href: "/admin/content/about",    label: "About Page",       icon: <IconInfo /> },
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  userName: string;
  onLogout: () => void;
};

export default function AdminSidebar({
  collapsed, onToggle, mobileOpen, onMobileClose, userName, onLogout,
}: Props) {
  const pathname = usePathname();
  const items = buildNav().filter(i => !i.purchaseOnly || PURCHASES_ENABLED);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const width = collapsed ? 72 : 240;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 admin-overlay"
          style={{ background: "rgba(42, 35, 28, 0.45)" }}
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-10
          h-dvh md:h-screen shrink-0
          flex flex-col
          transition-transform md:transition-[width] duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
        style={{
          width,
          background: "var(--admin-sidebar)",
          borderRight: "1px solid var(--admin-border)",
        }}
      >
        {/* Brand / header */}
        <div
          className="flex items-center justify-between gap-2 px-3 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2 min-w-0 flex-1 px-2 py-1 rounded-md"
            style={{ textDecoration: "none", color: "var(--admin-ink)" }}
            onClick={onMobileClose}
          >
            <span
              className="flex items-center justify-center shrink-0 font-bold text-sm"
              style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: "var(--admin-ink)",
                color: "#fff",
                fontFamily: "var(--font-heading)",
              }}
              aria-hidden
            >
              K
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <p className="font-bold leading-tight text-sm truncate" style={{ fontFamily: "var(--font-heading)" }}>
                  Kai&apos;s Coffee
                </p>
                <p className="text-[11px] leading-tight truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  Admin
                </p>
              </span>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-md"
            style={{ color: "var(--admin-ink-muted)" }}
            aria-label="Close menu"
          >
            <IconClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {items.map(item => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`admin-nav-link ${active ? "is-active" : ""}`}
                    title={collapsed ? item.label : undefined}
                    style={collapsed ? { justifyContent: "center", padding: "0.625rem" } : undefined}
                  >
                    <span className="shrink-0 flex items-center">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — user + collapse */}
        <div
          className="px-2 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--admin-border)" }}
        >
          <div
            className={`flex items-center gap-2 px-2 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}
          >
            <div
              className="flex items-center justify-center shrink-0 font-bold text-xs"
              style={{
                width: 30, height: 30,
                borderRadius: "50%",
                background: "var(--admin-accent-soft)",
                color: "var(--admin-accent-deep)",
              }}
              aria-hidden
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--admin-ink)" }}>
                  {userName}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  Administrator
                </p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-white"
              style={{ color: "var(--admin-ink-muted)" }}
              title="Sign out"
              aria-label="Sign out"
            >
              <IconLogout size={18} />
            </button>
          </div>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggle}
            className="hidden md:flex items-center justify-center w-full mt-2 py-1.5 rounded-md text-xs font-medium"
            style={{
              color: "var(--admin-ink-muted)",
              border: "1px dashed var(--admin-border)",
              background: "transparent",
            }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <IconChevronRight size={16} /> : <><IconChevronLeft size={16} /><span className="ml-1">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
