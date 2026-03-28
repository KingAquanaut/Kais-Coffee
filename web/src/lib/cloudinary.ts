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
