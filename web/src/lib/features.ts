/**
 * Feature flags — read from NEXT_PUBLIC_* env vars at build time.
 * Flip NEXT_PUBLIC_PURCHASES_ENABLED=true to re-enable purchase workflows.
 */
export const PURCHASES_ENABLED =
  process.env.NEXT_PUBLIC_PURCHASES_ENABLED === "true";
