import { useEffect, useId, useRef, useState } from "react";
import { resolvePlaybackUrl } from "../lib/mediaUrl";

const PLAYING = new Set<HTMLVideoElement>();

function pauseOthers(current: HTMLVideoElement) {
  PLAYING.forEach((el) => {
    if (el !== current && !el.paused) {
      el.pause();
    }
  });
}

/**
 * Solution video player — no autoplay, no blob download.
 * Only one solution video plays at a time across the page.
 */
export function SolutionVideoPlayer({
  src,
  className = "aspect-video w-full max-w-xl rounded-xl border border-gold/20 bg-black",
}: {
  src?: string | null;
  className?: string;
}) {
  const url = resolvePlaybackUrl(src);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const instanceId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onExclusive = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id: string }>).detail;
      if (detail?.id && detail.id !== instanceId) {
        setOpen(false);
        videoRef.current?.pause();
      }
    };
    window.addEventListener("dipsan:solution-video-open", onExclusive);
    return () => {
      window.removeEventListener("dipsan:solution-video-open", onExclusive);
      const el = videoRef.current;
      if (el) PLAYING.delete(el);
    };
  }, [instanceId]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
  }, [open, url]);

  if (!src && !url) {
    return <p className="text-xs text-bronze">No video recorded for this question yet.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("dipsan:solution-video-open", { detail: { id: instanceId } })
          );
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-xs font-semibold text-gold transition hover:bg-gold/20"
      >
        <span aria-hidden className="inline-block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-gold" />
        Play video solution
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
          Now playing
        </p>
        <button
          type="button"
          onClick={() => {
            videoRef.current?.pause();
            setOpen(false);
          }}
          className="text-[11px] font-semibold text-bronze underline underline-offset-2 hover:text-mist"
        >
          Close
        </button>
      </div>
      {loading && !error && (
        <p className="text-xs text-bronze">Loading video…</p>
      )}
      {url && (
        <video
          ref={videoRef}
          src={url}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          className={className}
          onLoadStart={() => setLoading(true)}
          onLoadedData={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onPlay={(e) => {
            const el = e.currentTarget;
            PLAYING.add(el);
            pauseOthers(el);
            setLoading(false);
          }}
          onPause={(e) => {
            PLAYING.delete(e.currentTarget);
          }}
          onEnded={(e) => {
            PLAYING.delete(e.currentTarget);
          }}
          onError={() => {
            setLoading(false);
            setError(
              "Could not play this video. Try again on Wi‑Fi, or ask the teacher to re-save the solution."
            );
          }}
          {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
        />
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-xs text-ember">{error}</p>
          <button
            type="button"
            className="text-xs font-semibold text-gold underline underline-offset-2"
            onClick={() => {
              setError("");
              setLoading(true);
              videoRef.current?.load();
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
