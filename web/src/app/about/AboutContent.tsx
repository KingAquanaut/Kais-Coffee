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
  // Portrait aspect (4:5) gives faces more vertical headroom than a square crop —
  // important when admins upload natural portrait photos. Cloudinary g_face still
  // anchors the crop to the detected face center.
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join("") || "—";

  return (
    <div
      className="kc-card kc-team-card overflow-hidden"
      style={{ position: "relative", aspectRatio: "4 / 5" }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimized(photoUrl, "f_auto,q_auto,c_fill,w_480,h_600,g_face")!}
          alt={`Photo of ${name}, ${role}`}
          className="kc-team-img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          className="kc-team-img"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, #e8f2fa 0%, #bcd8ed 60%, #97c0dd 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 7vw, 3.5rem)",
              color: "rgba(58,124,165,0.55)",
              letterSpacing: "0.02em",
            }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Subtle radial vignette to make text legible without flattening the photo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: 1,
          background:
            "linear-gradient(to top, rgba(10,15,25,0.78) 0%, rgba(10,15,25,0.42) 35%, rgba(10,15,25,0.10) 60%, transparent 80%)",
        }}
      />

      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "1.25rem 1.1rem 1.1rem",
          zIndex: 2,
        }}
      >
        <p
          className="font-bold leading-tight"
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)",
            color: "#fff",
            letterSpacing: "0.005em",
          }}
        >
          {name}
        </p>
        <p
          className="mt-1"
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {role}
        </p>
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

// ── Social / Contact section ──────────────────────────────────────────────
const SOCIALS = [
  { key: "social_instagram", label: "Instagram", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  )},
  { key: "social_facebook", label: "Facebook", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  )},
  { key: "social_tiktok", label: "TikTok", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
  )},
  { key: "social_twitter", label: "X / Twitter", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768"/></svg>
  )},
  { key: "social_email", label: "Email", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
  )},
  { key: "social_phone", label: "Phone", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  )},
];

function AboutSocialSection({ content }: { content: PageContent }) {
  const links = SOCIALS
    .map(s => ({ ...s, value: (content[s.key] ?? "") as string }))
    .filter(s => s.value);

  if (links.length === 0) return null;

  return (
    <Section>
      <p className="kc-badge kc-badge-blue mb-4" style={{ display: "inline-flex" }}>Connect with us</p>
      <SectionHeading>Stay in touch.</SectionHeading>
      <div className="flex flex-wrap gap-3 mt-6">
        {links.map(({ key, label, icon, value }) => {
          const href = key === "social_email"
            ? `mailto:${value}`
            : key === "social_phone"
              ? `tel:${value.replace(/[^\d+]/g, "")}`
              : value;
          return (
            <a
              key={key}
              href={href}
              target={key.startsWith("social_email") || key.startsWith("social_phone") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="kc-card kc-lift"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.65rem 1.1rem", textDecoration: "none",
                fontSize: "0.875rem", fontWeight: 600, color: "var(--kc-blue-deep)",
              }}
            >
              {icon}
              {key === "social_email" ? value : key === "social_phone" ? value : label}
            </a>
          );
        })}
      </div>
    </Section>
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
        style={{ minHeight: "min(380px, 70svh)", borderBottom: "1.5px solid var(--kc-border)", overflow: "hidden" }}
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
              width: "min(480px, 85vw)", height: "min(480px, 85vw)", borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.45)",
              zIndex: 0,
            }}
          />
        )}

        <div className="relative flex flex-col items-center gap-4" style={{ zIndex: 2 }}>
          <AboutHeroBadge hasPhoto={Boolean(heroImageUrl)} />
          <h1
            className="text-3xl sm:text-4xl md:text-6xl font-bold"
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

      {/* ── Connect with us ──────────────────────────────────────────── */}
      <AboutSocialSection content={content} />

      <AboutCTA />
      <AboutFooter />
    </>
  );
}
