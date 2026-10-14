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
