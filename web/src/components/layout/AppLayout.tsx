"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppNav from "./AppNav";
import LoadingSpinner from "../ui/LoadingSpinner";

type Props = { children: React.ReactNode; adminOnly?: boolean };

export default function AppLayout({ children, adminOnly = false }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (adminOnly && !user.is_admin) { router.replace("/dashboard"); }
  }, [user, loading, adminOnly, router]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center" style={{ background: "transparent" }}>
        <LoadingSpinner text="Loading…" />
      </div>
    );
  }

  if (!user || (adminOnly && !user.is_admin)) return null;

  return (
    <div style={{ background: "transparent", minHeight: "100svh" }}>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-28 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
