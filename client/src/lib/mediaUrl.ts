import { API_URL } from "../services/api";
import { getPlatform, isNativeApp } from "./native";

/**
 * Normalize media URLs so GridFS videos/images always hit the current API host.
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
    if (/\/api\/media\/[a-f0-9]+$/i.test(parsed.pathname)) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
}

function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isNativeApp() && getPlatform() === "ios") return true;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ may report as Macintosh
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** True when this browser can decode MediaRecorder WebM (VP8/VP9). */
export function canPlayWebm(): boolean {
  if (typeof document === "undefined") return false;
  // iOS / WKWebView: no WebM at all.
  if (isIosLike()) return false;

  const probe = document.createElement("video");
  const result =
    probe.canPlayType('video/webm; codecs="vp8,opus"') ||
    probe.canPlayType('video/webm; codecs="vp9,opus"') ||
    probe.canPlayType('video/webm; codecs="vp8,vorbis"') ||
    probe.canPlayType("video/webm");
  return result === "probably" || result === "maybe";
}

/** @deprecated use canPlayWebm / resolvePlaybackCandidates */
export function deviceNeedsMp4(): boolean {
  return !canPlayWebm();
}

function gridFsMp4Url(resolved: string): string | undefined {
  try {
    const parsed = new URL(resolved);
    if (!/\/api\/media\/[a-f0-9]+$/i.test(parsed.pathname)) return undefined;
    parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/mp4`;
    parsed.search = "";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Pick the best playback URL(s).
 * - Android Chrome / desktop: original WebM first (works natively).
 * - iOS / no-WebM: MP4 derivative first.
 * Always provide a fallback when GridFS.
 */
export function resolvePlaybackCandidates(url?: string | null): {
  primary?: string;
  fallback?: string;
} {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return {};

  const mp4 = gridFsMp4Url(resolved);
  if (!mp4) {
    return { primary: resolved };
  }

  if (canPlayWebm()) {
    // Android Chrome + desktop Chrome: play original immediately.
    return { primary: resolved, fallback: mp4 };
  }

  // iOS / Safari / WKWebView: need H.264 MP4.
  return { primary: mp4, fallback: resolved };
}

/** Single URL helper (primary candidate). */
export function resolvePlaybackUrl(url?: string | null): string | undefined {
  return resolvePlaybackCandidates(url).primary;
}
