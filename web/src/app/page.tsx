import PublicNav from "@/components/layout/PublicNav";
import { HeroSection, SpotlightSection, SeasonalSection, StampSection, PillarsSection, HomeFooter, type PillarCms } from "./HomeContent";
import { optimized } from "@/lib/cloudinary";
import type { PageContent, MenuItem } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Main page (server component — ISR 5 min) ──────────────────────────────────
// Hero heading/subtext come from the CMS (API). Buttons, stamp card, and pillars
// are rendered by client components so useLang() can translate them.
// QR detection (?qr=1) is handled client-side to preserve ISR caching.
export default async function HomePage() {
  // Raw API values — null means not customised by admin → client falls back to translation string
  let heroImageUrl:  string | null = null;
  let cmsHeading:    string | null = null;
  let cmsSubtext:    string | null = null;
  let seasonalItems: MenuItem[] = [];
  let promotionalItem: MenuItem | null = null;
  let cmsPillars: [PillarCms, PillarCms, PillarCms] | undefined;
  try {
    const [cmsRes, seasonalRes, promoRes] = await Promise.all([
      fetch(`${BASE}/page-contents/home`, { next: { revalidate: 300 }, headers: { Accept: "application/json" } }),
      fetch(`${BASE}/menu/seasonal`,       { next: { revalidate: 300 }, headers: { Accept: "application/json" } }),
      fetch(`${BASE}/menu/promotional`,    { next: { revalidate: 300 }, headers: { Accept: "application/json" } }),
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
    if (promoRes.ok) {
      // Endpoint returns null when no spotlight is configured.
      const body = await promoRes.json();
      promotionalItem = body && typeof body === "object" ? body as MenuItem : null;
    }
  } catch { /* render with nulls → client uses translation fallbacks */ }

  const heroImageOptimized = heroImageUrl
    ? optimized(heroImageUrl, "f_auto,q_auto,w_1600,c_limit")
    : null;

  return (
    <div style={{ minHeight: "100dvh" }}>
      <PublicNav overlayHero />

      {/* ── Hero — client component handles QR vs normal branching ──── */}
      <HeroSection
        heroImageUrl={heroImageOptimized}
        cmsHeading={cmsHeading}
        cmsSubtext={cmsSubtext}
      />

      {/* ── Single hand-picked spotlight drink (admin-controlled, optional) ── */}
      {promotionalItem && <SpotlightSection item={promotionalItem} />}

      {/* ── Seasonal drinks promotion (hidden when none are toggled) ── */}
      {seasonalItems.length > 0 && <SeasonalSection items={seasonalItems} />}

      {/* ── Stamp card + pillars + footer — all translated client components ── */}
      <StampSection />
      <PillarsSection cms={cmsPillars} />
      <HomeFooter />
    </div>
  );
}
