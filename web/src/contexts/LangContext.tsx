"use client";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import translations, {
  LANGUAGES,
  type LangCode,
  type Translations,
} from "@/i18n/translations";

// ── Context shape ─────────────────────────────────────────────────────────────
interface LangContextValue {
  lang:    LangCode;
  setLang: (l: LangCode) => void;
  strings: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang:    "en",
  setLang: () => {},
  strings: translations.en,
});

// ── Provider ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "kc-lang";

function isValidLang(v: string | null): v is LangCode {
  return v !== null && Object.keys(LANGUAGES).includes(v);
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidLang(stored) ? stored : "en";
  });

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, strings: translations[lang] as Translations }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}
