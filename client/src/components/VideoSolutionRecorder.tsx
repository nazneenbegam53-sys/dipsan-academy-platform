import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui";

type RecMode = "board" | "screen";
type DrawTool = "pen" | "eraser" | "line" | "rect" | "circle" | "ellipse" | "triangle";

interface Props {
  disabled?: boolean;
  onSave: (blob: Blob, durationSeconds: number) => Promise<void>;
}

const BOARD_BG = "#0a1622";
const TOOLS: { id: DrawTool; label: string }[] = [
  { id: "pen", label: "Pen" },
  { id: "eraser", label: "Eraser" },
  { id: "line", label: "Line" },
  { id: "rect", label: "Rect" },
  { id: "circle", label: "Circle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
];

/**
 * Interactive recorder for per-question video solutions.
 * Board mode: pen, eraser, shapes, multi-page — Apple Pencil / stylus friendly.
 */
export function VideoSolutionRecorder({
  disabled,
  onSave,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const preShapeSnapshot = useRef<ImageData | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamsRef = useRef<MediaStream[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startedAt = useRef(0);
  const pagesRef = useRef<string[]>([""]);
  const pageIndexRef = useRef(0);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [mode, setMode] = useState<RecMode>("board");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [penColor, setPenColor] = useState("#5EC8C0");
  const [penSize, setPenSize] = useState(3);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const stopTracks = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
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

  // Keep feeding canvas.captureStream while recording — idle canvases produce
  // sparse frames that many browsers fail to decode on playback.
  useEffect(() => {
    if (!recording || mode !== "board") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    const tick = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Touch a no-op pixel so the capture stream keeps emitting frames.
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(0,0,0,0.002)";
        ctx.fillRect(0, 0, 1, 1);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording, mode]);

  function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, pageNo: number) {
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, w, h);
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
    // Page number only — question text/options stay in the panel, not burned into the video.
    ctx.fillStyle = "rgba(157,176,192,0.45)";
    ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`Page ${pageNo}`, 16, 24);
  }

  function getCtx() {
    return canvasRef.current?.getContext("2d") || null;
  }

  function saveCurrentPageToRef() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pagesRef.current[pageIndexRef.current] = canvas.toDataURL("image/png");
  }

  function loadPageFromRef(index: number) {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const { w, h } = sizeRef.current;
    const data = pagesRef.current[index];
    if (!data) {
      paintBackground(ctx, w, h, index + 1);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = data;
  }

  function setupCanvasSize(preserve = false) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    if (preserve) saveCurrentPageToRef();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    // Even CSS + buffer sizes so H.264/mobile MP4 conversion never fails on odd widths.
    const w = Math.max(2, Math.floor(parent.clientWidth / 2) * 2);
    const h = Math.max(340, Math.floor((parent.clientWidth * 0.62) / 2) * 2);
    sizeRef.current = { w, h };
    canvas.width = Math.floor(w * dpr / 2) * 2;
    canvas.height = Math.floor(h * dpr / 2) * 2;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    loadPageFromRef(pageIndexRef.current);
  }

  useEffect(() => {
    pagesRef.current = [""];
    pageIndexRef.current = 0;
    setPageIndex(0);
    setPageCount(1);
    setupCanvasSize(false);
    const onResize = () => {
      if (!recording) setupCanvasSize(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function drawShape(
    ctx: CanvasRenderingContext2D,
    toolKind: DrawTool,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);

    ctx.beginPath();
    if (toolKind === "line") {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    } else if (toolKind === "rect") {
      ctx.rect(x, y, w, h);
    } else if (toolKind === "circle") {
      const r = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    } else if (toolKind === "ellipse") {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (toolKind === "triangle") {
      ctx.moveTo(a.x, b.y);
      ctx.lineTo((a.x + b.x) / 2, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
    }
    ctx.stroke();
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "board" || disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointerPos(e);
    drawing.current = true;
    last.current = p;

    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    if (tool === "pen" || tool === "eraser") {
      shapeStart.current = null;
      preShapeSnapshot.current = null;
      return;
    }

    // Geometric tools: snapshot for live preview
    shapeStart.current = p;
    preShapeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || mode !== "board") return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || !last.current) return;
    const p = pointerPos(e);

    if (tool === "pen" || tool === "eraser") {
      if (tool === "eraser") {
        // Paint board color so pages stay opaque when saved/restored
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = BOARD_BG;
        ctx.lineWidth = Math.max(8, penSize * 4);
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize * (e.pressure && e.pressure > 0 ? 0.5 + e.pressure : 1);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      return;
    }

    if (shapeStart.current && preShapeSnapshot.current) {
      ctx.putImageData(preShapeSnapshot.current, 0, 0);
      drawShape(ctx, tool, shapeStart.current, p);
      last.current = p;
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas && shapeStart.current && tool !== "pen" && tool !== "eraser") {
      const p = pointerPos(e);
      if (preShapeSnapshot.current) ctx.putImageData(preShapeSnapshot.current, 0, 0);
      drawShape(ctx, tool, shapeStart.current, p);
    }
    drawing.current = false;
    last.current = null;
    shapeStart.current = null;
    preShapeSnapshot.current = null;
    // Persist page while recording so page switches keep ink
    saveCurrentPageToRef();
  }

  function clearBoard() {
    const ctx = getCtx();
    const { w, h } = sizeRef.current;
    if (!ctx) return;
    paintBackground(ctx, w, h, pageIndexRef.current + 1);
    pagesRef.current[pageIndexRef.current] = "";
  }

  function goToPage(next: number) {
    if (next < 0 || next >= pagesRef.current.length) return;
    saveCurrentPageToRef();
    pageIndexRef.current = next;
    setPageIndex(next);
    loadPageFromRef(next);
  }

  function addPage() {
    saveCurrentPageToRef();
    pagesRef.current.push("");
    const next = pagesRef.current.length - 1;
    pageIndexRef.current = next;
    setPageCount(pagesRef.current.length);
    setPageIndex(next);
    const ctx = getCtx();
    const { w, h } = sizeRef.current;
    if (ctx) paintBackground(ctx, w, h, next + 1);
  }

  function deleteCurrentPage() {
    if (pagesRef.current.length <= 1) {
      clearBoard();
      return;
    }
    pagesRef.current.splice(pageIndexRef.current, 1);
    const next = Math.min(pageIndexRef.current, pagesRef.current.length - 1);
    pageIndexRef.current = next;
    setPageCount(pagesRef.current.length);
    setPageIndex(next);
    loadPageFromRef(next);
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
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamsRef.current.push(micStream);
      micStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      const source = audioCtx.createMediaStreamSource(micStream);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      const mixedAudio = dest.stream;
      streamsRef.current.push(mixedAudio);

      let videoStream: MediaStream;
      if (mode === "board") {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Drawing board not ready.");
        videoStream = canvas.captureStream(24);
      } else {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 24 },
          audio: true,
        });
        videoStream.getVideoTracks().forEach((t) => {
          t.addEventListener("ended", () => {
            if (mediaRecorder.current?.state === "recording") stopRecording();
          });
        });
      }
      streamsRef.current.push(videoStream);

      const combined = new MediaStream();
      videoStream.getVideoTracks().forEach((t) => combined.addTrack(t));
      mixedAudio.getAudioTracks().forEach((t) => {
        t.enabled = true;
        combined.addTrack(t);
      });
      videoStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
        combined.addTrack(t);
      });

      if (combined.getAudioTracks().length === 0) {
        throw new Error("Microphone audio was not attached. Check mic permission and try again.");
      }
      if (combined.getVideoTracks().length === 0) {
        throw new Error("No video track available to record.");
      }

      const mimeCandidates = [
        // Prefer MP4 when available (Safari / iOS); WebM works in Chrome/Firefox.
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      const mimeType =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
          ? mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || ""
          : "";
      // Lower bitrate → smaller GridFS files → safer on Render free memory.
      const recorder = new MediaRecorder(
        combined,
        mimeType
          ? { mimeType, audioBitsPerSecond: 64000, videoBitsPerSecond: 800_000 }
          : { audioBitsPerSecond: 64000, videoBitsPerSecond: 800_000 }
      );
      chunks.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.current.push(ev.data);
      };
      recorder.onerror = () => {
        setError("Recording failed. Try again with microphone allowed.");
        setRecording(false);
        stopTracks();
      };
      recorder.onstop = () => {
        const rawType = (recorder.mimeType || mimeType || "video/webm").split(";")[0];
        const safeType = rawType.startsWith("video/") ? rawType : "video/webm";
        const blob = new Blob(chunks.current, { type: safeType });
        const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        setPendingBlob(blob);
        setPendingDuration(duration);
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setPreviewKey((k) => k + 1);
        stopTracks();
      };

      mediaRecorder.current = recorder;
      // One complete file (no timeslice) so the WebM/MP4 has proper duration metadata.
      recorder.start();
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
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
      try {
        // Flush final data before stop (needed when start() has no timeslice).
        if (rec.state === "recording") rec.requestData();
      } catch {
        /* ignore */
      }
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
  const cursorClass =
    tool === "eraser" ? "cursor-cell" : tool === "pen" ? "cursor-crosshair" : "cursor-crosshair";

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
            ? "Pen, eraser, shapes, and extra pages — Apple Pencil friendly."
            : "Share your iPad/screen or tablet app, then narrate."}
        </span>
      </div>

      {mode === "board" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                  tool === t.id
                    ? "border-aurora bg-aurora/15 text-aurora"
                    : "border-white/15 text-bronze hover:text-mist"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {tool !== "eraser" &&
              ["#5EC8C0", "#D4B06A", "#F0E0B8", "#E07A5F", "#e8f0f5"].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setPenColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    penColor === c ? "border-white" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            <label className="flex items-center gap-2 text-xs text-bronze">
              {tool === "eraser" ? "Eraser" : "Size"}
              <input
                type="range"
                min={1}
                max={tool === "eraser" ? 20 : 12}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="accent-gold"
              />
            </label>
            <Button type="button" variant="ghost" onClick={clearBoard}>
              Clear page
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze">
              Pages
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={pageIndex <= 0}
              onClick={() => goToPage(pageIndex - 1)}
            >
              ← Prev
            </Button>
            <span className="min-w-[4.5rem] text-center font-mono text-xs text-mist">
              {pageIndex + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => goToPage(pageIndex + 1)}
            >
              Next →
            </Button>
            <Button type="button" variant="accent" onClick={addPage}>
              + Add page
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={deleteCurrentPage}
              disabled={pageCount <= 1}
            >
              Delete page
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/12 touch-none">
            <canvas
              ref={canvasRef}
              className={`block w-full touch-none ${cursorClass}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>
        </div>
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

      {blobUrl && (
        <div className="overflow-hidden rounded-2xl border border-gold/20 bg-ink/60">
          <video
            key={previewKey}
            ref={previewRef}
            className="aspect-video w-full bg-black"
            controls
            playsInline
            preload="auto"
            src={blobUrl}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              v.muted = false;
              v.volume = 1;
            }}
          />
          <p className="px-3 py-2 text-[11px] text-bronze">
            Preview — turn up device volume if needed. Mic audio is included in the recording.
          </p>
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
