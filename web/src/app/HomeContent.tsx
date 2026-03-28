"use client";
// Static sections of the home page that need i18n.
// Receives dynamic API data as props; reads translations client-side.
import Link from "next/link";
import { useLang } from "@/contexts/LangContext";

// ── Stamp preview (decorative, no translations needed) ────────────────────────
function StampPreview() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", margin: "1.75rem auto", maxWidth: 220 }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const filled  = i < 5;
        const isFinal = i === 7;
        return (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: "50%",
              border: filled ? "2px solid var(--kc-gold)" : "2px dashed rgba(26,26,26,0.18)",
              background: filled ? "var(--kc-gold-lt)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.8rem",
            }}
          >
            {filled ? "☕" : isFinal ? (
              <span style={{ fontSize: "0.38rem", fontWeight: 900, letterSpacing: "0.07em", color: "var(--kc-muted)", fontFamily: "var(--font-heading)", lineHeight: 1 }}>FREE</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ── Hero heading + subtext ────────────────────────────────────────────────────
// cmsHeading / cmsSubtext: raw API values — null means the admin hasn't
// customised them, so we fall back to the translation string.
// If the admin HAS set a custom value, it's shown as-is (they manage
// their own bilingual content in the CMS).
export function HeroText({
  cmsHeading,
  cmsSubtext,
  hasPhoto,
}: {
  cmsHeading: string | null;
  cmsSubtext: string | null;
  hasPhoto: boolean;
}) {
  const { strings } = useLang();
  const heading = cmsHeading ?? strings.home.heroHeading;
  const subtext  = cmsSubtext ?? strings.home.heroSubtext;

  return (
    <>
      <h1
        className={`font-bold ${hasPhoto ? "text-3xl sm:text-4xl md:text-6xl" : "text-4xl sm:text-5xl md:text-7xl"}`}
        style={{
          fontFamily: "var(--font-heading)",
          maxWidth: "14ch",
          lineHeight: 1.06,
          letterSpacing: "-0.01em",
          color: hasPhoto ? "#fff" : undefined,
          textShadow: hasPhoto ? "0 2px 28px rgba(18,10,5,0.5)" : undefined,
        }}
      >
        {heading}
      </h1>
      <p
        className="text-sm md:text-base"
        style={{
          maxWidth: "34ch",
          color: hasPhoto ? "rgba(255,255,255,0.78)" : "var(--kc-muted)",
          lineHeight: 1.85,
          letterSpacing: "0.01em",
        }}
      >
        {subtext}
      </p>
    </>
  );
}

// ── Hero CTA buttons — translated ─────────────────────────────────────────────
export function HeroButtons({ hasPhoto }: { hasPhoto: boolean }) {
  const { strings } = useLang();
  return (
    <div className="flex flex-col sm:flex-row gap-3" style={{ marginTop: "0.25rem" }}>
      <Link
        href="/menu"
        className="kc-btn px-8 py-3 text-sm"
        style={hasPhoto ? { background: "var(--kc-gold)", borderColor: "var(--kc-gold)", color: "#fff" } : undefined}
      >
        {strings.home.exploreMenu}
      </Link>
      <Link
        href="/auth/register"
        className="kc-btn kc-btn-outline px-8 py-3 text-sm"
        style={hasPhoto ? {
          borderColor: "rgba(255,255,255,0.52)",
          color: "#fff",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        } : undefined}
      >
        {strings.home.joinRewards}
      </Link>
    </div>
  );
}

// ── Hero badge ────────────────────────────────────────────────────────────────
export function HeroBadge({ hasPhoto }: { hasPhoto: boolean }) {
  const { strings } = useLang();
  return (
    <p
      className="kc-badge kc-badge-blue"
      style={hasPhoto ? {
        color: "rgba(255,255,255,0.92)",
        borderColor: "rgba(255,255,255,0.32)",
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      } : undefined}
    >
      {strings.home.badge}
    </p>
  );
}

// ── Stamp card section ────────────────────────────────────────────────────────
export function StampSection() {
  const { strings } = useLang();
  const s = strings.home;
  return (
    <section className="px-6 py-16">
      <div className="max-w-sm mx-auto text-center">
        <div style={{ width: 36, height: 2.5, background: "var(--kc-gold)", borderRadius: 2, margin: "0 auto 1.5rem" }} />
        <span className="kc-badge kc-badge-gold" style={{ display: "inline-flex", marginBottom: "1rem" }}>
          {s.stampBadge}
        </span>
        <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", lineHeight: 1.1 }}>
          {s.stampTitle.split("\n").map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h2>
        <p className="text-sm mt-3" style={{ color: "var(--kc-muted)", lineHeight: 1.8 }}>
          {s.stampSubtext}
        </p>
        <StampPreview />
        <p className="text-xs" style={{ color: "var(--kc-muted)", marginBottom: "1.5rem" }}>
          {s.stampExample}
        </p>
        <Link href="/auth/register" className="kc-btn kc-btn-gold inline-flex">
          {s.startCollecting}
        </Link>
      </div>
    </section>
  );
}

// ── Three pillars section ─────────────────────────────────────────────────────
export function PillarsSection() {
  const { strings } = useLang();
  const s = strings.home;
  const pillars = [
    { title: s.espressoBar, body: s.espressoBody },
    { title: s.coldBrew,    body: s.coldBrewBody },
    { title: s.pastries,    body: s.pastriesBody },
  ];
  return (
    <section className="px-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <div style={{ borderTop: "1.5px solid var(--kc-border)", marginBottom: "3.5rem" }} />
        <div className="grid sm:grid-cols-3 gap-10 text-center">
          {pillars.map(({ title, body }) => (
            <div key={title}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--kc-gold)", margin: "0 auto 1rem" }} />
              <h3 className="font-bold text-sm tracking-widest uppercase mb-3"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.12em", color: "var(--kc-black)" }}>
                {title}
              </h3>
              <p className="text-sm" style={{ color: "var(--kc-muted)", lineHeight: 1.75 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function HomeFooter() {
  const { strings } = useLang();
  return (
    <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: "1.5px solid var(--kc-border)", color: "var(--kc-muted)" }}>
      © {new Date().getFullYear()} Kai&apos;s Coffee · {strings.home.footer}
    </footer>
  );
}
