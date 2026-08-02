import { useEffect, useRef } from "react";

/**
 * Aesthetic optics / harmonics field for login —
 * Lissajous traces + soft interference ripples.
 * Cursor steers phase and wavelength; form stays clickable above.
 */
export function LoginScienceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.45 });
  const clickRipples = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const start = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMove(e: PointerEvent) {
      pointer.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }

    function onDown(e: PointerEvent) {
      // Ignore presses on the login card / interactive UI
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("form, a, button, input, label, .luxury-panel")) return;
      clickRipples.current.push({
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
      });
      if (clickRipples.current.length > 6) clickRipples.current.shift();
    }

    function drawLissajous(
      cx: number,
      cy: number,
      scaleX: number,
      scaleY: number,
      a: number,
      b: number,
      delta: number,
      t: number,
      color: string,
      alpha: number
    ) {
      ctx!.beginPath();
      const steps = 360;
      for (let i = 0; i <= steps; i++) {
        const u = (i / steps) * Math.PI * 2;
        const x = cx + Math.sin(a * u + delta + t * 0.15) * scaleX;
        const y = cy + Math.sin(b * u + t * 0.11) * scaleY;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = color;
      ctx!.globalAlpha = alpha;
      ctx!.lineWidth = 1.25;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = (now - start) / 1000;
      const px = pointer.current.x;
      const py = pointer.current.y;

      // Soft fade trail for chronograph feel
      ctx!.fillStyle = "rgba(7, 18, 28, 0.18)";
      ctx!.fillRect(0, 0, w, h);

      // Ambient wash
      const g = ctx!.createRadialGradient(
        w * px,
        h * py,
        20,
        w * 0.5,
        h * 0.45,
        Math.max(w, h) * 0.7
      );
      g.addColorStop(0, "rgba(94, 200, 192, 0.05)");
      g.addColorStop(0.45, "rgba(212, 176, 106, 0.03)");
      g.addColorStop(1, "rgba(7, 18, 28, 0)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      // Faint lab grid
      ctx!.strokeStyle = "rgba(157, 176, 192, 0.045)";
      ctx!.lineWidth = 1;
      const step = 48;
      ctx!.beginPath();
      for (let x = 0; x <= w; x += step) {
        ctx!.moveTo(x + ((t * 6) % step), 0);
        ctx!.lineTo(x + ((t * 6) % step), h);
      }
      for (let y = 0; y <= h; y += step) {
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
      }
      ctx!.stroke();

      // Harmonic ratios steered by cursor
      const a = 2 + Math.round(px * 3); // 2..5
      const b = 3 + Math.round(py * 2); // 3..5
      const delta = px * Math.PI;

      const cx = w * 0.5;
      const cy = h * 0.46;
      const sx = Math.min(w, h) * 0.28;
      const sy = Math.min(w, h) * 0.2;

      drawLissajous(cx, cy, sx, sy, a, b, delta, t, "#5EC8C0", 0.35);
      drawLissajous(cx, cy, sx * 0.72, sy * 0.72, a + 1, b, delta + 0.6, t * 0.9, "#D4B06A", 0.28);
      drawLissajous(cx, cy, sx * 1.15, sy * 0.55, 3, 4, t * 0.4, t * 0.7, "#F0E0B8", 0.12);

      // Oscilloscope baseline wave
      ctx!.beginPath();
      const baseY = h * 0.82;
      const amp = 14 + py * 18;
      const freq = 0.012 + px * 0.01;
      for (let x = 0; x <= w; x += 3) {
        const y =
          baseY +
          Math.sin(x * freq + t * 2.2) * amp +
          Math.sin(x * freq * 2.3 + t * 1.4) * (amp * 0.35);
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(94, 200, 192, 0.35)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Soft interference rings from cursor + fixed sources
      const sources = [
        { x: w * 0.22, y: h * 0.3, color: "rgba(94,200,192," },
        { x: w * 0.78, y: h * 0.28, color: "rgba(212,176,106," },
        { x: w * px, y: h * py, color: "rgba(240,224,184," },
      ];
      for (const s of sources) {
        for (let k = 0; k < 5; k++) {
          const r = ((t * 38 + k * 36) % 180) + 10;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx!.strokeStyle = `${s.color}${0.14 - k * 0.018})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }
      }

      // Click ripples
      const nowMs = now;
      clickRipples.current = clickRipples.current.filter((r) => nowMs - r.t < 1600);
      for (const r of clickRipples.current) {
        const age = (nowMs - r.t) / 1600;
        const radius = 12 + age * 160;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(94, 200, 192, ${0.35 * (1 - age)})`;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, radius * 0.55, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(212, 176, 106, ${0.25 * (1 - age)})`;
        ctx!.stroke();
      }

      // Wavelength tick strip
      const stripY = h * 0.9;
      ctx!.fillStyle = "rgba(157, 176, 192, 0.35)";
      ctx!.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx!.fillText(`λ ratio ${a}:${b}`, 24, stripY);
      ctx!.fillText("harmonics · interference", w - 170, stripY);

      // Center vignette so the card stays readable
      const vig = ctx!.createRadialGradient(cx, cy, Math.min(w, h) * 0.15, cx, cy, Math.max(w, h) * 0.65);
      vig.addColorStop(0, "rgba(7, 18, 28, 0)");
      vig.addColorStop(1, "rgba(7, 18, 28, 0.55)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    }

    resize();
    // Seed opaque background once
    ctx.fillStyle = "#07121c";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}

export default LoginScienceBg;
