import { memo, useEffect, useRef } from "react";

/**
 * Lightweight science backdrop for login.
 * Fully pauses the animation loop while form fields are focused so typing stays snappy.
 */
function LoginScienceBgInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let alive = true;
    let formFocused = false;
    let lastPaint = 0;

    const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45 };

    const TEAL = "#5EC8C0";
    const GOLD = "#D4B06A";
    const CHAMP = "#F0E0B8";

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMove(e: PointerEvent) {
      if (formFocused) return;
      pointer.tx = e.clientX / Math.max(1, w);
      pointer.ty = e.clientY / Math.max(1, h);
    }

    function ensureLoop() {
      if (!alive || formFocused || document.hidden || raf) return;
      raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable]")) {
        formFocused = true;
        stopLoop();
      }
    }

    function onFocusOut() {
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        formFocused = Boolean(
          active?.closest?.("input, textarea, select, [contenteditable]")
        );
        if (!formFocused) ensureLoop();
      }, 0);
    }

    function onVisibility() {
      if (document.hidden) stopLoop();
      else ensureLoop();
    }

    function disc(x: number, y: number, r: number, fill: string) {
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = fill;
      ctx!.fill();
    }

    function drawOrbit(cx: number, cy: number, t: number) {
      disc(cx, cy, 6, GOLD);
      for (let i = 0; i < 2; i++) {
        const rx = 36 + i * 18;
        const ry = 14 + i * 6;
        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.rotate(i * 0.9 + t * 0.15);
        ctx!.beginPath();
        ctx!.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx!.strokeStyle = i === 0 ? "rgba(94,200,192,0.45)" : "rgba(212,176,106,0.4)";
        ctx!.lineWidth = 1.4;
        ctx!.stroke();
        const ang = t * (1.1 - i * 0.3) * Math.PI * 2;
        disc(Math.cos(ang) * rx, Math.sin(ang) * ry, 3.5, i === 0 ? TEAL : CHAMP);
        ctx!.restore();
      }
    }

    function drawHelix(cx: number, cy: number, t: number) {
      const pairs = 8;
      const len = Math.min(h * 0.35, 200);
      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = cy - len / 2 + u * len;
        const phase = u * Math.PI * 4 + t;
        const x1 = cx + Math.cos(phase) * 18;
        const x2 = cx + Math.cos(phase + Math.PI) * 18;
        ctx!.strokeStyle = "rgba(94,200,192,0.28)";
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        ctx!.moveTo(x1, y);
        ctx!.lineTo(x2, y);
        ctx!.stroke();
        disc(x1, y, 2.4, TEAL);
        disc(x2, y, 2.4, "#E07A5F");
      }
    }

    resize();
    const start = performance.now();

    function frame(now: number) {
      raf = 0;
      if (!alive || formFocused || document.hidden) return;

      // ~18fps ambience — keeps main thread free for input.
      if (now - lastPaint >= 55) {
        lastPaint = now;
        const t = (now - start) / 1000;
        pointer.x += (pointer.tx - pointer.x) * 0.1;
        pointer.y += (pointer.ty - pointer.y) * 0.1;

        ctx!.fillStyle = "#07121c";
        ctx!.fillRect(0, 0, w, h);

        const wash = ctx!.createRadialGradient(
          pointer.x * w,
          pointer.y * h,
          40,
          w * 0.5,
          h * 0.45,
          Math.max(w, h) * 0.65
        );
        wash.addColorStop(0, "rgba(94,200,192,0.1)");
        wash.addColorStop(0.5, "rgba(212,176,106,0.05)");
        wash.addColorStop(1, "rgba(7,18,28,0)");
        ctx!.fillStyle = wash;
        ctx!.fillRect(0, 0, w, h);

        const narrow = w < 720;
        drawOrbit(w * (narrow ? 0.22 : 0.18), h * 0.28, t);
        drawHelix(w * (narrow ? 0.82 : 0.84), h * 0.62, t);
        drawOrbit(w * (narrow ? 0.78 : 0.8), h * 0.24, t * 0.85);
      }

      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);
    ensureLoop();

    return () => {
      alive = false;
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{ contain: "strict", willChange: "auto" }}
    />
  );
}

export const LoginScienceBg = memo(LoginScienceBgInner);
export default LoginScienceBg;
