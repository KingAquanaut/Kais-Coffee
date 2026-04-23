"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar  from "@/components/admin/AdminTopbar";
import LoadingState from "@/components/admin/LoadingState";

const STORAGE_KEY = "kc-admin-sidebar-collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load persisted collapse state — deferred so we never setState synchronously inside an effect
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
      } catch { /* localStorage unavailable — fine */ }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/admin/login"); return; }
    if (!user.is_admin) { router.replace("/dashboard"); }
  }, [user, loading, router]);

  // Close mobile drawer when navigating
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="admin-root flex items-center justify-center">
        <LoadingState text="Loading admin…" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  const handleLogout = async () => { await logout(); router.push("/"); };

  return (
    <div className="admin-root flex">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userName={user.name}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="mx-auto w-full" style={{ maxWidth: 1200 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
