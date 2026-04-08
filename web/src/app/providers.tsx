"use client";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider, useLang } from "@/contexts/LangContext";
import { type LangCode, LANGUAGES } from "@/i18n/translations";

/**
 * Syncs user.language_preference → LangContext on login.
 * Only fires when the user changes (null → User), not on every render.
 */
function LangSync() {
  const { user } = useAuth();
  const { setLang } = useLang();
  const prevUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!user) { prevUserId.current = null; return; }
    if (user.id === prevUserId.current) return;
    prevUserId.current = user.id;

    const pref = user.language_preference;
    if (pref && pref in LANGUAGES) {
      setLang(pref as LangCode);
    }
  }, [user, setLang]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>
        <LangSync />
        {children}
      </AuthProvider>
    </LangProvider>
  );
}
