import PublicNav from "@/components/layout/PublicNav";
import MenuClient from "./MenuClient";
import type { MenuCategory } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Main page (server component — ISR 5 min) ──────────────────────────────────
export default async function MenuPage() {
  let categories: MenuCategory[] = [];
  try {
    const res = await fetch(`${BASE}/menu/categories`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (res.ok) categories = await res.json();
  } catch { /* render with empty categories */ }

  return (
    <div style={{ minHeight: "100svh" }}>
      <PublicNav />

      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-10 pb-4 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Kai's Coffee"
          style={{ width: "min(380px, 90vw)", height: "auto" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Category tabs, item grid, and loyalty CTA are all in MenuClient
            so they can access useLang() for translations */}
        <MenuClient categories={categories} />
      </div>
    </div>
  );
}
