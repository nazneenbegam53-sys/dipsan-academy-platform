import { useEffect, useRef } from "react";

/**
 * Eye-catching STEM fusion field for login —
 * Physics orbits, Chemistry molecules, Math geometry, Biology DNA
 * woven into one living scene. Cursor steers the nexus.
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

    const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45 };
    const sparks: { x: number; y: number; vx: number; vy: number; life: number; c: number }[] = [];

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
      ctx!.fillStyle = "#07121c";
      ctx!.fillRect(0, 0, w, h);
    }

    function onMove(e: PointerEvent) {
      pointer.tx = e.clientX / Math.max(1, w);
      pointer.ty = e.clientY / Math.max(1, h);
    }

    function onDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("form, a, button, input, label, .luxury-panel")) return;
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 4;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          c: Math.random(),
        });
      }
    }

    function disc(x: number, y: number, r: number, fill: string) {
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = fill;
      ctx!.fill();
    }

    function ring(x: number, y: number, r: number, stroke: string, lw = 1.5) {
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.strokeStyle = stroke;
      ctx!.lineWidth = lw;
      ctx!.stroke();
    }

    function label(text: string, x: number, y: number, color: string) {
      ctx!.save();
      ctx!.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      const tw = ctx!.measureText(text).width;
      const padX = 10;
      const rw = tw + padX * 2;
      const rh = 18;
      const rx = x - rw / 2;
      const ry = y - rh / 2;
      ctx!.fillStyle = "rgba(7,18,28,0.55)";
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      if (typeof ctx!.roundRect === "function") {
        ctx!.roundRect(rx, ry, rw, rh, 9);
      } else {
        ctx!.rect(rx, ry, rw, rh);
      }
      ctx!.fill();
      ctx!.stroke();
      ctx!.fillStyle = color;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(text, x, y + 0.5);
      ctx!.restore();
    }

    /** Biology — DNA double helix */
    function drawDNA(cx: number, cy: number, t: number, parallax: number) {
      const len = Math.min(h * 0.62, 420);
      const amp = 28;
      const turns = 3.2;
      const pairs = 18;
      ctx!.save();
      ctx!.translate(cx + parallax, cy);
      ctx!.rotate(-0.18);

      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = -len / 2 + u * len;
        const phase = u * turns * Math.PI * 2 + t * 1.1;
        const x1 = Math.cos(phase) * amp;
        const x2 = Math.cos(phase + Math.PI) * amp;
        const z1 = Math.sin(phase);
        const z2 = Math.sin(phase + Math.PI);
        const a1 = 0.35 + (z1 + 1) * 0.3;
        const a2 = 0.35 + (z2 + 1) * 0.3;

        // base pair rung
        ctx!.strokeStyle = `rgba(94, 200, 192, ${0.25 + 0.25 * Math.max(z1, z2)})`;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.moveTo(x1, y);
        ctx!.lineTo(x2, y);
        ctx!.stroke();

        disc(x1, y, 3.2, `rgba(94, 200, 192, ${a1})`);
        disc(x2, y, 3.2, `rgba(224, 122, 95, ${a2})`);
      }

      // backbone ribbons
      for (const side of [0, Math.PI]) {
        ctx!.beginPath();
        for (let i = 0; i <= 60; i++) {
          const u = i / 60;
          const y = -len / 2 + u * len;
          const phase = u * turns * Math.PI * 2 + t * 1.1 + side;
          const x = Math.cos(phase) * amp;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = side === 0 ? "rgba(94,200,192,0.65)" : "rgba(224,122,95,0.55)";
        ctx!.lineWidth = 2.4;
        ctx!.stroke();
      }
      ctx!.restore();
      label("BIOLOGY", cx + parallax, cy - len / 2 - 24, TEAL);
    }

    /** Chemistry — rotating molecule (hex + satellites) */
    function drawMolecule(cx: number, cy: number, t: number, parallax: number) {
      ctx!.save();
      ctx!.translate(cx + parallax, cy);
      ctx!.rotate(t * 0.35);

      const R = 52;
      const atoms: { x: number; y: number; r: number; c: string }[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        atoms.push({
          x: Math.cos(a) * R,
          y: Math.sin(a) * R,
          r: 7,
          c: i % 2 === 0 ? GOLD : TEAL,
        });
      }
      // satellite groups
      atoms.push({ x: R + 34, y: 0, r: 5.5, c: EMBER });
      atoms.push({ x: -(R + 34), y: 8, r: 5.5, c: CHAMP });
      atoms.push({ x: 10, y: -(R + 32), r: 5, c: TEAL });

      // bonds
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
      // double-bond hint on two edges
      for (const i of [0, 3]) {
        const a = atoms[i]!;
        const b = atoms[(i + 1) % 6]!;
        const ox = -(b.y - a.y) * 0.04;
        const oy = (b.x - a.x) * 0.04;
        ctx!.beginPath();
        ctx!.moveTo(a.x + ox, a.y + oy);
        ctx!.lineTo(b.x + ox, b.y + oy);
        ctx!.strokeStyle = "rgba(212,176,106,0.5)";
        ctx!.stroke();
      }
      ctx!.beginPath();
      ctx!.moveTo(atoms[0]!.x, atoms[0]!.y);
      ctx!.lineTo(atoms[6]!.x, atoms[6]!.y);
      ctx!.moveTo(atoms[3]!.x, atoms[3]!.y);
      ctx!.lineTo(atoms[7]!.x, atoms[7]!.y);
      ctx!.moveTo(atoms[4]!.x, atoms[4]!.y);
      ctx!.lineTo(atoms[8]!.x, atoms[8]!.y);
      ctx!.strokeStyle = "rgba(224,122,95,0.45)";
      ctx!.stroke();

      for (const a of atoms) {
        disc(a.x, a.y, a.r + 4, a.c === GOLD ? "rgba(212,176,106,0.15)" : "rgba(94,200,192,0.12)");
        disc(a.x, a.y, a.r, a.c);
      }
      ctx!.restore();
      label("CHEMISTRY", cx + parallax, cy - 92, GOLD);
    }

    /** Physics — Rutherford orbits + photon */
    function drawPhysics(cx: number, cy: number, t: number) {
      // nucleus
      disc(cx, cy, 10, GOLD);
      disc(cx, cy, 4, CHAMP);
      ring(cx, cy, 18, "rgba(212,176,106,0.4)", 1.5);

      const orbits = [
        { rx: 70, ry: 28, rot: 0.4, speed: 1.2, color: TEAL },
        { rx: 100, ry: 40, rot: -0.7, speed: -0.75, color: GOLD },
        { rx: 135, ry: 52, rot: 1.1, speed: 0.5, color: CHAMP },
      ];

      for (let i = 0; i < orbits.length; i++) {
        const o = orbits[i]!;
        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.rotate(o.rot + t * 0.08 * (i + 1));
        ctx!.beginPath();
        ctx!.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx!.strokeStyle = o.color === TEAL ? "rgba(94,200,192,0.35)" : o.color === GOLD ? "rgba(212,176,106,0.3)" : "rgba(240,224,184,0.25)";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        const ang = t * o.speed * Math.PI * 2;
        const ex = Math.cos(ang) * o.rx;
        const ey = Math.sin(ang) * o.ry;
        disc(ex, ey, 4.5, o.color);
        disc(ex, ey, 9, o.color === TEAL ? "rgba(94,200,192,0.2)" : "rgba(212,176,106,0.18)");
        ctx!.restore();
      }

      // photon streak
      const px = cx + Math.cos(t * 1.4) * 160;
      const py = cy + Math.sin(t * 1.4) * 40 - 80;
      ctx!.strokeStyle = "rgba(240,224,184,0.55)";
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(px - 18, py);
      ctx!.lineTo(px + 18, py);
      ctx!.stroke();
      for (let k = -1; k <= 1; k++) {
        ctx!.beginPath();
        ctx!.moveTo(px + 10, py);
        ctx!.lineTo(px + 16, py + k * 6);
        ctx!.stroke();
      }
      label("PHYSICS", cx, cy + 168, CHAMP);
    }

    /** Math — golden spiral + polyhedron + symbols */
    function drawMath(cx: number, cy: number, t: number, parallax: number) {
      ctx!.save();
      ctx!.translate(cx + parallax, cy);

      // golden spiral
      ctx!.beginPath();
      let first = true;
      for (let i = 0; i <= 120; i++) {
        const u = i / 120;
        const ang = u * Math.PI * 3.2 + t * 0.2;
        const rad = 6 * Math.pow(1.25, u * 10);
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (first) {
          ctx!.moveTo(x, y);
          first = false;
        } else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(212,176,106,0.7)";
      ctx!.lineWidth = 2;
      ctx!.stroke();

      // rotating wire octahedron
      ctx!.save();
      ctx!.rotate(t * 0.55);
      const s = 36;
      const verts = [
        [0, -s, 0],
        [0, s, 0],
        [s, 0, 0],
        [-s, 0, 0],
        [0, 0, s],
        [0, 0, -s],
      ] as const;
      const edges = [
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [2, 4],
        [4, 3],
        [3, 5],
        [5, 2],
      ];
      const rotY = t * 0.7;
      const proj = verts.map(([x, y, z]) => {
        const xr = x * Math.cos(rotY) + z * Math.sin(rotY);
        const zr = -x * Math.sin(rotY) + z * Math.cos(rotY);
        const scale = 1.1 + zr / 80;
        return [xr * scale, y * scale] as const;
      });
      ctx!.strokeStyle = "rgba(94,200,192,0.55)";
      ctx!.lineWidth = 1.5;
      for (const [a, b] of edges) {
        const p = proj[a]!;
        const q = proj[b]!;
        ctx!.beginPath();
        ctx!.moveTo(p[0], p[1]);
        ctx!.lineTo(q[0], q[1]);
        ctx!.stroke();
      }
      ctx!.restore();

      // floating math glyphs
      ctx!.fillStyle = "rgba(240,224,184,0.55)";
      ctx!.font = "16px Georgia, 'Times New Roman', serif";
      const glyphs = ["∑", "π", "∞", "∫", "Δ"];
      for (let i = 0; i < glyphs.length; i++) {
        const a = t * 0.6 + (i / glyphs.length) * Math.PI * 2;
        const x = Math.cos(a) * 78;
        const y = Math.sin(a) * 42;
        ctx!.fillText(glyphs[i]!, x - 6, y + 6);
      }
      ctx!.restore();
      label("MATHEMATICS", cx + parallax, cy + 100, GOLD);
    }

    /** Energy filaments linking the four domains to the nexus */
    function drawFilaments(
      nexus: { x: number; y: number },
      nodes: { x: number; y: number; c: string }[],
      t: number
    ) {
      for (const n of nodes) {
        ctx!.beginPath();
        const mx = (nexus.x + n.x) / 2 + Math.sin(t * 2 + n.x * 0.01) * 20;
        const my = (nexus.y + n.y) / 2 + Math.cos(t * 1.6 + n.y * 0.01) * 16;
        ctx!.moveTo(nexus.x, nexus.y);
        ctx!.quadraticCurveTo(mx, my, n.x, n.y);
        ctx!.strokeStyle = n.c;
        ctx!.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3 + n.x);
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        // traveling bead
        const u = (t * 0.35 + (n.x + n.y) * 0.001) % 1;
        const bx = (1 - u) * (1 - u) * nexus.x + 2 * (1 - u) * u * mx + u * u * n.x;
        const by = (1 - u) * (1 - u) * nexus.y + 2 * (1 - u) * u * my + u * u * n.y;
        disc(bx, by, 3, n.c);
      }
    }

    resize();
    const start = performance.now();

    function frame(now: number) {
      if (!running) return;
      const t = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.07;
      pointer.y += (pointer.ty - pointer.y) * 0.07;

      const parallaxX = (pointer.x - 0.5) * 40;
      const parallaxY = (pointer.y - 0.5) * 28;

      // rich backdrop
      ctx!.fillStyle = "#07121c";
      ctx!.fillRect(0, 0, w, h);

      const wash = ctx!.createRadialGradient(
        w * pointer.x,
        h * pointer.y,
        40,
        w * 0.5,
        h * 0.45,
        Math.max(w, h) * 0.75
      );
      wash.addColorStop(0, "rgba(94,200,192,0.14)");
      wash.addColorStop(0.4, "rgba(212,176,106,0.07)");
      wash.addColorStop(1, "rgba(7,18,28,0)");
      ctx!.fillStyle = wash;
      ctx!.fillRect(0, 0, w, h);

      // star dust
      ctx!.fillStyle = "rgba(240,224,184,0.35)";
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97 + t * 8) % (w + 40)) - 20;
        const sy = (i * 53 + Math.sin(t + i) * 10) % h;
        ctx!.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }

      const isNarrow = w < 720;
      const nexus = { x: w * 0.5 + parallaxX * 0.3, y: h * (isNarrow ? 0.36 : 0.44) + parallaxY * 0.3 };
      const bio = {
        x: w * (isNarrow ? 0.22 : 0.18) + parallaxX * 0.6,
        y: h * (isNarrow ? 0.62 : 0.48) + parallaxY * 0.4,
      };
      const chem = {
        x: w * (isNarrow ? 0.78 : 0.82) + parallaxX * 0.5,
        y: h * (isNarrow ? 0.28 : 0.38) + parallaxY * 0.35,
      };
      const math = {
        x: w * (isNarrow ? 0.72 : 0.72) + parallaxX * 0.45,
        y: h * (isNarrow ? 0.72 : 0.72) + parallaxY * 0.4,
      };

      // draw order: filaments under, emblems, physics center on top-ish
      drawFilaments(nexus, [
        { x: bio.x, y: bio.y, c: "rgba(94,200,192,0.7)" },
        { x: chem.x, y: chem.y, c: "rgba(212,176,106,0.7)" },
        { x: math.x, y: math.y, c: "rgba(240,224,184,0.65)" },
      ], t);

      drawDNA(bio.x, bio.y, t, 0);
      drawMolecule(chem.x, chem.y, t, 0);
      drawMath(math.x, math.y, t, 0);
      drawPhysics(nexus.x, nexus.y, t);

      // fusion title under nexus orbits
      ctx!.save();
      ctx!.font = "600 9px ui-sans-serif, system-ui, sans-serif";
      ctx!.fillStyle = "rgba(157,176,192,0.7)";
      ctx!.textAlign = "center";
      ctx!.fillText("PHYSICS  ·  CHEMISTRY  ·  MATHEMATICS  ·  BIOLOGY", nexus.x, nexus.y + 198);
      ctx!.restore();

      // click sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]!;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04;
        s.life -= 0.018;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const col =
          s.c < 0.33 ? TEAL : s.c < 0.66 ? GOLD : s.c < 0.85 ? CHAMP : EMBER;
        disc(s.x, s.y, 2.2 * s.life + 0.5, col);
      }

      // vignette for card readability
      const vig = ctx!.createRadialGradient(
        w * 0.5,
        h * 0.48,
        Math.min(w, h) * 0.1,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.7
      );
      vig.addColorStop(0, "rgba(7,18,28,0.08)");
      vig.addColorStop(0.5, "rgba(7,18,28,0.28)");
      vig.addColorStop(1, "rgba(7,18,28,0.78)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    }

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
