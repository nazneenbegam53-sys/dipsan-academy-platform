import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "../lib/mediaUrl";

/**
 * Plays solution videos reliably.
 *
 * MediaRecorder WebM files often hang forever when streamed over HTTP Range
 * from GridFS ("buffering only"). We download the full file, then play a local
 * blob URL — that matches how the teacher preview works after recording.
 */
export function SolutionVideoPlayer({
  src,
  className = "aspect-video w-full max-w-xl rounded-xl border border-gold/20 bg-black",
}: {
  src?: string | null;
  className?: string;
}) {
  const url = resolveMediaUrl(src);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setPlayUrl(null);
      return;
    }

    let cancelled = false;
    const isGridFs = /\/api\/media\//i.test(url);

    // Cloudinary / external CDN can stream normally.
    if (!isGridFs) {
      setPlayUrl(url);
      setLoading(false);
      setProgress(100);
      setError("");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError("");
    setPlayUrl(null);

    (async () => {
      try {
        const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-store" });
        if (!res.ok) throw new Error(`Video download failed (${res.status})`);

        const total = Number(res.headers.get("Content-Length") || 0);
        const reader = res.body?.getReader();
        if (!reader) {
          const blob = await res.blob();
          if (cancelled) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setPlayUrl(objectUrl);
          setProgress(100);
          setLoading(false);
          return;
        }

        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) setProgress(Math.min(99, Math.round((received / total) * 100)));
            else setProgress((p) => Math.min(90, p + 2));
          }
        }

        const mime =
          (res.headers.get("Content-Type") || "").split(";")[0].trim() || "video/webm";
        const blob = new Blob(chunks as BlobPart[], { type: mime.startsWith("video/") ? mime : "video/webm" });
        if (blob.size < 100) throw new Error("Video file is empty or incomplete.");

        if (cancelled) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPlayUrl(objectUrl);
        setProgress(100);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : "Could not load video.");
        // Last resort: try direct URL (may still buffer on some browsers).
        setPlayUrl(url);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div>
      {loading && (
        <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-bronze">
            Loading video… {progress}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {playUrl && (
        <video
          key={playUrl}
          src={playUrl}
          controls
          playsInline
          preload="auto"
          controlsList="nodownload"
          className={className}
          onError={() =>
            setError(
              "Could not play this video. Re-record in Chrome (WebM) or Safari (MP4), then publish again."
            )
          }
        />
      )}
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}
    </div>
  );
}
