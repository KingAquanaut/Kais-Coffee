import PublicNav from "@/components/layout/PublicNav";
import { HeroBadge, HeroButtons, HeroText, SeasonalSection, StampSection, PillarsSection, HomeFooter, type PillarCms } from "./HomeContent";
import QrHero from "./QrHero";
import { optimized } from "@/lib/cloudinary";
import type { PageContent, MenuItem } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Main page (server component — ISR 5 min) ──────────────────────────────────
// Hero heading/subtext come from the CMS (API). Buttons, stamp card, and pillars
// are rendered by client components so useLang() can translate them.
// ?qr=1 triggers a conversion-focused hero for QR-code scan visitors.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isQr = params.qr === "1";
  // Raw API values — null means not customised by admin → client falls back to translation string
  let heroImageUrl:  string | null = null;
  let cmsHeading:    string | null = null;
  let cmsSubtext:    string | null = null;
  let seasonalItems: MenuItem[] = [];
  let cmsPillars: [PillarCms, PillarCms, PillarCms] | undefined;
  try {
    const [cmsRes, seasonalRes] = await Promise.all([
      fetch(`${BASE}/page-contents/home`, { next: { revalidate: 300 }, headers: { Accept: "application/json" } }),
      fetch(`${BASE}/menu/seasonal`,       { next: { revalidate: 300 }, headers: { Accept: "application/json" } }),
    ]);
    if (cmsRes.ok) {
      const data: PageContent = await cmsRes.json();
      heroImageUrl = (data.hero_image_url as string | null) || null;
      cmsHeading   = (data.hero_heading   as string | null) || null;
      cmsSubtext   = (data.hero_subtext   as string | null) || null;

      // Extract pillar CMS overrides (if any were saved by admin)
      const p = (n: number): PillarCms => ({
        title:    data[`pillar_${n}_title`]    || null,
        body:     data[`pillar_${n}_body`]     || null,
        title_es: data[`pillar_${n}_title_es`] || null,
        body_es:  data[`pillar_${n}_body_es`]  || null,
      });
      const p1 = p(1), p2 = p(2), p3 = p(3);
      if (p1.title || p2.title || p3.title) {
        cmsPillars = [p1, p2, p3];
      }
    }
    if (seasonalRes.ok) seasonalItems = await seasonalRes.json();
  } catch { /* render with nulls → client uses translation fallbacks */ }

  const hasPhoto = Boolean(heroImageUrl);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <PublicNav overlayHero />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {isQr ? (
        <QrHero />
      ) : (
        <div
          className={`relative flex flex-col items-center text-center px-6 ${hasPhoto ? "justify-end" : "justify-center"}`}
          style={{ minHeight: "100dvh", overflow: "hidden", paddingBottom: hasPhoto ? "5.5rem" : undefined }}
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

          {/* Photo overlay — light at top (faces visible), heavy at bottom (text readable) */}
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
      )}

      {/* ── Seasonal drinks promotion (hidden when none are toggled) ── */}
      {seasonalItems.length > 0 && <SeasonalSection items={seasonalItems} />}

      {/* ── Stamp card + pillars + footer — all translated client components ── */}
      <StampSection />
      <PillarsSection cms={cmsPillars} />
      <HomeFooter />
    </div>
  );
}
