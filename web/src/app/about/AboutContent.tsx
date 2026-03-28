"use client";
// Client components for the About page.
// AboutPageContent is the main body — receives raw PageContent (EN + ES keys)
// and switches between languages based on useLang().
// The smaller named exports (badges, CTA, footer) are also used directly in page.tsx.
import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { optimized } from "@/lib/cloudinary";
import type { PageContent } from "@/lib/api";

// ── Internal layout helpers (client-safe, no hooks) ────────────────────────
function Section({ children, alt }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <section
      className="px-6 py-16 md:py-20"
      style={alt ? { background: "rgba(255,255,255,0.55)" } : undefined}
    >
      <div className="max-w-3xl mx-auto">{children}</div>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl md:text-4xl font-bold mb-5"
      style={{ fontFamily: "var(--font-heading)", lineHeight: 1.15 }}
    >
      {children}
    </h2>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-base md:text-lg leading-relaxed mb-4"
      style={{ color: "var(--kc-muted)", maxWidth: "56ch" }}
    >
      {children}
    </p>
  );
}

function BaristaCard({ name, role, photoUrl }: { name: string; role: string; photoUrl?: string | null }) {
  return (
    <div
      className="kc-card kc-team-card overflow-hidden"
      style={{ position: "relative", aspectRatio: "1 / 1" }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimized(photoUrl, "f_auto,q_auto,c_fill,w_400,h_400,g_face")!}
          alt={name}
          className="kc-team-img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          className="kc-team-img"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, #e8f2fa 0%, #bcd8ed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
            <circle cx="20" cy="14" r="7" stroke="#3a7ca5" strokeWidth="2" fill="rgba(58,124,165,0.12)" />
            <path d="M5 36c0-8.284 6.716-15 15-15s15 6.716 15 15" stroke="#3a7ca5" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)",
          padding: "1.5rem 1rem 1rem",
          zIndex: 1,
        }}
      >
        <p className="font-bold leading-tight" style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "#fff" }}>
          {name}
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>{role}</p>
      </div>
    </div>
  );
}

// ── Section badge labels ───────────────────────────────────────────────────
export function OurStoryBadge() {
  const { strings } = useLang();
  return <p className="kc-badge kc-badge-gold mb-4" style={{ display: "inline-flex" }}>{strings.about.ourStory}</p>;
}

export function OurCoffeeBadge() {
  const { strings } = useLang();
  return <p className="kc-badge kc-badge-blue mb-4" style={{ display: "inline-flex" }}>{strings.about.ourCoffee}</p>;
}

export function MeetTheTeamBadge() {
  const { strings } = useLang();
  return <p className="kc-badge kc-badge-muted mb-4" style={{ display: "inline-flex" }}>{strings.about.meetTheTeam}</p>;
}

export function VisitUsBadge() {
  const { strings } = useLang();
  return <p className="kc-badge kc-badge-gold mb-4" style={{ display: "inline-flex" }}>{strings.about.visitUs}</p>;
}

export function AboutHeroBadge({ hasPhoto }: { hasPhoto: boolean }) {
  const { strings } = useLang();
  return (
    <p
      className="kc-badge kc-badge-blue"
      style={hasPhoto ? { color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.15)" } : undefined}
    >
      {strings.about.badge}
    </p>
  );
}

// ── Visit Us cards — location + hours with translated labels ───────────────
export function AboutVisitCards({
  addressLines,
  weekday,
  saturday,
  sunday,
  mapEmbedUrl,
}: {
  addressLines: string[];
  weekday: string;
  saturday: string;
  sunday: string;
  mapEmbedUrl: string;
}) {
  const { strings: { about: s } } = useLang();
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <div className="kc-card p-6">
          <p className="font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>{s.location}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--kc-muted)" }}>
            {addressLines.map((line, i) => (
              <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>
            ))}
          </p>
        </div>
        <div className="kc-card p-6">
          <p className="font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>{s.hours}</p>
          <div className="text-sm" style={{ color: "var(--kc-muted)" }}>
            <div className="flex justify-between mb-1"><span>{s.monFri}</span><span>{weekday}</span></div>
            <div className="flex justify-between mb-1"><span>{s.saturday}</span><span>{saturday}</span></div>
            <div className="flex justify-between"><span>{s.sunday}</span><span>{sunday}</span></div>
          </div>
        </div>
      </div>

      {mapEmbedUrl.includes("/maps/embed") ? (
        <div className="mt-6 rounded-2xl overflow-hidden" style={{ height: 220, border: "1.5px solid var(--kc-border)" }}>
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location map"
          />
        </div>
      ) : (
        <div
          className="mt-6 rounded-2xl overflow-hidden"
          style={{
            height: 220,
            background: "linear-gradient(145deg, #c4d9ec 0%, #d6e8f5 100%)",
            border: "1.5px solid var(--kc-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <p className="text-sm" style={{ color: "var(--kc-muted)", fontStyle: "italic" }}>
            {s.mapComingSoon}
          </p>
        </div>
      )}
    </>
  );
}

// ── Bottom CTA ─────────────────────────────────────────────────────────────
export function AboutCTA() {
  const { strings: { about: s } } = useLang();
  return (
    <section className="px-6 pb-24">
      <div className="max-w-xl mx-auto kc-card kc-lift p-8 text-center">
        <span className="kc-badge kc-badge-gold" style={{ marginBottom: "1rem", display: "inline-flex" }}>
          {s.stampBadge}
        </span>
        <h2 className="text-2xl font-bold mt-3" style={{ fontFamily: "var(--font-heading)" }}>
          {s.stampTitle}
        </h2>
        <p className="mt-3 text-sm" style={{ color: "var(--kc-muted)", lineHeight: 1.7 }}>
          {s.stampBody}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/auth/register" className="kc-btn kc-btn-gold">{s.joinRewards}</Link>
          <Link href="/menu" className="kc-btn kc-btn-outline">{s.viewMenu}</Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
export function AboutFooter() {
  const { strings: { about: s } } = useLang();
  return (
    <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: "1.5px solid var(--kc-border)", color: "var(--kc-muted)" }}>
      © {new Date().getFullYear()} Kai&apos;s Coffee · {s.footer}
    </footer>
  );
}

// ── Main CMS content body — switches EN/ES based on active language ─────────
// Receives the full raw PageContent record (including _es keys) from the server.
// DEFAULTS used as final fallback so the page never shows empty text.
const DEFAULTS: Record<string, string> = {
  hero_heading:      "More than a cup of coffee.",
  hero_subtext:      "We believe every visit should feel like a small, quiet pleasure — crafted just for you.",
  story_heading:     "Where it all began.",
  story_body:        "Kai's Coffee started with a single pour-over and a small corner table. What began as a passion project grew into a neighbourhood ritual — a place where regulars are greeted by name and every espresso is pulled with intention. We source single-origin beans from small, ethical farms and roast them to bring out the best of what the land has to offer.\n\nOur goal has always been simple: make something worth coming back for, every single day.",
  coffee_heading:    "Sourced with care, made with precision.",
  coffee_card_1_title: "Espresso",
  coffee_card_1_body:  "Single-origin beans, dialled in daily. Dark chocolate and hazelnut notes with a clean, bright finish.",
  coffee_card_2_title: "Cold Brew",
  coffee_card_2_body:  "18-hour cold steep. Nitrogen on tap. Smooth, never bitter — perfect for warm afternoons.",
  coffee_card_3_title: "Seasonal Drinks",
  coffee_card_3_body:  "Rotating specials that follow what's fresh: honey lavender lattes, spiced autumn blends, and more.",
  team_heading:      "The people behind your cup.",
  team_subtext:      "Our baristas are trained extensively — not just in technique, but in hospitality. They remember your order, your name, and whether you take oat milk. They make Kai's what it is.",
  visit_heading:     "Where to find us.",
  location_address:        "123 Roastery Lane\nYour City, ST 00000",
  location_hours_weekday:  "7 am – 6 pm",
  location_hours_saturday: "8 am – 5 pm",
  location_hours_sunday:   "9 am – 3 pm",
  location_map_embed:      "",
};

export function AboutPageContent({ content }: { content: PageContent }) {
  const { lang } = useLang();

  // Pick the right value: ES override → EN value → hardcoded default
  const val = (key: string): string => {
    if (lang === "es") {
      const esVal = content[`${key}_es`];
      if (esVal) return esVal as string;
    }
    const enVal = content[key];
    if (enVal) return enVal as string;
    return DEFAULTS[key] ?? "";
  };

  const storyParagraphs = val("story_body").split(/\n\n+/).filter(Boolean);

  const coffeeCards = [1, 2, 3]
    .map(n => ({ title: val(`coffee_card_${n}_title`), body: val(`coffee_card_${n}_body`) }))
    .filter(card => card.title);

  const teamMembers = [1, 2, 3]
    .map(n => ({
      name: val(`team_member_${n}_name`),
      role: val(`team_member_${n}_role`),
      photoUrl: (content[`team_member_${n}_photo_url`] ?? null) as string | null,
    }))
    .filter(m => m.name);

  const addressLines = val("location_address").split("\n").filter(Boolean);
  const heroImageUrl = (content.hero_image_url ?? null) as string | null;

  return (
    <>
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: 380, borderBottom: "1.5px solid var(--kc-border)", overflow: "hidden" }}
      >
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimized(heroImageUrl, "f_auto,q_auto,w_1600,c_limit")!}
            alt="About hero"
            className="kc-hero-bg-motion"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          />
        ) : (
          <div
            className="kc-hero-bg-motion"
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(160deg, #bcd8ed 0%, #d6e8f5 60%, #e8f3fa 100%)",
              zIndex: 0,
            }}
          />
        )}

        {heroImageUrl && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1 }} />
        )}

        {!heroImageUrl && (
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 480, height: 480, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.45)",
              zIndex: 0,
            }}
          />
        )}

        <div className="relative flex flex-col items-center gap-4" style={{ zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl ? "/logo-light.svg" : "/logo.svg"}
            alt="Kai's Coffee"
            style={{
              width: "min(260px, 70vw)", height: "auto", marginBottom: "0.5rem",
              filter: heroImageUrl ? "drop-shadow(0 4px 18px rgba(0,0,0,0.38))" : undefined,
            }}
          />
          <AboutHeroBadge hasPhoto={Boolean(heroImageUrl)} />
          <h1
            className="text-4xl md:text-6xl font-bold"
            style={{
              fontFamily: "var(--font-heading)", lineHeight: 1.1, maxWidth: "16ch",
              color: heroImageUrl ? "#fff" : undefined,
            }}
          >
            {val("hero_heading")}
          </h1>
          <p
            className="text-sm md:text-base mt-2"
            style={{
              color: heroImageUrl ? "rgba(255,255,255,0.85)" : "var(--kc-muted)",
              maxWidth: "42ch", lineHeight: 1.7,
            }}
          >
            {val("hero_subtext")}
          </p>
        </div>
      </div>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <Section>
        <OurStoryBadge />
        <SectionHeading>{val("story_heading")}</SectionHeading>
        {storyParagraphs.map((p, i) => <SectionBody key={i}>{p}</SectionBody>)}
      </Section>

      {/* ── Our Coffee ────────────────────────────────────────────────────── */}
      {coffeeCards.length > 0 && (
        <Section alt>
          <OurCoffeeBadge />
          <SectionHeading>{val("coffee_heading")}</SectionHeading>
          <div className="grid sm:grid-cols-3 gap-6 mt-8">
            {coffeeCards.map(({ title, body }) => (
              <div key={title} className="kc-card kc-lift p-5">
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--kc-muted)" }}>{body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Meet the Team ─────────────────────────────────────────────────── */}
      {teamMembers.length > 0 && (
        <Section>
          <MeetTheTeamBadge />
          <SectionHeading>{val("team_heading")}</SectionHeading>
          <SectionBody>{val("team_subtext")}</SectionBody>
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {teamMembers.map(({ name, role, photoUrl }) => (
              <BaristaCard key={name} name={name} role={role} photoUrl={photoUrl} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Where to Find Us ──────────────────────────────────────────────── */}
      <Section alt>
        <VisitUsBadge />
        <SectionHeading>{val("visit_heading")}</SectionHeading>
        <AboutVisitCards
          addressLines={addressLines}
          weekday={val("location_hours_weekday")}
          saturday={val("location_hours_saturday")}
          sunday={val("location_hours_sunday")}
          mapEmbedUrl={val("location_map_embed")}
        />
      </Section>

      <AboutCTA />
      <AboutFooter />
    </>
  );
}
