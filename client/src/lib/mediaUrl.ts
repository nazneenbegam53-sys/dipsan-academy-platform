import { API_URL } from "../services/api";
import { isNativeApp } from "./native";

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

/** True when this device cannot reliably play MediaRecorder WebM. */
export function deviceNeedsMp4(): boolean {
  if (typeof document === "undefined") return true;

  // Capacitor / installed app WebViews: always use MP4.
  if (isNativeApp()) return true;

  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ can report as Macintosh
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  // Phones (Android Chrome included): prefer MP4 for solution WebMs.
  if (/Android|Mobile|Phone/i.test(ua)) return true;

  const probe = document.createElement("video");
  const webm =
    probe.canPlayType('video/webm; codecs="vp8,opus"') ||
    probe.canPlayType('video/webm; codecs="vp8,vorbis"') ||
    probe.canPlayType("video/webm");
  return !webm;
}

/**
 * Playback URL for solution videos. On phones/apps, request the MP4 derivative
 * (`/api/media/:id/mp4`) because iOS cannot decode WebM.
 */
export function resolvePlaybackUrl(url?: string | null): string | undefined {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return undefined;

  try {
    const parsed = new URL(resolved);
    if (!/\/api\/media\/[a-f0-9]+$/i.test(parsed.pathname)) {
      return resolved;
    }
    if (!deviceNeedsMp4()) return resolved;

    // Dedicated MP4 endpoint (transcodes + caches on first request).
    parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/mp4`;
    parsed.search = "";
    return parsed.toString();
  } catch {
    return resolved;
  }
}
