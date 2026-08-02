import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number; // 0 teal, 1 gold, 2 champagne
  size: number;
};

/**
 * Extraordinary login atmosphere —
 * charged particles racing along a magnetic dipole field,
 * with a warping spacetime lattice. Cursor is the dipole core.
 */
export function LoginScienceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45, down: 0 };
    const pulses: { x: number; y: number; t: number }[] = [];
    const COUNT = 280;
    const particles: Particle[] = [];

    function spawn(p?: Particle): Particle {
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (edge === 0) {
        x = Math.random() * w;
        y = -10;
      } else if (edge === 1) {
        x = w + 10;
        y = Math.random() * h;
      } else if (edge === 2) {
        x = Math.random() * w;
        y = h + 10;
      } else {
        x = -10;
        y = Math.random() * h;
      }
      const next: Particle = p ?? {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        hue: 0,
        size: 1,
      };
      next.x = x;
      next.y = y;
      next.vx = (Math.random() - 0.5) * 0.4;
      next.vy = (Math.random() - 0.5) * 0.4;
      next.life = 0.55 + Math.random() * 0.45;
      next.hue = Math.random();
      next.size = 0.8 + Math.random() * 1.8;
      return next;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = "#07121c";
      ctx!.fillRect(0, 0, w, h);
    }

    function colorFor(hue: number, alpha: number) {
      if (hue < 0.45) return `rgba(94, 200, 192, ${alpha})`;
      if (hue < 0.8) return `rgba(212, 176, 106, ${alpha})`;
      return `rgba(240, 224, 184, ${alpha})`;
    }

    /** Dipole-ish magnetic field (2D stand-in) + soft gravity to core */
    function fieldAt(x: number, y: number, cx: number, cy: number, boost: number) {
      const dx = x - cx;
      const dy = y - cy;
      const r2 = dx * dx + dy * dy + 900;
      const r = Math.sqrt(r2);
      // Magnetic-like swirl (perpendicular) + radial falloff
      const swirl = (1.8 + boost * 2.2) * (120 / r2);
      const pull = (0.015 + boost * 0.04) * (80 / r);
      const fx = -dy * swirl - dx * pull;
      const fy = dx * swirl - dy * pull;
      // Secondary fixed pole (bottom-left) for richer ribbons
      const dx2 = x - w * 0.18;
      const dy2 = y - h * 0.72;
      const r22 = dx2 * dx2 + dy2 * dy2 + 1600;
      const swirl2 = 0.55 * (90 / r22);
      return {
        fx: fx - dy2 * swirl2,
        fy: fy + dx2 * swirl2,
        r,
      };
    }

    function onMove(e: PointerEvent) {
      pointer.tx = e.clientX / w;
      pointer.ty = e.clientY / h;
    }

    function onDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("form, a, button, input, label, .luxury-panel")) return;
      pointer.down = 1;
      pulses.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pulses.length > 5) pulses.shift();
      // Inject a burst of particles near the click
      for (let i = 0; i < 28; i++) {
        const p = spawn();
        const a = Math.random() * Math.PI * 2;
        p.x = e.clientX + Math.cos(a) * Math.random() * 30;
        p.y = e.clientY + Math.sin(a) * Math.random() * 30;
        p.vx = Math.cos(a) * (1 + Math.random() * 2);
        p.vy = Math.sin(a) * (1 + Math.random() * 2);
        p.life = 1;
        particles[(Math.random() * particles.length) | 0] = p;
      }
    }

    function onUp() {
      pointer.down = 0;
    }

    // init
    resize();
    for (let i = 0; i < COUNT; i++) particles.push(spawn());

    const start = performance.now();

    function frame(now: number) {
      if (!running) return;
      const t = (now - start) / 1000;

      // Ease pointer for buttery dipole motion
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      const cx = pointer.x * w;
      const cy = pointer.y * h;
      const boost = pointer.down;

      // Trail veil — builds aurora ribbons
      ctx!.fillStyle = "rgba(7, 18, 28, 0.14)";
      ctx!.fillRect(0, 0, w, h);

      // Warped spacetime lattice
      ctx!.save();
      ctx!.strokeStyle = "rgba(157, 176, 192, 0.06)";
      ctx!.lineWidth = 1;
      const gap = 56;
      for (let gx = -gap; gx <= w + gap; gx += gap) {
        ctx!.beginPath();
        for (let y = 0; y <= h; y += 8) {
          const dx = gx - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const bend = 90 * (1 / (dist * 0.02 + 1));
          const x = gx + (dx / dist) * bend;
          if (y === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }
      for (let gy = -gap; gy <= h + gap; gy += gap) {
        ctx!.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const dx = x - cx;
          const dy = gy - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const bend = 90 * (1 / (dist * 0.02 + 1));
          const y = gy + (dy / dist) * bend;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }
      ctx!.restore();

      // Core glow (dipole)
      const core = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 220);
      core.addColorStop(0, `rgba(94, 200, 192, ${0.18 + boost * 0.12})`);
      core.addColorStop(0.35, "rgba(212, 176, 106, 0.08)");
      core.addColorStop(1, "rgba(7, 18, 28, 0)");
      ctx!.fillStyle = core;
      ctx!.fillRect(0, 0, w, h);

      // Field-line hints near core
      ctx!.save();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 0.15;
        ctx!.beginPath();
        for (let s = 0; s < 40; s++) {
          const rr = 18 + s * 7;
          // dipole field line sketch
          const px = cx + Math.cos(ang) * rr * (1 + 0.15 * Math.sin(s * 0.35 + t));
          const py =
            cy +
            Math.sin(ang) * rr * 0.55 +
            Math.cos(ang) * Math.sin(s * 0.2) * 12;
          if (s === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.strokeStyle = i % 2 === 0 ? "rgba(94,200,192,0.12)" : "rgba(212,176,106,0.1)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
      ctx!.restore();

      // Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        const f = fieldAt(p.x, p.y, cx, cy, boost);
        p.vx = p.vx * 0.92 + f.fx * 18;
        p.vy = p.vy * 0.92 + f.fy * 18;
        // speed clamp
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 6.5) {
          p.vx = (p.vx / sp) * 6.5;
          p.vy = (p.vy / sp) * 6.5;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.0018 + sp * 0.00035;

        if (p.life <= 0 || p.x < -40 || p.y < -40 || p.x > w + 40 || p.y > h + 40) {
          spawn(p);
          continue;
        }

        const alpha = Math.min(0.85, 0.25 + p.life * 0.6);
        // streak in direction of motion
        ctx!.strokeStyle = colorFor(p.hue, alpha);
        ctx!.lineWidth = p.size;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(p.x, p.y);
        ctx!.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
        ctx!.stroke();

        if (sp > 2.2) {
          ctx!.fillStyle = colorFor(p.hue, alpha * 0.8);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // Energy pulses from clicks
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pul = pulses[i]!;
        const age = (now - pul.t) / 1400;
        if (age >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const radius = 20 + age * 220;
        const g = ctx!.createRadialGradient(pul.x, pul.y, radius * 0.2, pul.x, pul.y, radius);
        g.addColorStop(0, `rgba(240, 224, 184, ${0.2 * (1 - age)})`);
        g.addColorStop(0.5, `rgba(94, 200, 192, ${0.12 * (1 - age)})`);
        g.addColorStop(1, "rgba(7, 18, 28, 0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(pul.x, pul.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Soft nucleus
      ctx!.beginPath();
      ctx!.arc(cx, cy, 3.5 + boost * 2, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(240, 224, 184, 0.9)";
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(cx, cy, 14 + Math.sin(t * 3) * 2 + boost * 6, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(94, 200, 192, 0.35)";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Vignette — keep login card legible
      const vig = ctx!.createRadialGradient(
        w * 0.5,
        h * 0.48,
        Math.min(w, h) * 0.12,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      vig.addColorStop(0, "rgba(7, 18, 28, 0.05)");
      vig.addColorStop(0.55, "rgba(7, 18, 28, 0.2)");
      vig.addColorStop(1, "rgba(7, 18, 28, 0.72)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
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
