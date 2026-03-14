"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>{children}</AuthProvider>
    </LangProvider>
  );
}
