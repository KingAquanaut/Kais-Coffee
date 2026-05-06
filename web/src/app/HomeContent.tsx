"use client";
// Static sections of the home page that need i18n.
// Receives dynamic API data as props; reads translations client-side.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import ItemImage from "@/components/ui/ItemImage";
import QrHero from "./QrHero";
import type { MenuItem } from "@/lib/api";

// ── Stamp card preview (matches dashboard PointsCard look) ───────────────────
function StampCardPreview({ exampleLabel }: { exampleLabel: string }) {
  const filled = 5;
  const total = 8;
  return (
    <div
      className="kc-card"
      style={{ padding: "1.25rem 1.5rem", maxWidth: 320, margin: "1.75rem auto" }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <span className="kc-badge kc-badge-gold" style={{ fontSize: "0.625rem" }}>
          Digital Stamp Card
        </span>
        <span className="text-xs font-semibold" style={{ color: "var(--kc-muted)" }}>
          {filled} / {total}
        </span>
      </div>

      {/* Stamp grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.65rem" }}>
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < filled;
          const isFinal = i === total - 1;
          return (
            <div
              key={i}
              style={{
                width: "100%", aspectRatio: "1", borderRadius: "50%",
                background: isFilled ? "var(--kc-gold-lt)" : "var(--kc-bg)",
                border: isFilled ? "2px solid var(--kc-gold)" : "2px dashed var(--kc-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
              }}
            >
              {isFilled ? "☕" : isFinal ? (
                <span style={{ fontSize: "0.5rem", fontWeight: 900, letterSpacing: "0.04em", color: "var(--kc-muted)", fontFamily: "var(--font-heading)", lineHeight: 1 }}>FREE</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Example label */}
      <p className="text-xs mt-3 text-center" style={{ color: "var(--kc-muted)" }}>
        {exampleLabel}
      </p>
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
  const { user } = useAuth();
  const loggedIn = Boolean(user);
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
        href={loggedIn ? "/dashboard" : "/auth/register"}
        className="kc-btn kc-btn-outline px-8 py-3 text-sm"
        style={hasPhoto ? {
          borderColor: "rgba(255,255,255,0.52)",
          color: "#fff",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        } : undefined}
      >
        {loggedIn ? strings.nav.myRewards : strings.home.joinRewards}
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

// ── Hero section — client-side QR branching (preserves ISR on server) ────────
// Reads ?qr=1 via useSearchParams so the server component never touches
// searchParams and stays on the ISR/static path.
type HeroSectionProps = {
  heroImageUrl: string | null;
  cmsHeading: string | null;
  cmsSubtext: string | null;
};

function HeroSwitchInner({ heroImageUrl, cmsHeading, cmsSubtext }: HeroSectionProps) {
  const params = useSearchParams();
  const isQr = params.get("qr") === "1";

  if (isQr) return <QrHero />;
  return <DefaultHero heroImageUrl={heroImageUrl} cmsHeading={cmsHeading} cmsSubtext={cmsSubtext} />;
}

export function HeroSection(props: HeroSectionProps) {
  // Suspense boundary required by Next.js when useSearchParams is used —
  // fallback renders the normal hero so there's never a blank screen.
  return (
    <Suspense fallback={<DefaultHero {...props} />}>
      <HeroSwitchInner {...props} />
    </Suspense>
  );
}

// ── Default (non-QR) hero ────────────────────────────────────────────────────
function DefaultHero({ heroImageUrl, cmsHeading, cmsSubtext }: HeroSectionProps) {
  const hasPhoto = Boolean(heroImageUrl);
  return (
    <div
      className={`relative flex flex-col items-center text-center px-6 ${hasPhoto ? "justify-end" : "justify-center"}`}
      style={{ minHeight: "100dvh", overflow: "hidden", paddingBottom: hasPhoto ? "5.5rem" : undefined }}
    >
      {/* Background */}
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl!}
          alt=""
          aria-hidden="true"
          className="kc-hero-bg-motion"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
      ) : (
        <div
          className="kc-hero-bg-motion"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, rgba(196,217,236,0.72) 0%, rgba(214,232,245,0.58) 55%, rgba(229,240,248,0.30) 100%)",
            zIndex: 0,
          }}
        />
      )}

      {/* Photo overlay */}
      {hasPhoto && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(18,10,5,0.05) 0%, rgba(18,10,5,0.15) 35%, rgba(18,10,5,0.55) 65%, rgba(18,10,5,0.78) 100%)", zIndex: 1 }} />
      )}

      {!hasPhoto && (
        <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(to bottom, transparent, var(--kc-bg))", pointerEvents: "none", zIndex: 1 }} />
      )}

      {!hasPhoto && (
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(640px, 90vw)", height: "min(640px, 90vw)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 2, gap: hasPhoto ? "0.75rem" : "1rem", marginTop: hasPhoto ? undefined : "-3vh" }}>
        <HeroBadge hasPhoto={hasPhoto} />
        <HeroText cmsHeading={cmsHeading} cmsSubtext={cmsSubtext} hasPhoto={hasPhoto} />
        <HeroButtons hasPhoto={hasPhoto} />
      </div>

      {/* Scroll chevron */}
      <div className="absolute" style={{ bottom: "2.25rem", left: "50%", transform: "translateX(-50%)", zIndex: 2 }} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M5 8l5 5 5-5" stroke={hasPhoto ? "rgba(255,255,255,0.42)" : "rgba(26,26,26,0.28)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Spotlight (single hand-picked promotional drink) ─────────────────────────
// Admin-controlled via /admin/menu → "Home-page spotlight". Renders a polished
// hero card with image, name, description, price, and a CTA to the menu.
// Falls back gracefully (component is not rendered at all) when no spotlight
// is configured — the page above just skips it.
export function SpotlightSection({ item }: { item: MenuItem }) {
  const { lang, strings } = useLang();
  const variants = item.active_variants ?? item.variants ?? [];
  const name = (lang === "es" && item.name_es) ? item.name_es : item.name;
  const description = (lang === "es" && item.description_es) ? item.description_es : item.description;
  // Use the first (admin-ordered) variant as the headline price when sizes exist,
  // so admins control which size is featured rather than always showing the cheapest.
  const priceNum = variants.length > 0
    ? Number.parseFloat(variants[0].price)
    : Number.parseFloat(item.price);
  const priceLabel = `$${priceNum.toFixed(2)}`;

  return (
    <section className="px-6 pt-20 pb-6">
      <div className="max-w-3xl mx-auto">
        <div
          className="kc-card kc-lift overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #fff 0%, var(--kc-cream) 100%)",
            border: "1.5px solid var(--kc-gold-lt)",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          <div
            className="grid items-center gap-6 p-6 sm:p-8"
            style={{ gridTemplateColumns: "minmax(120px, 200px) minmax(0, 1fr)" }}
          >
            {/* Image */}
            <div className="flex items-center justify-center">
              <ItemImage name={name} imageUrl={item.image_url} size={180} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex flex-col gap-3">
              <span
                className="kc-badge"
                style={{
                  background: "linear-gradient(135deg, #f0dcaa 0%, #d4a84b 100%)",
                  color: "#fff",
                  fontSize: "0.6875rem",
                  padding: "0.2rem 0.85rem",
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  boxShadow: "0 2px 8px rgba(184,150,46,0.25)",
                }}
              >
                ✦ {strings.home.spotlightBadge}
              </span>
              <h2
                className="font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-script)",
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  color: "var(--kc-blue-deep)",
                }}
              >
                {name}
              </h2>
              {description && (
                <p
                  className="text-sm sm:text-base"
                  style={{ color: "var(--kc-muted)", lineHeight: 1.7, maxWidth: "52ch" }}
                >
                  {description}
                </p>
              )}
              <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                <p className="font-bold" style={{ fontSize: "1.05rem", color: "var(--kc-gold)" }}>
                  {priceLabel}
                </p>
                <Link href="/menu" className="kc-btn kc-btn-gold kc-btn-sm">
                  {strings.home.spotlightCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Seasonal drinks promotion ─────────────────────────────────────────────────
export function SeasonalSection({ items }: { items: MenuItem[] }) {
  const { lang, strings } = useLang();
  const s = strings.home;

  return (
    <section className="px-6 pt-16 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span
            className="kc-badge"
            style={{
              background: "linear-gradient(135deg, #f0dcaa 0%, #d4a84b 100%)",
              color: "#fff",
              fontSize: "0.6875rem",
              padding: "0.2rem 0.85rem",
              display: "inline-flex",
              marginBottom: "1rem",
              boxShadow: "0 2px 8px rgba(184,150,46,0.25)",
            }}
          >
            ✦ {s.seasonalBadge}
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.1 }}
          >
            {s.seasonalTitle}
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--kc-muted)", lineHeight: 1.8 }}>
            {s.seasonalSubtext}
          </p>
        </div>

        {/* Drink cards */}
        <div
          className={`grid gap-5 ${items.length === 1 ? "max-w-xs mx-auto" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          {items.map(item => {
            const name = (lang === "es" && item.name_es) ? item.name_es : item.name;
            const description = (lang === "es" && item.description_es) ? item.description_es : item.description;
            const price = `$${parseFloat(item.price).toFixed(2)}`;
            return (
              <div
                key={item.id}
                className="kc-card kc-lift"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: "linear-gradient(135deg, var(--kc-cream) 0%, #fff 100%)",
                  border: "1.5px solid var(--kc-gold-lt)",
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <ItemImage name={name} imageUrl={item.image_url} size={80} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="font-bold leading-snug"
                    style={{
                      fontFamily: "var(--font-script)",
                      fontSize: "1.1rem",
                      color: "var(--kc-blue-deep)",
                    }}
                  >
                    {name}
                  </p>
                  {description && (
                    <p
                      className="text-xs mt-1"
                      style={{
                        color: "var(--kc-muted)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {description}
                    </p>
                  )}
                  <p className="font-bold mt-1.5" style={{ fontSize: "0.9rem", color: "var(--kc-gold)" }}>
                    {price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link href="/menu" className="kc-btn kc-btn-outline kc-btn-sm">
            {s.seasonalCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Stamp card section ────────────────────────────────────────────────────────
export function StampSection() {
  const { strings } = useLang();
  const { user } = useAuth();
  const loggedIn = Boolean(user);
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
        <StampCardPreview exampleLabel={s.stampExample} />
        <Link href={loggedIn ? "/dashboard" : "/auth/register"} className="kc-btn kc-btn-gold inline-flex">
          {loggedIn ? s.viewMyStamps : s.startCollecting}
        </Link>
      </div>
    </section>
  );
}

// ── Three pillars section ─────────────────────────────────────────────────────
export type PillarCms = { title?: string | null; body?: string | null; title_es?: string | null; body_es?: string | null };
type PillarsProps = { cms?: [PillarCms, PillarCms, PillarCms] };

export function PillarsSection({ cms }: PillarsProps) {
  const { lang, strings } = useLang();
  const s = strings.home;
  const fallbacks = [
    { title: s.espressoBar, body: s.espressoBody },
    { title: s.coldBrew,    body: s.coldBrewBody },
    { title: s.pastries,    body: s.pastriesBody },
  ];
  const pillars = fallbacks.map((fb, i) => {
    const c = cms?.[i];
    if (!c?.title) return fb; // no CMS override for this pillar
    const isEs = lang === "es";
    return {
      title: (isEs && c.title_es) || c.title || fb.title,
      body:  (isEs && c.body_es)  || c.body  || fb.body,
    };
  });
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
