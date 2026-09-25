/**
 * Public base URL of the site. Uses NEXT_PUBLIC_SITE_URL when it is a valid
 * URL (a missing "https://" is added), otherwise Vercel's own deployment URL,
 * otherwise localhost. Never throws — a typo here must not take the site down.
 */
export function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const v = raw?.trim().replace(/^["']|["']$/g, "");
    if (!v) continue;
    try {
      const u = new URL(/^https?:\/\//.test(v) ? v : `https://${v}`);
      return u.origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "http://localhost:3000";
}
