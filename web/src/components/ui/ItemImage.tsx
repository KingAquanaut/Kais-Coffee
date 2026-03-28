import { optimized } from "@/lib/cloudinary";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
};

/**
 * Minimal cup + steam icon shown when no photo is available.
 * Sized relative to the circle so it scales cleanly at any diameter.
 */
function CupIcon({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 46"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.45 }}
    >
      {/* Steam curls */}
      <path d="M13 12 Q15 8 13 4"  stroke="#3a7ca5" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 11 Q22 7 20 3"  stroke="#3a7ca5" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M27 12 Q29 8 27 4"  stroke="#3a7ca5" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Cup body trapezoid */}
      <path
        d="M5 17 L9 41 H31 L35 17 Z"
        fill="#3a7ca5"
        fillOpacity="0.15"
        stroke="#3a7ca5"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Top rim */}
      <line x1="5" y1="17" x2="35" y2="17" stroke="#3a7ca5" strokeWidth="2" strokeLinecap="round"/>
      {/* Subtle liquid surface line */}
      <path d="M9 23 Q20 26 31 23" stroke="#3a7ca5" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** Circular product image — shows a soft cup placeholder if no image URL. */
export default function ItemImage({ name, imageUrl, size = 80, className = "" }: Props) {
  if (imageUrl) {
    return (
      <div
        className={`kc-img-circle relative overflow-hidden ${className}`}
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={optimized(imageUrl, `f_auto,q_auto,w_${size * 2},h_${size * 2},c_fill`)!} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div
      className={`kc-img-placeholder ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #e8f2fa 0%, #c4d9ec 100%)",
        flexShrink: 0,
      }}
      aria-label={name}
    >
      <CupIcon px={Math.round(size * 0.44)} />
    </div>
  );
}
