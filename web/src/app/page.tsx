import PublicNav from "@/components/layout/PublicNav";
import { HeroBadge, HeroButtons, HeroText, StampSection, PillarsSection, HomeFooter } from "./HomeContent";
import { optimized } from "@/lib/cloudinary";
import type { PageContent } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Main page (server component — ISR 5 min) ──────────────────────────────────
// Hero heading/subtext come from the CMS (API). Buttons, stamp card, and pillars
// are rendered by client components so useLang() can translate them.
export default async function HomePage() {
  // Raw API values — null means not customised by admin → client falls back to translation string
  let heroImageUrl:  string | null = null;
  let cmsHeading:    string | null = null;
  let cmsSubtext:    string | null = null;
  try {
    const res = await fetch(`${BASE}/page-contents/home`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: PageContent = await res.json();
      heroImageUrl = (data.hero_image_url as string | null) || null;
      cmsHeading   = (data.hero_heading   as string | null) || null;
      cmsSubtext   = (data.hero_subtext   as string | null) || null;
    }
  } catch { /* render with nulls → client uses translation fallbacks */ }

  const hasPhoto = Boolean(heroImageUrl);

  return (
    <div style={{ minHeight: "100svh" }}>
      <PublicNav overlayHero />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "100svh", overflow: "hidden" }}
      >
        {/* Background */}
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimized(heroImageUrl, "f_auto,q_auto,w_1600,c_limit")!}
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

        {hasPhoto && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, rgba(18,10,5,0.08) 0%, rgba(18,10,5,0.45) 50%, rgba(18,10,5,0.72) 100%)", zIndex: 1 }} />
        )}

        {!hasPhoto && (
          <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(to bottom, transparent, var(--kc-bg))", pointerEvents: "none", zIndex: 1 }} />
        )}

        {!hasPhoto && (
          <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
        )}

        {/* Content */}
        <div className="relative flex flex-col items-center" style={{ zIndex: 2, gap: "1rem", marginTop: "-3vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Kai's Coffee"
            style={{ width: "min(260px, 62vw)", height: "auto", filter: hasPhoto ? "drop-shadow(0 4px 18px rgba(0,0,0,0.38))" : undefined, marginBottom: "0.25rem" }}
          />

          <HeroBadge hasPhoto={hasPhoto} />

          {/* Heading + subtext: CMS value if set, otherwise translated default */}
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

      {/* ── Stamp card + pillars + footer — all translated client components ── */}
      <StampSection />
      <PillarsSection />
      <HomeFooter />
    </div>
  );
}
