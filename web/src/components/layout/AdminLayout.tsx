"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

const navItems = [
  { href: "/admin",                    label: "Dashboard" },
  { href: "/admin/purchases/record",   label: "Record Purchase" },
  { href: "/admin/purchases",          label: "Purchase History" },
  { href: "/admin/menu",               label: "Menu Management" },
  { href: "/admin/customers",          label: "Customers" },
  { href: "/admin/content/home",       label: "Home Page" },
  { href: "/admin/content/about",      label: "About Page" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/admin/login"); return; }
    if (!user.is_admin) { router.replace("/dashboard"); }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  const handleLogout = async () => { await logout(); router.push("/"); };

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen"
        style={{ background: "var(--kc-cream)", borderRight: "1.5px solid var(--kc-border)" }}
      >
        <div className="px-6 py-6" style={{ borderBottom: "1.5px solid var(--kc-border)" }}>
          <p className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>Kai&apos;s Coffee</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>Admin Panel</p>
        </div>

        <nav className="flex-1 py-4 px-3">
          {navItems.map(({ href, label }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center px-3 py-2.5 rounded-lg mb-1 text-sm font-semibold"
                style={{
                  background: active ? "var(--kc-bg)" : "transparent",
                  color: active ? "var(--kc-black)" : "var(--kc-muted)",
                  textDecoration: "none",
                  border: active ? "1.5px solid var(--kc-border)" : "1.5px solid transparent",
                  transition: "all 0.12s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1.5px solid var(--kc-border)" }}>
          <p className="text-xs mb-2 truncate" style={{ color: "var(--kc-muted)" }}>{user.name}</p>
          <button onClick={handleLogout} className="kc-btn kc-btn-outline kc-btn-sm w-full">Sign Out</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: "var(--kc-cream)", borderBottom: "1.5px solid var(--kc-border)" }}
        >
          <p className="font-bold" style={{ fontFamily: "var(--font-heading)" }}>Kai&apos;s Coffee — Admin</p>
          <button onClick={handleLogout} className="kc-btn kc-btn-sm">Sign Out</button>
        </header>

        {/* Mobile nav pills */}
        <div
          className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto"
          style={{ borderBottom: "1.5px solid var(--kc-border)", background: "var(--kc-bg)" }}
        >
          {navItems.map(({ href, label }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="kc-btn kc-btn-sm flex-shrink-0"
                style={{
                  background: active ? "var(--kc-black)" : "transparent",
                  color: active ? "var(--kc-white)" : "var(--kc-black)",
                  borderColor: "var(--kc-border)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-6 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
