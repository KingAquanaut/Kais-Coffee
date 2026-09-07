/**
 * Insert Cloudinary transformations into a URL.
 *
 * Non-Cloudinary URLs (old local/S3 images, null) pass through unchanged.
 *
 * @example
 *   optimized(url)                              // f_auto,q_auto
 *   optimized(url, "f_auto,q_auto,w_400")       // resize to 400px
 *   optimized(url, "f_auto,q_auto,c_fill,w_1200,h_600")  // crop
 */
export function optimized(
  url: string | null | undefined,
  transforms = "f_auto,q_auto",
): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return url ?? null;
  return url.replace("/upload/", `/upload/${transforms}/`);
}

/**
 * Normalized crop rectangle stored as metadata alongside an image. All values
 * are fractions (0..1) of the *original* image, so they're resolution- and
 * transform-independent. Matches Cloudinary's fractional c_crop parameters.
 */
export type CropRect = { x: number; y: number; w: number; h: number };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
// Trim trailing zeros so URLs stay short (0.5000 → 0.5, 1.0000 → 1).
const frac = (n: number) => {
  const s = clamp01(n).toFixed(4).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
};

/**
 * Parse a crop rect that was persisted as a JSON string (CMS page_contents
 * stores everything as text). Returns null for missing/blank/malformed values
 * so callers degrade gracefully to the uncropped image.
 */
export function parseCrop(value: string | null | undefined): CropRect | null {
  if (!value) return null;
  try {
    const c = JSON.parse(value) as Partial<CropRect>;
    if (typeof c?.x === "number" && typeof c?.y === "number"
      && typeof c?.w === "number" && typeof c?.h === "number") {
      return { x: c.x, y: c.y, w: c.w, h: c.h };
    }
  } catch { /* malformed → treat as no crop */ }
  return null;
}

/** Build the `c_crop,...` transform component, or null if the crop is unusable. */
export function cropComponent(crop?: CropRect | null): string | null {
  if (!crop) return null;
  const w = clamp01(crop.w);
  const h = clamp01(crop.h);
  if (w <= 0 || h <= 0) return null;
  // A full-frame crop (whole image) is a no-op — skip it so we don't bloat URLs.
  if (crop.x <= 0 && crop.y <= 0 && w >= 1 && h >= 1) return null;
  return `c_crop,x_${frac(crop.x)},y_${frac(crop.y)},w_${frac(w)},h_${frac(h)}`;
}

/**
 * Apply an optional non-destructive crop, then fit transforms, to a Cloudinary
 * URL. When `crop` is null/undefined this is equivalent to optimized() — so it's
 * fully backwards compatible with images that have no crop metadata.
 *
 * @example
 *   cropped(url, null, "f_auto,q_auto,w_360,h_360,c_fill")   // no crop → c_fill
 *   cropped(url, {x:.1,y:0,w:.6,h:.6}, "f_auto,q_auto,w_360,h_360,c_fill")
 *   // → /upload/c_crop,x_0.1,y_0,w_0.6,h_0.6/f_auto,q_auto,w_360,h_360,c_fill/...
 */
export function cropped(
  url: string | null | undefined,
  crop: CropRect | null | undefined,
  fitTransforms = "f_auto,q_auto",
): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return url ?? null;
  const cc = cropComponent(crop);
  const chain = cc ? `${cc}/${fitTransforms}` : fitTransforms;
  return url.replace("/upload/", `/upload/${chain}/`);
}
