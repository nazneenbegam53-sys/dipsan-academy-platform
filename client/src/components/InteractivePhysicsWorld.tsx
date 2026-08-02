import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type ForceId = "gravity" | "normal" | "applied" | "friction" | "tension" | "centripetal";

const FORCE_META: Record<
  ForceId,
  { label: string; color: string; tip: string }
> = {
  gravity: {
    label: "Weight (mg)",
    color: "#EF5350",
    tip: "Gravity (mg): Pulls the object downward toward Earth.",
  },
  normal: {
    label: "Normal Force",
    color: "#4FC3F7",
    tip: "Normal force: Surface pushes perpendicular to itself, opposing weight.",
  },
  applied: {
    label: "Applied Force",
    color: "#66BB6A",
    tip: "Applied force: An external push or pull that can change motion.",
  },
  friction: {
    label: "Friction",
    color: "#FFA726",
    tip: "Friction (μN): Opposes sliding; acts along the contact surface.",
  },
  tension: {
    label: "Tension",
    color: "#CE93D8",
    tip: "Tension: The rope pulls the mass upward along its length.",
  },
  centripetal: {
    label: "Centripetal Force",
    color: "#26C6DA",
    tip: "Centripetal force: Points toward the center, keeping circular motion.",
  },
};

const FORMULAE = ["F = ma", "ΣF = 0", "mg", "N", "μN", "W = mg", "a = v²/r"];

const DIAGRAM_TITLES = [
  "Block on a surface",
  "Inclined plane",
  "Hanging mass",
  "Projectile motion",
  "Circular motion",
];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function stageProgress(local: number, start: number, end: number) {
  return clamp01((local - start) / (end - start));
}

function HandLabel({
  text,
  visible,
  x,
  y,
  color,
}: {
  text: string;
  visible: number;
  x: number;
  y: number;
  color: string;
}) {
  const opacity = clamp01(visible);
  if (opacity < 0.02) return null;
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize="12"
      fontFamily="ui-serif, Georgia, Cambria, serif"
      fontStyle="italic"
      opacity={opacity}
      style={{
        clipPath: `inset(0 ${Math.max(0, 100 - opacity * 100)}% 0 0)`,
        filter: `drop-shadow(0 0 4px ${color}55)`,
      }}
    >
      {text}
    </text>
  );
}

function ForceArrow({
  id,
  uid,
  x1,
  y1,
  x2,
  y2,
  progress,
  bounce = 0,
  onSelect,
  active,
}: {
  id: ForceId;
  uid: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  bounce?: number;
  onSelect: (id: ForceId | null) => void;
  active: boolean;
}) {
  const meta = FORCE_META[id];
  const p = clamp01(progress);
  if (p <= 0.01) return null;

  const mx = x1 + (x2 - x1) * p;
  const my = y1 + (y2 - y1) * p;
  const scale = active ? 1.14 : 1 + bounce * 0.05;
  const markerId = `arrowhead-${uid}`;
  const glowId = `glow-${uid}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={meta.tip}
      className="cursor-pointer outline-none"
      onPointerEnter={() => onSelect(id)}
      onPointerLeave={() => onSelect(null)}
      onFocus={() => onSelect(id)}
      onBlur={() => onSelect(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      transform={`translate(${(x1 + mx) / 2}, ${(y1 + my) / 2}) scale(${scale}) translate(${-(x1 + mx) / 2}, ${-(y1 + my) / 2})`}
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={meta.color} />
        </marker>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={active ? 3.4 : 2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={mx}
        y2={my}
        stroke={meta.color}
        strokeWidth={active ? 4.6 : 3.2}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        filter={`url(#${glowId})`}
        opacity={active ? 1 : 0.88}
        style={{ animation: "physics-arrow-pulse 2.2s ease-in-out infinite" }}
      />
      <line x1={x1} y1={y1} x2={mx} y2={my} stroke="transparent" strokeWidth={20} strokeLinecap="round" />
      <title>{meta.tip}</title>
    </g>
  );
}

function DiagramBlock({
  local,
  selected,
  onSelect,
}: {
  local: number;
  selected: ForceId | null;
  onSelect: (id: ForceId | null) => void;
}) {
  const block = stageProgress(local, 0, 0.2);
  const ground = stageProgress(local, 0.2, 0.4);
  const gravity = stageProgress(local, 0.4, 0.6);
  const normal = stageProgress(local, 0.6, 0.8);
  const applied = stageProgress(local, 0.8, 1);
  const bounce = applied > 0.85 ? Math.sin((applied - 0.85) * 40) * (1 - applied) : 0;

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      <path
        d="M40 200 H360"
        fill="none"
        stroke="rgba(240,224,184,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - ground}
      />
      <g opacity={block} transform={`translate(200 168) scale(${0.8 + 0.2 * block}) translate(-200 -168)`}>
        <rect
          x="170"
          y="138"
          width="60"
          height="60"
          rx="4"
          fill="rgba(94,200,192,0.18)"
          stroke="#5EC8C0"
          strokeWidth="2"
        />
      </g>
      <ForceArrow id="gravity" uid="h-g" x1={200} y1={168} x2={200} y2={230} progress={gravity} onSelect={onSelect} active={selected === "gravity"} />
      <HandLabel text="Weight (mg)" visible={gravity} x={212} y={228} color="#EF5350" />
      <ForceArrow id="normal" uid="h-n" x1={200} y1={168} x2={200} y2={95} progress={normal} onSelect={onSelect} active={selected === "normal"} />
      <HandLabel text="Normal Force" visible={normal} x={212} y={100} color="#4FC3F7" />
      <ForceArrow id="applied" uid="h-a" x1={200} y1={168} x2={290} y2={168} progress={applied} bounce={bounce} onSelect={onSelect} active={selected === "applied"} />
      <HandLabel text="Applied Force" visible={applied} x={250} y={158} color="#66BB6A" />
      <ForceArrow id="friction" uid="h-f" x1={200} y1={168} x2={110} y2={168} progress={applied} bounce={bounce} onSelect={onSelect} active={selected === "friction"} />
      <HandLabel text="Friction" visible={applied} x={70} y={158} color="#FFA726" />
    </svg>
  );
}

function DiagramInclined({
  local,
  selected,
  onSelect,
}: {
  local: number;
  selected: ForceId | null;
  onSelect: (id: ForceId | null) => void;
}) {
  const slope = stageProgress(local, 0, 0.25);
  const block = stageProgress(local, 0.15, 0.4);
  const gravity = stageProgress(local, 0.4, 0.6);
  const normal = stageProgress(local, 0.55, 0.75);
  const friction = stageProgress(local, 0.75, 1);
  const bx = 200;
  const by = 145;

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      <path
        d="M60 210 L340 95"
        fill="none"
        stroke="rgba(240,224,184,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - slope}
      />
      <path
        d="M60 210 H340"
        fill="none"
        stroke="rgba(240,224,184,0.2)"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - slope * 0.8}
      />
      <g opacity={block} transform={`translate(${bx} ${by}) rotate(-22) scale(${0.85 + 0.15 * block}) translate(-20 -20)`}>
        <rect x="0" y="0" width="40" height="40" rx="3" fill="rgba(94,200,192,0.18)" stroke="#5EC8C0" strokeWidth="2" />
      </g>
      <ForceArrow id="gravity" uid="i-g" x1={bx} y1={by} x2={bx} y2={by + 70} progress={gravity} onSelect={onSelect} active={selected === "gravity"} />
      <HandLabel text="Weight (mg)" visible={gravity} x={bx + 12} y={by + 68} color="#EF5350" />
      <ForceArrow id="normal" uid="i-n" x1={bx} y1={by} x2={bx - 28} y2={by - 62} progress={normal} onSelect={onSelect} active={selected === "normal"} />
      <HandLabel text="Normal Force" visible={normal} x={bx - 90} y={by - 55} color="#4FC3F7" />
      <ForceArrow id="friction" uid="i-f" x1={bx} y1={by} x2={bx - 70} y2={by + 28} progress={friction} onSelect={onSelect} active={selected === "friction"} />
      <HandLabel text="Friction" visible={friction} x={bx - 105} y={by + 40} color="#FFA726" />
    </svg>
  );
}

function DiagramHanging({
  local,
  selected,
  onSelect,
}: {
  local: number;
  selected: ForceId | null;
  onSelect: (id: ForceId | null) => void;
}) {
  const rope = stageProgress(local, 0, 0.3);
  const mass = stageProgress(local, 0.2, 0.45);
  const swing = Math.sin(local * Math.PI * 2) * 8 * mass;
  const tension = stageProgress(local, 0.5, 0.75);
  const weight = stageProgress(local, 0.7, 1);
  const cx = 200 + swing;
  const cy = 170;

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      <circle cx="200" cy="48" r="5" fill="rgba(240,224,184,0.7)" opacity={rope} />
      <line
        x1="200"
        y1="48"
        x2={cx}
        y2={cy - 28}
        stroke="rgba(240,224,184,0.65)"
        strokeWidth="2"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - rope}
      />
      <g opacity={mass}>
        <rect x={cx - 28} y={cy - 28} width="56" height="56" rx="4" fill="rgba(94,200,192,0.18)" stroke="#5EC8C0" strokeWidth="2" />
      </g>
      <ForceArrow id="tension" uid="p-t" x1={cx} y1={cy} x2={cx} y2={cy - 75} progress={tension} onSelect={onSelect} active={selected === "tension"} />
      <HandLabel text="Tension" visible={tension} x={cx + 12} y={cy - 70} color="#CE93D8" />
      <ForceArrow id="gravity" uid="p-g" x1={cx} y1={cy} x2={cx} y2={cy + 75} progress={weight} onSelect={onSelect} active={selected === "gravity"} />
      <HandLabel text="Weight (mg)" visible={weight} x={cx + 12} y={cy + 72} color="#EF5350" />
    </svg>
  );
}

function DiagramProjectile({
  local,
  selected,
  onSelect,
}: {
  local: number;
  selected: ForceId | null;
  onSelect: (id: ForceId | null) => void;
}) {
  const flight = stageProgress(local, 0, 0.85);
  const t = flight;
  const x = 60 + t * 280;
  const y = 200 - (4 * t * (1 - t) * 160 + t * 40);
  const gravity = stageProgress(local, 0.25, 0.55);
  const trail = Array.from({ length: 12 }, (_, i) => {
    const ti = Math.max(0, t - i * 0.04);
    return {
      x: 60 + ti * 280,
      y: 200 - (4 * ti * (1 - ti) * 160 + ti * 40),
      o: (1 - i / 12) * t,
    };
  });

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      <path
        d="M60 200 Q200 40 340 160"
        fill="none"
        stroke="rgba(94,200,192,0.15)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity={0.5 + flight * 0.5}
      />
      {trail.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.2 - i * 0.1} fill="#5EC8C0" opacity={p.o * 0.55} />
      ))}
      <circle
        cx={x}
        cy={y}
        r={10}
        fill="rgba(94,200,192,0.35)"
        stroke="#5EC8C0"
        strokeWidth="2"
        opacity={Math.min(1, flight * 3)}
      />
      <ForceArrow
        id="gravity"
        uid="pr-g"
        x1={x}
        y1={y}
        x2={x}
        y2={y + 55}
        progress={gravity * Math.min(1, flight * 2)}
        onSelect={onSelect}
        active={selected === "gravity"}
      />
      <HandLabel text="Weight (mg)" visible={gravity * Math.min(1, flight * 2)} x={x + 14} y={y + 50} color="#EF5350" />
    </svg>
  );
}

function DiagramCircular({
  local,
  selected,
  onSelect,
}: {
  local: number;
  selected: ForceId | null;
  onSelect: (id: ForceId | null) => void;
}) {
  const appear = stageProgress(local, 0, 0.2);
  const angle = local * Math.PI * 4;
  const R = 70;
  const cx = 200;
  const cy = 145;
  const bx = cx + Math.cos(angle) * R;
  const by = cy + Math.sin(angle) * R;
  const fc = stageProgress(local, 0.25, 0.5);

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(240,224,184,0.25)" strokeWidth="1.5" strokeDasharray="5 7" opacity={appear} />
      <circle cx={cx} cy={cy} r="3" fill="rgba(240,224,184,0.6)" opacity={appear} />
      <line x1={cx} y1={cy} x2={bx} y2={by} stroke="rgba(94,200,192,0.25)" strokeWidth="1" opacity={appear} />
      <circle cx={bx} cy={by} r={11} fill="rgba(94,200,192,0.3)" stroke="#5EC8C0" strokeWidth="2" opacity={appear} />
      <ForceArrow
        id="centripetal"
        uid="c-fc"
        x1={bx}
        y1={by}
        x2={cx + (bx - cx) * 0.25}
        y2={cy + (by - cy) * 0.25}
        progress={fc}
        onSelect={onSelect}
        active={selected === "centripetal"}
      />
      <HandLabel text="Centripetal Force" visible={fc} x={cx - 30} y={cy - R - 18} color="#26C6DA" />
    </svg>
  );
}

/**
 * Cursor-driven free-body diagrams for the hero.
 * Horizontal pointer position scrubs through all five FBDs; vertical adds parallax.
 */
export function InteractivePhysicsWorld() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.12);
  const [selected, setSelected] = useState<ForceId | null>(null);
  const [hint, setHint] = useState(true);

  const rawX = useMotionValue(0.12);
  const rawY = useMotionValue(0.5);
  const smoothX = useSpring(rawX, { stiffness: 120, damping: 28, mass: 0.35 });
  const smoothY = useSpring(rawY, { stiffness: 100, damping: 26, mass: 0.4 });

  const parallaxX = useTransform(smoothX, [0, 1], [-18, 18]);
  const parallaxY = useTransform(smoothY, [0, 1], [-10, 10]);
  const formulaY = useTransform(smoothY, [0, 1], [12, -18]);

  useEffect(() => {
    const unsub = smoothX.on("change", (v) => setProgress(clamp01(v)));
    return () => unsub();
  }, [smoothX]);

  // Track cursor over the hero without stealing clicks from CTAs
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      rawX.set(clamp01((e.clientX - rect.left) / rect.width));
      rawY.set(clamp01((e.clientY - rect.top) / rect.height));
      setHint(false);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  // Gentle idle scrub when the user isn't moving the cursor
  useEffect(() => {
    let idle = true;
    let t0 = performance.now();
    let raf = 0;
    const onMove = () => {
      idle = false;
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        idle = true;
        t0 = performance.now();
      }, 2200);
    };
    let reset = window.setTimeout(() => {
      idle = true;
      t0 = performance.now();
    }, 2800);

    const tick = (now: number) => {
      if (idle) {
        const t = (now - t0) / 18000;
        rawX.set(0.08 + 0.84 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(reset);
      window.removeEventListener("pointermove", onMove);
    };
  }, [rawX]);

  const onSelect = useCallback((id: ForceId | null) => setSelected(id), []);

  const diagramIndex = Math.min(4, Math.floor(progress * 5));
  const local = progress >= 0.999 ? 1 : (progress * 5) % 1;
  const activeIndex = progress >= 0.999 ? 4 : diagramIndex;

  useEffect(() => {
    setSelected(null);
  }, [activeIndex]);

  const formulae = useMemo(
    () =>
      FORMULAE.map((f, i) => ({
        f,
        left: `${8 + ((i * 17) % 80)}%`,
        top: `${12 + ((i * 23) % 70)}%`,
        rot: (i % 2 === 0 ? -1 : 1) * (5 + i),
      })),
    []
  );

  const dots = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 1.5 + (i % 3),
        delay: (i % 10) * 0.3,
      })),
    []
  );

  const diagramLocal = (i: number) => {
    if (i < activeIndex) return 1;
    if (i > activeIndex) return 0;
    return local;
  };

  const offsetFor = (i: number) => {
    if (i === activeIndex) return 0;
    if (i < activeIndex) return -108;
    return 108;
  };

  const meta = selected ? FORCE_META[selected] : null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[6] overflow-hidden"
      aria-label="Interactive free-body diagrams — move your cursor to draw forces"
    >
      <style>{`
        @keyframes physics-arrow-pulse {
          0%, 100% { opacity: 0.78; }
          50% { opacity: 1; }
        }
        @keyframes physics-spark {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.7); }
        }
      `}</style>

      {/* Soft dark veil so diagrams read over the hero photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 48% at 50% 58%, rgba(7,18,28,0.55), transparent 72%)",
        }}
      />

      <motion.div style={{ x: parallaxX, y: formulaY }} className="pointer-events-none absolute inset-0 font-mono text-xs md:text-sm" aria-hidden>
        {formulae.map(({ f, left, top, rot }) => (
          <span
            key={f}
            className="absolute text-mist/[0.11]"
            style={{ left, top, transform: `rotate(${rot}deg)` }}
          >
            {f}
          </span>
        ))}
      </motion.div>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {dots.map((d) => (
          <span
            key={d.id}
            className="absolute rounded-full bg-aurora/70"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              boxShadow: "0 0 8px rgba(94,200,192,0.45)",
              animation: `physics-spark ${3.2 + (d.id % 4)}s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute inset-x-0 bottom-14 top-auto flex h-[min(32vh,260px)] flex-col items-center justify-end px-4 pb-2 md:bottom-16 md:h-[min(34vh,280px)]"
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-aurora/85 md:text-xs">
          {DIAGRAM_TITLES[activeIndex]}
        </div>

        <div className="pointer-events-auto relative h-[min(26vh,210px)] w-full max-w-md md:h-[min(28vh,230px)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                transform: `translateX(${offsetFor(i)}%)`,
                opacity: i === activeIndex ? 1 : 0,
                pointerEvents: i === activeIndex ? "auto" : "none",
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
              }}
            >
              {i === 0 && <DiagramBlock local={diagramLocal(0)} selected={selected} onSelect={onSelect} />}
              {i === 1 && <DiagramInclined local={diagramLocal(1)} selected={selected} onSelect={onSelect} />}
              {i === 2 && <DiagramHanging local={diagramLocal(2)} selected={selected} onSelect={onSelect} />}
              {i === 3 && <DiagramProjectile local={diagramLocal(3)} selected={selected} onSelect={onSelect} />}
              {i === 4 && <DiagramCircular local={diagramLocal(4)} selected={selected} onSelect={onSelect} />}
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-1.5">
          {DIAGRAM_TITLES.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 18 : 7,
                background: i === activeIndex ? "rgba(94,200,192,0.95)" : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>

        <p
          className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-bronze transition-opacity duration-500 md:text-[11px]"
          style={{ opacity: hint ? 0.9 : 0.35 }}
        >
          Move cursor to draw forces
        </p>

        {meta && (
          <div
            className="pointer-events-none mt-2 max-w-sm rounded-xl border border-white/15 bg-ink/85 px-3 py-2 text-left backdrop-blur-md"
            style={{ boxShadow: `0 0 20px ${meta.color}33` }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta.color }}>
              {meta.label}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-mist">{meta.tip}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default InteractivePhysicsWorld;
