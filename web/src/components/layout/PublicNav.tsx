"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import SettingsMenu from "@/components/ui/SettingsMenu";
import type { User } from "@/lib/api";

// ── Chevron icon ──────────────────────────────────────────────────────────────
function Chevron({ open, ghost }: { open: boolean; ghost?: boolean }) {
  return (
    <svg
      width="10" height="6" viewBox="0 0 10 6" fill="none"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        transition: "transform 0.15s",
        transform: open ? "rotate(180deg)" : "none",
      }}
    >
      <path
        d="M1 1l4 4 4-4"
        stroke={ghost ? "rgba(255,255,255,0.6)" : "var(--kc-muted)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Signed-in user dropdown ───────────────────────────────────────────────────
function UserMenu({
  user,
  logout,
  ghost,
}: {
  user: User;
  logout: () => Promise<void>;
  ghost?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const router          = useRouter();
  const { strings }     = useLang();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
  };

  const links = user.is_admin
    ? [{ href: "/admin",     label: strings.nav.adminDashboard }]
    : [
        { href: "/dashboard", label: strings.nav.myRewards },
        { href: "/purchases", label: strings.nav.purchaseHistory },
        { href: "/profile",   label: strings.nav.accountSettings },
      ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          background: ghost ? "rgba(255,255,255,0.12)" : "var(--kc-cream)",
          border: ghost ? "1.5px solid rgba(255,255,255,0.32)" : "1.5px solid var(--kc-border)",
          borderRadius: "9999px",
          padding: "0.3rem 0.65rem 0.3rem 0.3rem",
          cursor: "pointer",
          backdropFilter: ghost ? "blur(6px)" : undefined,
          WebkitBackdropFilter: ghost ? "blur(6px)" : undefined,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <span
          style={{
            width: 28, height: 28,
            borderRadius: "50%",
            background: ghost ? "rgba(255,255,255,0.22)" : "var(--kc-blue-deep)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 900, flexShrink: 0,
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span
          className="hidden sm:inline"
          style={{
            maxWidth: "7rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: "0.8125rem", fontWeight: 700,
            fontFamily: "var(--font-body)",
            color: ghost ? "#fff" : "var(--kc-black)",
            transition: "color 0.2s",
          }}
        >
          {user.name.split(" ")[0]}
        </span>
        <Chevron open={open} ghost={ghost} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            minWidth: "min(210px, 85vw)",
            background: "var(--kc-cream)",
            border: "1.5px solid var(--kc-border)",
            borderRadius: "0.875rem",
            boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--kc-cream-dark)" }}>
            <p style={{ fontWeight: 700, fontSize: "0.875rem", fontFamily: "var(--font-heading)" }}>
              {user.name}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--kc-muted)", marginTop: "0.2rem" }}>
              {user.email}
            </p>
          </div>

          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "0.6rem 1rem",
                fontSize: "0.875rem", fontWeight: 600,
                color: "var(--kc-black)",
                textDecoration: "none",
                borderBottom: "1px solid var(--kc-cream-dark)",
              }}
              className="hover:bg-(--kc-bg)"
            >
              {label}
            </Link>
          ))}

          <button
            role="menuitem"
            onClick={handleLogout}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "0.6rem 1rem",
              fontSize: "0.875rem", fontWeight: 600,
              color: "var(--kc-error)",
              background: "none", border: "none", cursor: "pointer",
            }}
            className="hover:bg-(--kc-bg)"
          >
            {strings.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main nav ──────────────────────────────────────────────────────────────────
interface PublicNavProps {
  /** When true, nav overlays the hero and fades from transparent → opaque on scroll */
  overlayHero?: boolean;
}

export default function PublicNav({ overlayHero = false }: PublicNavProps) {
  const { user, logout } = useAuth();
  const { strings }      = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlayHero) return;
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll(); // initialise on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayHero]);

  // Ghost = transparent mode (over hero, not yet scrolled)
  const ghost = overlayHero && !scrolled;

  return (
    <nav
      className="kc-nav flex items-center justify-between px-6 py-4"
      style={{
        position: overlayHero ? "fixed" : "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: ghost ? "transparent" : "var(--kc-bg)",
        borderBottom: ghost ? "1.5px solid transparent" : "1.5px solid var(--kc-border)",
        transition: "background 0.35s ease, border-color 0.35s ease",
      }}
    >
      {/* Left: brand */}
      <Link
        href="/"
        className="font-bold text-xl"
        style={{
          fontFamily: "var(--font-heading)",
          color: ghost ? "#fff" : "var(--kc-black)",
          textDecoration: "none",
          transition: "color 0.35s ease",
          textShadow: ghost ? "0 1px 8px rgba(0,0,0,0.32)" : "none",
        }}
      >
        Kai&apos;s Coffee
      </Link>

      {/* Right: nav links + settings + account */}
      <div className="flex items-center gap-3">
        <Link
          href="/about"
          className="text-sm font-semibold"
          style={{
            color: ghost ? "rgba(255,255,255,0.88)" : "var(--kc-black)",
            textDecoration: "none",
            transition: "color 0.35s ease",
            textShadow: ghost ? "0 1px 6px rgba(0,0,0,0.28)" : "none",
          }}
        >
          {strings.nav.aboutUs}
        </Link>

        {/* Menu button */}
        <Link
          href="/menu"
          className="kc-btn kc-btn-sm"
          style={ghost ? {
            background: "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.48)",
            color: "#fff",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          } : undefined}
        >
          {strings.nav.menu}
        </Link>

        {/* Settings / language picker */}
        <SettingsMenu ghost={ghost} />

        {user ? (
          <UserMenu user={user} logout={logout} ghost={ghost} />
        ) : (
          <Link
            href="/auth/login"
            className="kc-btn kc-btn-sm"
            style={ghost ? {
              background: "var(--kc-gold)",
              borderColor: "var(--kc-gold)",
              color: "#fff",
            } : undefined}
          >
            {strings.nav.signIn}
          </Link>
        )}
      </div>
    </nav>
  );
}
