import { useState } from "react";
import { resolveMediaUrl } from "../lib/mediaUrl";

/**
 * Reliable player for GridFS / Cloudinary video solutions.
 * Uses resolved absolute API URLs and shows a clear error if the browser can't decode.
 */
export function SolutionVideoPlayer({
  src,
  className = "aspect-video w-full max-w-xl rounded-xl border border-gold/20 bg-black",
}: {
  src?: string | null;
  className?: string;
}) {
  const url = resolveMediaUrl(src);
  const [error, setError] = useState("");

  if (!url) return null;

  return (
    <div>
      <video
        key={url}
        src={url}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className={className}
        onError={() =>
          setError("Could not play this video. Try Chrome/Safari, or re-record and publish again.")
        }
        onLoadedData={() => setError("")}
      />
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}
    </div>
  );
}
