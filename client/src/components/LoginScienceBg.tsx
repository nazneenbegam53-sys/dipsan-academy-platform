import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  born: number;
};

const FORMULAS = [
  "E = mc²",
  "F = ma",
  "PV = nRT",
  "λ = h/p",
  "ΔG < 0",
  "v = u + at",
  "pH = −log[H⁺]",
  "DNA",
  "∫dx",
  "NaCl",
  "H₂O",
  "Δx·Δp ≥ ℏ/2",
];

const ORBIT_ELECTRONS = [
  { r: 72, speed: 0.7, phase: 0, color: "#5EC8C0" },
  { r: 108, speed: -0.45, phase: 1.2, color: "#D4B06A" },
  { r: 148, speed: 0.32, phase: 2.4, color: "#F0E0B8" },
];

/**
 * Interactive science field for the login page —
 * orbiting electrons, formula drift, cursor-tethered bonds.
 * Lives behind the form; does not steal form pointer events.
 */
export function LoginScienceBg() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.45 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Global pointer so parallax still works over the form card
  useEffect(() => {
    function onMove(e: MouseEvent) {
      setPointer({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Cull burst particles
  useEffect(() => {
    if (particles.length === 0) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      setParticles((prev) => prev.filter((p) => now - p.born < 1200));
    }, 200);
    return () => window.clearInterval(id);
  }, [particles.length]);

  const nodes = useMemo(
    () =>
      FORMULAS.map((label, i) => {
        const a = (i / FORMULAS.length) * Math.PI * 2;
        return {
          label,
          baseX: 50 + Math.cos(a) * (28 + (i % 4) * 6),
          baseY: 48 + Math.sin(a) * (22 + (i % 3) * 7),
          drift: 0.4 + (i % 5) * 0.12,
          size: i % 3 === 0 ? 13 : 11,
        };
      }),
    []
  );

  function spawnAt(clientX: number, clientY: number) {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const born = performance.now();
    const batch: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: ++idRef.current,
      x: x + Math.cos((i / 6) * Math.PI * 2) * 1.2,
      y: y + Math.sin((i / 6) * Math.PI * 2) * 1.2,
      born: born + i * 20,
    }));
    setParticles((prev) => [...prev.slice(-24), ...batch]);
  }

  function onBgPointer(e: PointerEvent<HTMLDivElement>) {
    // Only react when the event target is the background itself
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset?.sciHit) return;
    spawnAt(e.clientX, e.clientY);
  }

  const px = (pointer.x - 0.5) * 40;
  const py = (pointer.y - 0.5) * 30;
  const nucleusX = 50 + px * 0.15;
  const nucleusY = 46 + py * 0.15;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <style>{`
        .sci-formula {
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease;
        }
        .sci-burst {
          animation: sci-burst 1.1s ease-out forwards;
        }
        @keyframes sci-burst {
          0% { opacity: 0.9; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(2.4); }
        }
        .sci-orbit-glow {
          filter: drop-shadow(0 0 6px rgba(94,200,192,0.45));
        }
      `}</style>

      {/* Atmospheric wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(94,200,192,0.1), transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(212,176,106,0.08), transparent 55%)," +
            "radial-gradient(ellipse 40% 35% at 15% 20%, rgba(240,224,184,0.05), transparent 50%)",
        }}
      />

      {/* Clickable field — only empty areas (form sits above with z-10) */}
      <div
        className="pointer-events-auto absolute inset-0"
        data-sci-hit="1"
        onPointerDown={onBgPointer}
      />

      {/* Molecular bond lattice toward cursor */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.slice(0, 8).map((n, i) => {
          const ox = n.baseX + Math.sin(t * n.drift + i) * 1.5 + px * 0.04;
          const oy = n.baseY + Math.cos(t * n.drift * 0.8 + i) * 1.2 + py * 0.04;
          return (
            <line
              key={`bond-${n.label}`}
              x1={ox}
              y1={oy}
              x2={nucleusX}
              y2={nucleusY}
              stroke="rgba(94,200,192,0.12)"
              strokeWidth="0.15"
            />
          );
        })}
        {/* Cursor tether */}
        <line
          x1={nucleusX}
          y1={nucleusY}
          x2={pointer.x * 100}
          y2={pointer.y * 100}
          stroke="rgba(212,176,106,0.22)"
          strokeWidth="0.2"
          strokeDasharray="1.2 1.2"
        />
      </svg>

      {/* Central atom + orbits */}
      <div
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(calc(-50% + ${px * 0.4}px), calc(-50% + ${py * 0.4}px))` }}
      >
        <svg width="340" height="340" viewBox="0 0 340 340" className="sci-orbit-glow opacity-80">
          {ORBIT_ELECTRONS.map((orb, i) => (
            <ellipse
              key={`ring-${i}`}
              cx="170"
              cy="170"
              rx={orb.r}
              ry={orb.r * (0.42 + i * 0.08)}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              transform={`rotate(${i * 55 + t * 4} 170 170)`}
            />
          ))}
          <circle cx="170" cy="170" r="10" fill="#D4B06A" opacity="0.85" />
          <circle cx="170" cy="170" r="18" fill="none" stroke="rgba(212,176,106,0.35)" strokeWidth="1.5" />
          {ORBIT_ELECTRONS.map((orb, i) => {
            const a = t * orb.speed * Math.PI * 2 + orb.phase;
            const rx = orb.r;
            const ry = orb.r * (0.42 + i * 0.08);
            const rot = ((i * 55 + t * 4) * Math.PI) / 180;
            const lx = Math.cos(a) * rx;
            const ly = Math.sin(a) * ry;
            const x = 170 + lx * Math.cos(rot) - ly * Math.sin(rot);
            const y = 170 + lx * Math.sin(rot) + ly * Math.cos(rot);
            return <circle key={`e-${i}`} cx={x} cy={y} r="4.5" fill={orb.color} />;
          })}
        </svg>
      </div>

      {/* Drifting formulas */}
      {nodes.map((n, i) => {
        const ox = n.baseX + Math.sin(t * n.drift + i) * 1.8 + px * 0.08;
        const oy = n.baseY + Math.cos(t * n.drift * 0.9 + i) * 1.4 + py * 0.08;
        const dx = ox - pointer.x * 100;
        const dy = oy - pointer.y * 100;
        const dist = Math.hypot(dx, dy);
        const push = dist < 18 ? ((18 - dist) / 18) * 4 : 0;
        const nx = ox + (dist > 0.1 ? (dx / dist) * push : 0);
        const ny = oy + (dist > 0.1 ? (dy / dist) * push : 0);
        return (
          <span
            key={n.label}
            className="sci-formula pointer-events-none absolute font-mono text-mist/25"
            style={{
              left: `${nx}%`,
              top: `${ny}%`,
              fontSize: n.size,
              transform: `translate(-50%, -50%) rotate(${Math.sin(t * 0.3 + i) * 6}deg)`,
            }}
          >
            {n.label}
          </span>
        );
      })}

      {/* Click bursts */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="sci-burst pointer-events-none absolute h-3 w-3 rounded-full bg-aurora/70"
          style={{ left: `${p.x}%`, top: `${p.y}%`, marginLeft: -6, marginTop: -6 }}
        />
      ))}

      {/* Soft vignette so the form stays readable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(7,18,28,0.15), rgba(7,18,28,0.72) 100%)",
        }}
      />
    </div>
  );
}

export default LoginScienceBg;
