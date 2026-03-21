import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",

  // NOTE: `fallbacks.document` was removed because next-pwa@5 crashes on
  // `precacheFallback` when built with Next.js 16. The /offline page is still
  // reachable offline via the NetworkFirst "pages" runtime cache rule below.

  runtimeCaching: [
    // Google Fonts — cache-first, 1 year
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },

    // Public menu API — network-first with 5 s timeout, 24 h cache
    // Lets the menu page work offline after first load
    {
      urlPattern: /\/api\/v1\/menu\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "menu-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // All other API calls — network only (auth, purchases, admin)
    {
      urlPattern: /\/api\/v1\/.*/i,
      handler: "NetworkOnly",
    },

    // Next.js static chunks — cache-first, immutable
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 256, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },

    // Next.js image optimisation
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-image",
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },

    // Static assets (icons, manifest, images)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|json)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },

    // HTML page navigations — network-first with 3 s timeout, 24 h cache
    // Covers /, /menu, /dashboard, /purchases, /profile
    {
      urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

// Build next/image remotePatterns from the API URL so the same config works
// in development (localhost:8000) and production (api.kaiscoffee.com) without
// code changes — only NEXT_PUBLIC_API_URL needs to differ per environment.
function buildRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const u = new URL(raw);
    return [{
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/storage/**",
    }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default withPWA(nextConfig);
