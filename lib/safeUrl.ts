/**
 * Returns the URL if it's an absolute http(s) link, otherwise null. Every link and image we
 * render comes from scraped sites, Reddit or an imported file, so a `javascript:` or `data:`
 * URL must never reach an href or src.
 */
export function safeUrl(u: unknown): string | null {
  if (typeof u !== "string") return null;
  try {
    const url = new URL(u.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
