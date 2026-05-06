"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import ItemImage from "@/components/ui/ItemImage";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import type { MenuCategory, MenuItem, MenuItemVariant } from "@/lib/api";

// Pull the active size variants from the API payload — Laravel serializes
// the `activeVariants` relation as `active_variants`, but we also accept
// the raw `variants` field for admin previews.
function getVariants(item: MenuItem): MenuItemVariant[] {
  return item.active_variants ?? item.variants ?? [];
}

// ── Single item tile — flip card with smoke effect ────────────────────────────
function MenuTile({ item }: { item: MenuItem }) {
  const { lang } = useLang();
  const [flipped, setFlipped] = useState(false);
  const variants = getVariants(item);
  const [activeVariantId, setActiveVariantId] = useState<number | null>(
    variants.length > 0 ? variants[0].id : null,
  );
  const activeVariant = variants.find(v => v.id === activeVariantId) ?? null;
  const displayName = (lang === "es" && item.name_es) ? item.name_es : item.name;
  const displayDescription = (lang === "es" && item.description_es) ? item.description_es : item.description;
  const displayPrice = activeVariant
    ? `$${parseFloat(activeVariant.price).toFixed(2)}`
    : `$${parseFloat(item.price).toFixed(2)}`;
  const hasDescription = Boolean(displayDescription?.trim());

  const toggle = useCallback(() => {
    if (hasDescription) setFlipped(f => !f);
  }, [hasDescription]);

  // Card height is fixed because the front/back panes use position:absolute
  // (required by the 3-D flip transform). When size pills are present we need
  // ~32 extra px so they don't get clipped by the front pane's overflow:hidden.
  const cardHeight = variants.length > 0 ? 252 : 220;

  return (
    <div
      className={`kc-flip-card${flipped ? " is-flipped" : ""}`}
      onClick={toggle}
      style={{ height: cardHeight }}
    >
      {/* Smoke wisps — visible on hover */}
      {hasDescription && (
        <>
          <div className="kc-smoke kc-smoke-1" />
          <div className="kc-smoke kc-smoke-2" />
          <div className="kc-smoke kc-smoke-3" />
          <div className="kc-click-hint">☕ tap</div>
        </>
      )}

      <div className="kc-flip-inner">
        {/* ── Front ── */}
        <div
          className="kc-flip-front kc-menu-tile flex flex-col items-center text-center gap-1.5 px-1 py-3"
          style={{ background: "transparent" }}
        >
          <ItemImage name={displayName} imageUrl={item.image_url} size={120} />
          <h3
            className="mt-2 leading-snug px-1"
            style={{ fontFamily: "var(--font-script)", fontSize: "1.05rem", color: "var(--kc-blue-deep)", fontWeight: 700 }}
          >
            {displayName}
          </h3>
          <p className="font-semibold" style={{ fontSize: "0.875rem", color: "var(--kc-black)" }}>
            {displayPrice}
          </p>
          {variants.length > 0 && (
            <SizePills
              variants={variants}
              activeId={activeVariantId}
              onSelect={setActiveVariantId}
            />
          )}
        </div>

        {/* ── Back — description / recipe ── */}
        {hasDescription && (
          <div
            className="kc-flip-back flex flex-col items-center justify-center text-center p-4"
            style={{
              background: "linear-gradient(145deg, var(--kc-cream) 0%, #fff 100%)",
              border: "1.5px solid var(--kc-gold-lt)",
            }}
          >
            <h3
              className="leading-snug mb-2"
              style={{
                fontFamily: "var(--font-script)",
                fontSize: "1.05rem",
                color: "var(--kc-blue-deep)",
                fontWeight: 700,
              }}
            >
              {displayName}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{
                color: "var(--kc-muted)",
                maxWidth: "90%",
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayDescription}
            </p>
            <p className="font-bold mt-2" style={{ fontSize: "0.875rem", color: "var(--kc-gold)" }}>
              {displayPrice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Size pills (12oz / 16oz) — only rendered when item has variants ─────────
// Pill button uses an explicit line-height so vertical padding renders the
// same on every browser; the wrapper's pb-1 keeps the focus ring clear of
// the parent's overflow:hidden boundary on iOS Safari.
function SizePills({
  variants, activeId, onSelect,
}: {
  variants: MenuItemVariant[];
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5 pb-1">
      {variants.map(v => {
        const active = v.id === activeId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={e => { e.stopPropagation(); onSelect(v.id); }}
            className="rounded-full text-[0.7rem] font-semibold transition-colors"
            style={{
              padding: "3px 10px",
              lineHeight: 1.4,
              background: active ? "var(--kc-blue-deep)" : "rgba(255,255,255,0.85)",
              color: active ? "#fff" : "var(--kc-blue-deep)",
              border: "1px solid var(--kc-blue-deep)",
              letterSpacing: "0.02em",
            }}
            aria-pressed={active}
            aria-label={`${v.size_label} for $${Number.parseFloat(v.price).toFixed(2)}`}
          >
            {v.size_label}
          </button>
        );
      })}
    </div>
  );
}

// ── Interactive menu + loyalty CTA ────────────────────────────────────────────
export default function MenuClient({ categories }: { categories: MenuCategory[] }) {
  const { lang, strings } = useLang();
  const { user } = useAuth();
  const loggedIn = Boolean(user);
  const s = strings.menu;

  const [activeId, setActiveId] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );

  const activeCategory = categories.find(c => c.id === activeId);
  const items: MenuItem[] = activeCategory?.active_items ?? [];
  const isCoffeeCat = activeCategory?.slug?.startsWith("coffee");

  return (
    <>
      {categories.length === 0 ? (
        <p className="text-center py-16" style={{ color: "var(--kc-muted)" }}>
          {s.nothingYet}
        </p>
      ) : (
        <>
          {/* Category selector */}
          <div className="flex gap-2.5 justify-center flex-wrap mt-8 mb-10">
            {categories.map(cat => {
              const active = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className="kc-btn kc-btn-sm"
                  style={{
                    background:    active ? "var(--kc-blue-deep)" : "white",
                    color:         active ? "white" : "var(--kc-blue-deep)",
                    borderColor:   "var(--kc-blue-deep)",
                    fontFamily:    "var(--font-script)",
                    fontSize:      "0.95rem",
                    letterSpacing: "0.02em",
                    padding:       "0.4rem 1.1rem",
                  }}
                >
                  {(lang === "es" && cat.name_es) ? cat.name_es : cat.name}
                </button>
              );
            })}
          </div>

          {/* Coffee notes — shown for Coffee & Lattes category */}
          {isCoffeeCat && (
            <div
              className="mx-auto max-w-xs text-center rounded-2xl px-5 py-3 mb-10"
              style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(58,124,165,0.45)" }}
            >
              <p style={{ fontFamily: "var(--font-script)", fontSize: "1rem", color: "var(--kc-blue-deep)" }}>
                {s.coffeeNotes}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--kc-muted)" }}>
                {s.coffeeExtras}
              </p>
            </div>
          )}

          {/* Items grid */}
          {items.length === 0 ? (
            <p className="text-center py-16" style={{ color: "var(--kc-muted)" }}>
              {s.nothingYet}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:gap-x-6 md:gap-y-8">
              {items.map(item => <MenuTile key={item.id} item={item} />)}
            </div>
          )}

          {/* Divider */}
          <div className="mt-16 mb-10" style={{ borderTop: "1px solid rgba(26,26,26,0.10)" }} />
        </>
      )}

      {/* ── Loyalty CTA ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 sm:p-7 text-center"
        style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid var(--kc-border)" }}
      >
        <span className="kc-badge kc-badge-gold" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>
          {s.stampBadge}
        </span>
        <p className="font-bold text-xl mt-3" style={{ fontFamily: "var(--font-heading)" }}>
          {s.stampTitle}
        </p>
        <p className="text-sm mt-1.5 mb-5" style={{ color: "var(--kc-muted)" }}>
          {s.stampSubtext}
        </p>
        <Link href={loggedIn ? "/dashboard" : "/auth/register"} className="kc-btn">
          {loggedIn ? strings.home.viewMyStamps : s.joinRewards}
        </Link>
      </div>
    </>
  );
}
