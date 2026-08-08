import { useEffect, useRef, useState } from "react";
import { deviceNeedsMp4, resolveMediaUrl, resolvePlaybackUrl } from "../lib/mediaUrl";

/**
 * Plays solution videos from GridFS or CDN.
 * Phones/apps request an MP4 derivative (iOS cannot play WebM).
 * Desktop tries native progressive playback, with blob fallback if needed.
 */
export function SolutionVideoPlayer({
  src,
  className = "aspect-video w-full max-w-xl rounded-xl border border-gold/20 bg-black",
}: {
  src?: string | null;
  className?: string;
}) {
  const baseUrl = resolveMediaUrl(src);
  const url = resolvePlaybackUrl(src);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const blobTriedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"stream" | "blob">("stream");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const downloadAsBlob = async (mediaUrl: string) => {
    if (blobTriedRef.current) return;
    blobTriedRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMode("blob");
    setLoading(true);
    setProgress(0);
    setError("");
    setStatus("Downloading video for this device…");
    setPlayUrl(null);
    revokeObjectUrl();

    const response = await fetch(mediaUrl, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "video/mp4,video/*,*/*" },
    });

    if (!response.ok) {
      throw new Error(`Could not download video (HTTP ${response.status}).`);
    }

    const total = Number(response.headers.get("Content-Length") || 0);
    const mime =
      response.headers.get("Content-Type")?.split(";")[0]?.trim() ||
      (deviceNeedsMp4() ? "video/mp4" : "video/webm");

    let blob: Blob;
    if (!response.body) {
      blob = await response.blob();
    } else {
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }
      }
      if (!received) throw new Error("Downloaded video was empty.");
      blob = new Blob(chunks, { type: mime });
    }

    if (!blob.size) throw new Error("Downloaded video was empty.");

    const objectUrl = URL.createObjectURL(blob);
    objectUrlRef.current = objectUrl;
    setPlayUrl(objectUrl);
    setProgress(100);
    setLoading(false);
    setStatus("");
  };

  useEffect(() => {
    abortRef.current?.abort();
    revokeObjectUrl();
    blobTriedRef.current = false;
    setError("");
    setProgress(0);
    setMode("stream");
    setStatus("");

    if (!url) {
      setPlayUrl(null);
      setLoading(false);
      return;
    }

    const isGridFs = /\/api\/media\//i.test(url);
    const needsConvert = deviceNeedsMp4() && /\/mp4$/i.test(new URL(url).pathname);

    if (!isGridFs) {
      setPlayUrl(url);
      setLoading(false);
      setProgress(100);
      return;
    }

    setLoading(true);
    if (needsConvert) {
      setStatus("Preparing mobile-friendly video (first open can take a minute)…");
    }
    setPlayUrl(url);

    const warm = new AbortController();
    abortRef.current = warm;
    void fetch(url, {
      method: "HEAD",
      credentials: "omit",
      cache: "no-store",
      signal: warm.signal,
    }).catch(() => undefined);

    return () => {
      warm.abort();
      revokeObjectUrl();
    };
  }, [url, retryKey]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playUrl) return;

    let settled = false;
    let stallTimer: number | undefined;

    const clear = () => {
      if (stallTimer) window.clearTimeout(stallTimer);
      stallTimer = undefined;
    };

    const markReady = () => {
      settled = true;
      clear();
      setLoading(false);
      setProgress(100);
      setStatus("");
    };

    const tryBlob = (fallbackUrl?: string | null) => {
      const target = fallbackUrl || url;
      if (settled || mode === "blob" || !target || blobTriedRef.current) return;
      clear();
      setLoading(true);
      void downloadAsBlob(target).catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Last resort: try original WebM URL on Android if MP4 path failed.
        if (fallbackUrl !== baseUrl && baseUrl && baseUrl !== target) {
          blobTriedRef.current = false;
          void downloadAsBlob(baseUrl).catch((err2: unknown) => {
            if (err2 instanceof DOMException && err2.name === "AbortError") return;
            setLoading(false);
            setStatus("");
            setError(
              err2 instanceof Error
                ? err2.message
                : "Could not play this video on your phone. Please try again on Wi‑Fi."
            );
          });
          return;
        }
        setLoading(false);
        setStatus("");
        setError(
          err instanceof Error
            ? err.message
            : "Could not play this video on your phone. Please try again on Wi‑Fi."
        );
      });
    };

    const onCanPlay = () => {
      markReady();
      el.play().catch(() => undefined);
    };
    const onPlaying = () => markReady();
    const onError = () => {
      if (mode === "stream") tryBlob(url);
      else {
        setLoading(false);
        setStatus("");
        setError(
          "This video cannot play on your phone yet. Open it once on Wi‑Fi to finish conversion, or ask the teacher to re-save the solution."
        );
      }
    };
    const onWaiting = () => {
      if (mode !== "stream" || settled) return;
      clear();
      stallTimer = window.setTimeout(() => {
        if (!settled && el.readyState < 2) tryBlob(url);
      }, deviceNeedsMp4() ? 20000 : 8000);
    };

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("stalled", onWaiting);

    // First MP4 conversion on Render can be slow — wait longer on mobile.
    stallTimer = window.setTimeout(() => {
      if (!settled && mode === "stream" && el.readyState < 2) tryBlob(url);
    }, deviceNeedsMp4() ? 45000 : 10000);

    return () => {
      clear();
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("stalled", onWaiting);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playUrl, mode, url, baseUrl]);

  if (!src && !url) {
    return <p className="text-xs text-bronze">No video recorded for this question yet.</p>;
  }

  return (
    <div className="w-full">
      {(loading || status) && (
        <div className="mb-2 text-xs text-bronze">
          {status ||
            (mode === "blob"
              ? `Preparing video… ${progress > 0 ? `${progress}%` : ""}`
              : "Starting video…")}
        </div>
      )}
      {playUrl && (
        <video
          key={`${playUrl}-${retryKey}`}
          ref={videoRef}
          src={playUrl}
          controls
          playsInline
          preload="auto"
          controlsList="nodownload"
          className={className}
          // Helps iOS inline playback inside Capacitor / Safari.
          {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
        />
      )}
      {error && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-ember">{error}</p>
          <button
            type="button"
            className="text-xs font-semibold text-gold underline underline-offset-2"
            onClick={() => {
              abortRef.current?.abort();
              setRetryKey((k) => k + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export default SolutionVideoPlayer;
