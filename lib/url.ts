/**
 * People type "www.ecommercepark.eu", not "https://www.ecommercepark.eu".
 * Demanding the scheme is a pointless thing to fail a form over, so accept what
 * they typed and add it. Returns null for anything that still makes no sense.
 */
export function normaliseUrl(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? value
    : `https://${value.replace(/^\/+/, "")}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Where this instance lives, for links that have to be absolute (magic links,
 * invite emails). Prefers an explicit setting, then the production domain Vercel
 * injects by itself, then the origin of the request being handled — so a fresh
 * deploy sends correct links before anyone has configured anything.
 */
export function siteUrl(requestOrigin?: string | null): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  if (requestOrigin) return requestOrigin.replace(/\/+$/, "");

  return "http://localhost:3000";
}
