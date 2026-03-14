"use client";

// Wisps cluster near center (45-55%) to form a coherent rising column.
// Blur radius > half-width so shapes fully dissolve into vapor, not blobs.
//
// Tune:
//   opacity -> rgba alpha in buildGradient() below
//   speed   -> dur value per wisp (higher = slower)
//   rise    -> translateY in @keyframes kc-steam-rise (globals.css)
//   drift   -> dx per wisp (positive = right, negative = left)
//   density -> add or remove WISPS entries
const WISPS = [
  { id: "a", left: "47%", delay: 0.1,  dur: 13, dx:  "9px",  h: 280, w: 18 },
  { id: "b", left: "50%", delay: 4.5,  dur: 16, dx: "-11px", h: 320, w: 14 },
  { id: "c", left: "53%", delay: 2.2,  dur: 12, dx:  "7px",  h: 260, w: 16 },
  { id: "d", left: "44%", delay: 7.8,  dur: 14, dx: "-8px",  h: 290, w: 13 },
  { id: "e", left: "57%", delay: 3.6,  dur: 11, dx:  "10px", h: 270, w: 15 },
  { id: "f", left: "49%", delay: 6.3,  dur: 17, dx: "-6px",  h: 300, w: 12 },
  { id: "g", left: "55%", delay: 1.4,  dur: 15, dx:  "8px",  h: 245, w: 14 },
] as const;

// Gradient fades to transparent at both ends so edges dissolve naturally
// rather than cutting off like a visible shape.
function buildGradient(alpha: number): string {
  const c = `rgba(255,255,255,${alpha})`;
  return `linear-gradient(to top, transparent, ${c} 28%, ${c} 72%, transparent)`;
}

interface HeroSteamProps {
  readonly hasPhoto?: boolean;
}

export default function HeroSteam({ hasPhoto = false }: HeroSteamProps) {
  const gradient = buildGradient(hasPhoto ? 0.52 : 0.42);

  return (
    <>
      {WISPS.map((w) => (
        <div
          key={w.id}
          aria-hidden="true"
          className="kc-steam-wisp"
          style={{
            position:      "absolute",
            bottom:        "20%",
            left:          w.left,
            width:         w.w,
            height:        w.h,
            borderRadius:  "48% 52% 44% 56% / 30% 30% 70% 70%",
            background:    gradient,
            filter:        `blur(${w.w * 2}px)`,
            zIndex:        1,
            pointerEvents: "none",
            "--kc-steam-dx": w.dx,
            animation: `kc-steam-rise ${w.dur}s ease-in-out ${w.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
