import { useEffect, useRef } from "react";

/**
 * 2D interactive science background for login —
 * DNA, molecule, orbits, and math glyphs react to the pointer.
 * No WebGL / 3D.
 */
export function LoginScienceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let alive = true;

    const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45 };
    const ripples: { x: number; y: number; t: number }[] = [];

    const TEAL = "#5EC8C0";
    const GOLD = "#D4B06A";
    const CHAMP = "#F0E0B8";
    const EMBER = "#E07A5F";

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMove(e: PointerEvent) {
      pointer.tx = e.clientX / Math.max(1, w);
      pointer.ty = e.clientY / Math.max(1, h);
    }

    function onDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("form, a, button, input, label, .luxury-panel")) return;
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (ripples.length > 8) ripples.shift();
    }

    function disc(x: number, y: number, r: number, fill: string) {
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = fill;
      ctx!.fill();
    }

    function drawDNA(cx: number, cy: number, t: number) {
      const pairs = 16;
      const len = Math.min(h * 0.55, 340);
      const amp = 26;
      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = cy - len / 2 + u * len;
        const phase = u * Math.PI * 5.2 + t * 1.2;
        const x1 = cx + Math.cos(phase) * amp;
        const x2 = cx + Math.cos(phase + Math.PI) * amp;
        ctx!.strokeStyle = "rgba(94,200,192,0.35)";
        ctx!.lineWidth = 1.8;
        ctx!.beginPath();
        ctx!.moveTo(x1, y);
        ctx!.lineTo(x2, y);
        ctx!.stroke();
        disc(x1, y, 3.2, TEAL);
        disc(x2, y, 3.2, EMBER);
      }
      for (const side of [0, Math.PI]) {
        ctx!.beginPath();
        for (let i = 0; i <= 48; i++) {
          const u = i / 48;
          const y = cy - len / 2 + u * len;
          const phase = u * Math.PI * 5.2 + t * 1.2 + side;
          const x = cx + Math.cos(phase) * amp;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = side === 0 ? "rgba(94,200,192,0.7)" : "rgba(224,122,95,0.6)";
        ctx!.lineWidth = 2.2;
        ctx!.stroke();
      }
      ctx!.fillStyle = "rgba(94,200,192,0.7)";
      ctx!.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText("BIOLOGY", cx, cy - len / 2 - 18);
    }

    function drawMolecule(cx: number, cy: number, t: number) {
      const R = 48;
      const atoms: { x: number; y: number; c: string; r: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.4;
        atoms.push({
          x: cx + Math.cos(a) * R,
          y: cy + Math.sin(a) * R,
          c: i % 2 === 0 ? GOLD : TEAL,
          r: 7,
        });
      }
      const satA = t * 0.4;
      atoms.push({ x: cx + Math.cos(satA) * (R + 36), y: cy + Math.sin(satA) * (R + 36), c: EMBER, r: 5.5 });
      atoms.push({
        x: cx + Math.cos(satA + Math.PI) * (R + 36),
        y: cy + Math.sin(satA + Math.PI) * (R + 36),
        c: CHAMP,
        r: 5.5,
      });

      ctx!.strokeStyle = "rgba(240,224,184,0.45)";
      ctx!.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = atoms[i]!;
        const b = atoms[(i + 1) % 6]!;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
      ctx!.beginPath();
      ctx!.moveTo(atoms[0]!.x, atoms[0]!.y);
      ctx!.lineTo(atoms[6]!.x, atoms[6]!.y);
      ctx!.moveTo(atoms[3]!.x, atoms[3]!.y);
      ctx!.lineTo(atoms[7]!.x, atoms[7]!.y);
      ctx!.strokeStyle = "rgba(224,122,95,0.45)";
      ctx!.stroke();

      for (const a of atoms) {
        disc(a.x, a.y, a.r + 5, a.c === GOLD ? "rgba(212,176,106,0.15)" : "rgba(94,200,192,0.12)");
        disc(a.x, a.y, a.r, a.c);
      }
      ctx!.fillStyle = "rgba(212,176,106,0.75)";
      ctx!.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText("CHEMISTRY", cx, cy - R - 40);
    }

    function drawPhysics(cx: number, cy: number, t: number) {
      // Atom nucleus + electron orbits
      disc(cx, cy - 8, 8, GOLD);
      disc(cx, cy - 8, 3, CHAMP);
      const orbits = [
        { rx: 42, ry: 16, speed: 1.2, color: TEAL },
        { rx: 62, ry: 24, speed: -0.75, color: GOLD },
        { rx: 82, ry: 32, speed: 0.5, color: CHAMP },
      ];
      for (let i = 0; i < orbits.length; i++) {
        const o = orbits[i]!;
        ctx!.save();
        ctx!.translate(cx, cy - 8);
        ctx!.rotate(i * 0.85 + t * 0.12);
        ctx!.beginPath();
        ctx!.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx!.strokeStyle =
          o.color === TEAL
            ? "rgba(94,200,192,0.55)"
            : o.color === GOLD
              ? "rgba(212,176,106,0.5)"
              : "rgba(240,224,184,0.4)";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        const ang = t * o.speed * Math.PI * 2;
        disc(Math.cos(ang) * o.rx, Math.sin(ang) * o.ry, 4, o.color);
        ctx!.restore();
      }

      // Pendulum (classic mechanics)
      const pivotX = cx + 100;
      const pivotY = cy - 50;
      const swing = Math.sin(t * 1.8) * 0.55;
      const plen = 70;
      const bobX = pivotX + Math.sin(swing) * plen;
      const bobY = pivotY + Math.cos(swing) * plen;
      disc(pivotX, pivotY, 3, CHAMP);
      ctx!.strokeStyle = "rgba(240,224,184,0.55)";
      ctx!.lineWidth = 1.6;
      ctx!.beginPath();
      ctx!.moveTo(pivotX, pivotY);
      ctx!.lineTo(bobX, bobY);
      ctx!.stroke();
      disc(bobX, bobY, 8, TEAL);
      disc(bobX, bobY, 14, "rgba(94,200,192,0.15)");

      // Traveling sine wave
      ctx!.beginPath();
      const waveY = cy + 78;
      const waveX0 = cx - 90;
      for (let i = 0; i <= 120; i++) {
        const x = waveX0 + i * 1.7;
        const y = waveY + Math.sin(i * 0.14 + t * 3) * 12;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(94,200,192,0.65)";
      ctx!.lineWidth = 1.8;
      ctx!.stroke();

      // Force vector F →
      const fx = cx - 70;
      const fy = cy + 40;
      ctx!.strokeStyle = "rgba(224,122,95,0.75)";
      ctx!.fillStyle = "rgba(224,122,95,0.85)";
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(fx, fy);
      ctx!.lineTo(fx + 50, fy);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(fx + 50, fy);
      ctx!.lineTo(fx + 42, fy - 5);
      ctx!.lineTo(fx + 42, fy + 5);
      ctx!.closePath();
      ctx!.fill();
      ctx!.font = "600 11px ui-monospace, monospace";
      ctx!.fillText("F = ma", fx, fy - 10);

      // Photon tick
      const phx = cx + 70 + Math.cos(t * 2) * 20;
      const phy = cy - 70 + Math.sin(t * 2) * 8;
      ctx!.strokeStyle = "rgba(240,224,184,0.7)";
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(phx - 14, phy);
      ctx!.lineTo(phx + 14, phy);
      ctx!.moveTo(phx + 8, phy);
      ctx!.lineTo(phx + 14, phy - 5);
      ctx!.moveTo(phx + 8, phy);
      ctx!.lineTo(phx + 14, phy + 5);
      ctx!.stroke();

      ctx!.fillStyle = "rgba(240,224,184,0.9)";
      ctx!.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText("PHYSICS", cx, cy - 100);
    }

    function drawMath(cx: number, cy: number, t: number) {
      // golden spiral
      ctx!.beginPath();
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const ang = u * Math.PI * 3 + t * 0.25;
        const rad = 5 * Math.pow(1.22, u * 9);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(212,176,106,0.65)";
      ctx!.lineWidth = 1.8;
      ctx!.stroke();

      // hex wire
      ctx!.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.5;
        const x = cx + Math.cos(a) * 36;
        const y = cy + Math.sin(a) * 36;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(94,200,192,0.5)";
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      ctx!.fillStyle = "rgba(240,224,184,0.55)";
      ctx!.font = "15px Georgia, serif";
      const glyphs = ["∑", "π", "∞", "∫", "Δ"];
      for (let i = 0; i < glyphs.length; i++) {
        const a = t * 0.55 + (i / glyphs.length) * Math.PI * 2;
        ctx!.fillText(glyphs[i]!, cx + Math.cos(a) * 58 - 5, cy + Math.sin(a) * 34 + 5);
      }

      ctx!.fillStyle = "rgba(212,176,106,0.75)";
      ctx!.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText("MATHEMATICS", cx, cy + 78);
    }

    function drawLink(ax: number, ay: number, bx: number, by: number, t: number, color: string) {
      const mx = (ax + bx) / 2 + Math.sin(t * 2 + ax * 0.01) * 18;
      const my = (ay + by) / 2 + Math.cos(t * 1.5 + ay * 0.01) * 14;
      ctx!.beginPath();
      ctx!.moveTo(ax, ay);
      ctx!.quadraticCurveTo(mx, my, bx, by);
      ctx!.strokeStyle = color;
      ctx!.globalAlpha = 0.3;
      ctx!.lineWidth = 1.4;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
      const u = (t * 0.4 + ax * 0.001) % 1;
      const px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx;
      const py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by;
      disc(px, py, 2.5, color);
    }

    resize();
    const start = performance.now();

    function frame(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;

      const px = (pointer.x - 0.5) * 36;
      const py = (pointer.y - 0.5) * 24;

      ctx!.fillStyle = "#07121c";
      ctx!.fillRect(0, 0, w, h);

      const wash = ctx!.createRadialGradient(
        pointer.x * w,
        pointer.y * h,
        30,
        w * 0.5,
        h * 0.45,
        Math.max(w, h) * 0.7
      );
      wash.addColorStop(0, "rgba(94,200,192,0.12)");
      wash.addColorStop(0.45, "rgba(212,176,106,0.06)");
      wash.addColorStop(1, "rgba(7,18,28,0)");
      ctx!.fillStyle = wash;
      ctx!.fillRect(0, 0, w, h);

      // soft grid that bends slightly toward cursor
      ctx!.strokeStyle = "rgba(157,176,192,0.05)";
      ctx!.lineWidth = 1;
      const gap = 52;
      for (let x = 0; x < w; x += gap) {
        ctx!.beginPath();
        for (let y = 0; y <= h; y += 10) {
          const dx = x - pointer.x * w;
          const dy = y - pointer.y * h;
          const d = Math.sqrt(dx * dx + dy * dy) + 1;
          const bend = 40 / (d * 0.025 + 1);
          const xx = x + (dx / d) * bend;
          if (y === 0) ctx!.moveTo(xx, y);
          else ctx!.lineTo(xx, y);
        }
        ctx!.stroke();
      }

      const narrow = w < 720;
      // Physics sits top-left — clear of the centered login card
      const phys = {
        x: w * (narrow ? 0.28 : 0.2) + px * 0.55,
        y: h * (narrow ? 0.2 : 0.22) + py * 0.35,
      };
      const bio = {
        x: w * (narrow ? 0.18 : 0.14) + px * 0.7,
        y: h * (narrow ? 0.62 : 0.58) + py * 0.45,
      };
      const chem = {
        x: w * (narrow ? 0.8 : 0.84) + px * 0.55,
        y: h * (narrow ? 0.26 : 0.3) + py * 0.4,
      };
      const math = {
        x: w * (narrow ? 0.76 : 0.8) + px * 0.5,
        y: h * (narrow ? 0.72 : 0.7) + py * 0.45,
      };

      drawLink(phys.x, phys.y, bio.x, bio.y, t, TEAL);
      drawLink(phys.x, phys.y, chem.x, chem.y, t, GOLD);
      drawLink(chem.x, chem.y, math.x, math.y, t, CHAMP);
      drawLink(bio.x, bio.y, math.x, math.y, t, "rgba(224,122,95,0.7)");

      drawDNA(bio.x, bio.y, t);
      drawMolecule(chem.x, chem.y, t);
      drawMath(math.x, math.y, t);
      drawPhysics(phys.x, phys.y, t);

      // formula dust near cursor
      ctx!.fillStyle = "rgba(240,224,184,0.22)";
      ctx!.font = "11px ui-monospace, monospace";
      const dust = ["E=mc²", "F=ma", "H₂O", "πr²", "ΔG", "DNA"];
      for (let i = 0; i < dust.length; i++) {
        const a = t * 0.3 + i;
        const dx = pointer.x * w + Math.cos(a) * (90 + i * 18);
        const dy = pointer.y * h + Math.sin(a * 1.3) * (60 + i * 12);
        ctx!.globalAlpha = 0.2 + 0.15 * Math.sin(t + i);
        ctx!.fillText(dust[i]!, dx, dy);
      }
      ctx!.globalAlpha = 1;

      // click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]!;
        const age = (now - r.t) / 1200;
        if (age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, 12 + age * 120, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(94,200,192,${0.4 * (1 - age)})`;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
      }

      // vignette — keep corners brighter so science emblems stay visible
      const vig = ctx!.createRadialGradient(
        w * 0.5,
        h * 0.48,
        Math.min(w, h) * 0.08,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      vig.addColorStop(0, "rgba(7,18,28,0.45)");
      vig.addColorStop(0.45, "rgba(7,18,28,0.22)");
      vig.addColorStop(1, "rgba(7,18,28,0.55)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
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
