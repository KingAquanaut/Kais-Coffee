import PublicNav from "@/components/layout/PublicNav";
import type { PageContent } from "@/lib/api";
import { AboutPageContent } from "./AboutContent";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Main page (server component — ISR 5 min) ──────────────────────────────
// Fetches raw page content (both EN and _es keys) and passes everything to
// AboutPageContent (client component) which picks the right language at render time.
export default async function AboutPage() {
  let content: PageContent = {};
  try {
    const res = await fetch(`${BASE}/page-contents/about`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (res.ok) content = await res.json();
  } catch { /* AboutPageContent falls back to hardcoded defaults */ }

  return (
    <div style={{ minHeight: "100svh" }}>
      <PublicNav />
      <AboutPageContent content={content} />
    </div>
  );
}
