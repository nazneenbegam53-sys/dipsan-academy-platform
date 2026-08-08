import { API_URL } from "../services/api";

/**
 * Normalize media URLs so GridFS videos/images always hit the current API host.
 * Older records may store http:// or a stale Render host.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const api = new URL(API_URL, typeof window !== "undefined" ? window.location.origin : undefined);
    const apiOrigin = api.origin;

    if (url.startsWith("/api/media/")) {
      return `${apiOrigin}${url}`;
    }

    const parsed = new URL(url);
    // Rewrite any /api/media/:id URL onto the live API origin (fixes http→https and host drift).
    if (/\/api\/media\/[a-f0-9]+$/i.test(parsed.pathname)) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
}
