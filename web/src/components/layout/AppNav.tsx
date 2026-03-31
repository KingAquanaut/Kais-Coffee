"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import SettingsMenu from "@/components/ui/SettingsMenu";

const NAV_ITEMS = [
  { href: "/menu",      labelKey: "menu"    as const, icon: "☕" },
  { href: "/dashboard", labelKey: "rewards" as const, icon: "★" },
  { href: "/purchases", labelKey: "history" as const, icon: "🧾" },
  { href: "/profile",   labelKey: "profile" as const, icon: "◉" },
];

// Tab bar labels per language — kept separate from the main schema to avoid
// over-engineering for a 4-item mobile bar.
const TAB_LABELS: Record<string, Record<string, string>> = {
  en: { menu: "Menu", rewards: "Rewards", history: "History", profile: "Profile" },
  es: { menu: "Menú", rewards: "Puntos",  history: "Historial", profile: "Perfil" },
};

export default function AppNav() {
  const pathname          = usePathname();
  const router            = useRouter();
  const { user, logout }  = useAuth();
  const { lang, strings } = useLang();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const tabLabels = TAB_LABELS[lang] ?? TAB_LABELS.en;

  return (
    <>
      {/* Top header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: "var(--kc-bg)", borderBottom: "1.5px solid var(--kc-border)" }}
      >
        <Link href="/dashboard" className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
          Kai&apos;s Coffee
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm hidden sm:block" style={{ color: "var(--kc-muted)" }}>
              {strings.nav.hiName}, {user.name.split(" ")[0]}
            </span>
          )}
          <SettingsMenu />
          <button onClick={handleLogout} className="kc-btn kc-btn-ghost kc-btn-sm">
            {strings.nav.signOut}
          </button>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden"
        style={{ background: "var(--kc-cream)", borderTop: "1.5px solid var(--kc-border)" }}
      >
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5"
              style={{
                color: active ? "var(--kc-black)" : "var(--kc-muted)",
                fontWeight: active ? 700 : 400,
                fontSize: "0.6875rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "1.125rem" }}>{icon}</span>
              {tabLabels[labelKey]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
