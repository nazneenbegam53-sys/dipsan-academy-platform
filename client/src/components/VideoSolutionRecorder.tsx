import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui";

type RecMode = "board" | "screen";

interface Props {
  questionLabel: string;
  questionText: string;
  questionImageUrl?: string | null;
  disabled?: boolean;
  onSave: (blob: Blob, durationSeconds: number) => Promise<void>;
}

/**
 * Interactive recorder for per-question video solutions.
 * - Board mode: draw with Apple Pencil / stylus / mouse + mic (ideal for iPad)
 * - Screen mode: capture screen/tab + mic (for external whiteboard apps)
 */
export function VideoSolutionRecorder({
  questionLabel,
  questionText,
  questionImageUrl,
  disabled,
  onSave,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamsRef = useRef<MediaStream[]>([]);
  const startedAt = useRef(0);

  const [mode, setMode] = useState<RecMode>("board");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [penColor, setPenColor] = useState("#5EC8C0");
  const [penSize, setPenSize] = useState(3);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [livePreview, setLivePreview] = useState(false);

  const stopTracks = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      stopTracks();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl, stopTracks]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [recording]);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = Math.max(320, Math.round(parent.clientWidth * 0.62));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Dark board
    ctx.fillStyle = "#0a1622";
    ctx.fillRect(0, 0, w, h);
    // Subtle grid
    ctx.strokeStyle = "rgba(157,176,192,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Question header on board
    ctx.fillStyle = "rgba(212,176,106,0.9)";
    ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(questionLabel, 16, 28);
    ctx.fillStyle = "rgba(232,240,245,0.85)";
    ctx.font = "14px ui-sans-serif, system-ui, sans-serif";
    const lines = wrapText(ctx, questionText.slice(0, 220), w - 32);
    lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 16, 52 + i * 20));
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && cur) {
        lines.push(cur);
        cur = word;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  useEffect(() => {
    resizeCanvas();
    const onResize = () => {
      if (!recording) resizeCanvas();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionLabel, questionText]);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "board" || disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pointerPos(e);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || mode !== "board") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !last.current) return;
    const p = pointerPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize * (e.pressure && e.pressure > 0 ? 0.5 + e.pressure : 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function onPointerUp() {
    drawing.current = false;
    last.current = null;
  }

  function clearBoard() {
    resizeCanvas();
  }

  async function startRecording() {
    setError("");
    setPendingBlob(null);
    setPendingDuration(0);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    try {
      const audio = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamsRef.current.push(audio);

      let videoStream: MediaStream;
      if (mode === "board") {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Drawing board not ready.");
        // Ensure board is painted before capture
        if (!recording) {
          /* keep current drawings */
        }
        videoStream = canvas.captureStream(30);
      } else {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
        });
        videoStream.getVideoTracks().forEach((t) => {
          t.addEventListener("ended", () => {
            if (mediaRecorder.current?.state === "recording") stopRecording();
          });
        });
      }
      streamsRef.current.push(videoStream);

      const combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audio.getAudioTracks(),
      ]);

      const mimeCandidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.current.push(ev.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "video/webm";
        const blob = new Blob(chunks.current, { type });
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        setPendingBlob(blob);
        setPendingDuration(duration);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLivePreview(false);
        if (previewRef.current) {
          previewRef.current.srcObject = null;
          previewRef.current.src = url;
        }
        stopTracks();
      };

      mediaRecorder.current = recorder;
      recorder.start(1000);
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
      setLivePreview(mode === "screen");
      if (mode === "screen" && previewRef.current) {
        previewRef.current.srcObject = videoStream;
        void previewRef.current.play().catch(() => undefined);
      }
    } catch (err: any) {
      stopTracks();
      setError(
        err?.name === "NotAllowedError"
          ? "Permission denied. Allow microphone (and screen share if using Screen mode)."
          : err?.message || "Could not start recording."
      );
    }
  }

  function stopRecording() {
    const rec = mediaRecorder.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setRecording(false);
  }

  async function saveRecording() {
    if (!pendingBlob) return;
    setSaving(true);
    setError("");
    try {
      await onSave(pendingBlob, pendingDuration);
      setPendingBlob(null);
    } catch (err: any) {
      setError(err?.message || "Failed to save video.");
    } finally {
      setSaving(false);
    }
  }

  function discardRecording() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPendingBlob(null);
    setPendingDuration(0);
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={recording || disabled}
          onClick={() => setMode("board")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "board"
              ? "border-gold bg-gold/20 text-champagne"
              : "border-white/15 text-bronze hover:text-mist"
          }`}
        >
          Drawing board
        </button>
        <button
          type="button"
          disabled={recording || disabled}
          onClick={() => setMode("screen")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "screen"
              ? "border-gold bg-gold/20 text-champagne"
              : "border-white/15 text-bronze hover:text-mist"
          }`}
        >
          Screen share
        </button>
        <span className="text-[11px] text-bronze">
          {mode === "board"
            ? "Write with Apple Pencil / stylus while you explain (mic on)."
            : "Share your iPad/screen or tablet app, then narrate."}
        </span>
      </div>

      {mode === "board" && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {["#5EC8C0", "#D4B06A", "#F0E0B8", "#E07A5F", "#e8f0f5"].map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Pen ${c}`}
                onClick={() => setPenColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${
                  penColor === c ? "border-white" : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
            <label className="flex items-center gap-2 text-xs text-bronze">
              Size
              <input
                type="range"
                min={1}
                max={12}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="accent-gold"
              />
            </label>
            <Button type="button" variant="ghost" onClick={clearBoard} disabled={recording}>
              Clear board
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/12 touch-none">
            <canvas
              ref={canvasRef}
              className="block w-full cursor-crosshair touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>
        </div>
      )}

      {questionImageUrl && (
        <img
          src={questionImageUrl}
          alt="Question figure"
          className="max-h-40 rounded-xl border border-white/10"
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <Button type="button" onClick={startRecording} disabled={disabled || saving}>
            ● Start recording
          </Button>
        ) : (
          <Button type="button" variant="danger" onClick={stopRecording}>
            ■ Stop · {mm}:{ss}
          </Button>
        )}
        {recording && (
          <span className="animate-pulse text-xs font-semibold uppercase tracking-wide text-ember">
            Recording
          </span>
        )}
      </div>

      {(livePreview || blobUrl) && (
        <div className="overflow-hidden rounded-2xl border border-gold/20 bg-ink/60">
          <video
            ref={previewRef}
            className="aspect-video w-full bg-black"
            controls={!livePreview}
            muted={livePreview}
            playsInline
            src={blobUrl || undefined}
          />
        </div>
      )}

      {pendingBlob && !recording && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={saveRecording} disabled={saving}>
            {saving ? "Saving…" : `Save recording (${pendingDuration}s)`}
          </Button>
          <Button type="button" variant="ghost" onClick={discardRecording} disabled={saving}>
            Discard
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}
    </div>
  );
}

export default VideoSolutionRecorder;
