import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  // Deliberately false. With skipWaiting a new worker activates and claims
  // clients the instant it installs, so it never reaches the "waiting" state —
  // there is no moment at which to ask the user before swapping them onto a new
  // build. Letting it wait is what makes the update prompt possible; the app
  // posts SKIP_WAITING only once the user taps Refresh Now.
  skipWaiting: false,
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

    // Public menu API — network-first with 5 s timeout, 4 h cache.
    // 4 h balances offline resilience (covers a commute or café visit
    // without network) against freshness after admin menu edits.
    {
      urlPattern: /\/api\/v1\/menu\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "menu-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 20, maxAgeSeconds: 4 * 60 * 60 },
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

    // Admin & auth navigations — never cache.
    // These pages carry session-sensitive data, QR scanning, and write
    // operations that must always hit the network.
    {
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        request.mode === "navigate" &&
        (/^\/admin(\/|$)/.test(url.pathname) || /^\/auth(\/|$)/.test(url.pathname)),
      handler: "NetworkOnly",
    },

    // Customer-facing page navigations — network-first with 3 s timeout, 4 h cache.
    // Covers /, /menu, /about, /dashboard, /purchases, /profile, /offline.
    // 4 h keeps pages available offline for a typical visit while ensuring
    // CMS or menu changes propagate within the same business day.
    {
      urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 32, maxAgeSeconds: 4 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

// Build next/image remotePatterns for all image sources:
//   1. Cloudinary — where all uploads now live (res.cloudinary.com)
//   2. API server — kept for backward compat with any old /storage/ URLs
function buildRemotePatterns() {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    // Cloudinary CDN — all new uploads
    {
      protocol: "https" as const,
      hostname: "res.cloudinary.com",
      pathname: "/**",
    },
  ];

  // Legacy: API server /storage/ paths (local dev or old S3 uploads)
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const u = new URL(raw);
    patterns.push({
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/storage/**",
    });
  } catch {
    // ignore malformed URL
  }

  return patterns;
}

/**
 * Short, non-sensitive build identifier shown in the update prompt.
 *
 * Prefers the 7-char commit SHA Vercel exposes at build time, falling back to a
 * UTC build date locally. Deliberately nothing else — no branch, no CI job or
 * environment detail — and it is inlined into the client bundle, so it must
 * stay safe to display publicly.
 */
function buildId(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  return new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId(),
  },
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default withPWA(nextConfig);
