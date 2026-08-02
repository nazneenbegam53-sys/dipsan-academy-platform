import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

type ForceId = "gravity" | "normal" | "applied" | "friction" | "tension" | "centripetal";

const FORCE_META: Record<
  ForceId,
  { label: string; short: string; color: string; tip: string }
> = {
  gravity: {
    label: "Weight (mg)",
    short: "W",
    color: "#EF5350",
    tip: "Gravity (mg): Pulls the object downward toward Earth.",
  },
  normal: {
    label: "Normal Force",
    short: "N",
    color: "#4FC3F7",
    tip: "Normal force: Surface pushes perpendicular to itself, opposing weight.",
  },
  applied: {
    label: "Applied Force",
    short: "F",
    color: "#66BB6A",
    tip: "Applied force: An external push or pull that can change motion.",
  },
  friction: {
    label: "Friction",
    short: "Fr",
    color: "#FFA726",
    tip: "Friction (μN): Opposes sliding; acts along the contact surface.",
  },
  tension: {
    label: "Tension",
    short: "T",
    color: "#CE93D8",
    tip: "Tension: The rope pulls the mass upward along its length.",
  },
  centripetal: {
    label: "Centripetal Force",
    short: "Fc",
    color: "#26C6DA",
    tip: "Centripetal force: Points toward the center, keeping circular motion.",
  },
};

const FORMULAE = ["F = ma", "ΣF = 0", "mg", "N", "μN", "W = mg", "a = v²/r", "T − mg = ma"];

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

function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 1.5 + (i % 3),
        delay: (i % 12) * 0.35,
        dur: 4 + (i % 5),
        opacity: 0.25 + (i % 4) * 0.12,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-aurora animate-pulse"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
            boxShadow: "0 0 8px rgba(94,200,192,0.55)",
          }}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={`spark-${i}`}
          className="absolute h-1 w-1 rounded-full bg-gold"
          style={{
            left: `${12 + i * 14}%`,
            top: `${20 + ((i * 29) % 60)}%`,
            opacity: 0.35,
            boxShadow: "0 0 10px rgba(240,224,184,0.7)",
            animation: `physics-spark ${3.5 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingFormulae({ parallax }: { parallax: MotionValue<number> }) {
  const y = useTransform(parallax, [0, 1], [0, -80]);

  return (
    <motion.div
      style={{ y }}
      className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-sm md:text-base"
      aria-hidden
    >
      {FORMULAE.map((f, i) => (
        <span
          key={f}
          className="absolute text-mist/10"
          style={{
            left: `${8 + ((i * 17) % 80)}%`,
            top: `${10 + ((i * 23) % 75)}%`,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (6 + i)}deg)`,
            animation: `physics-drift ${14 + i * 2}s ease-in-out ${i}s infinite alternate`,
          }}
        >
          {f}
        </span>
      ))}
    </motion.div>
  );
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
  const clip = Math.max(0, 100 - opacity * 100);

  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize="13"
      fontFamily="ui-serif, Georgia, Cambria, serif"
      fontStyle="italic"
      opacity={opacity}
      style={{
        clipPath: `inset(0 ${clip}% 0 0)`,
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
  const mx = x1 + (x2 - x1) * p;
  const my = y1 + (y2 - y1) * p;
  const scale = active ? 1.12 : 1 + bounce * 0.04;
  const markerId = `arrowhead-${uid}`;
  const glowId = `glow-${uid}`;

  if (p <= 0.01) return null;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={meta.tip}
      style={{ cursor: "pointer", outline: "none" }}
      onMouseEnter={() => onSelect(id)}
      onMouseLeave={() => onSelect(null)}
      onFocus={() => onSelect(id)}
      onBlur={() => onSelect(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      transform={`translate(${(x1 + mx) / 2}, ${(y1 + my) / 2}) scale(${scale}) translate(${-(x1 + mx) / 2}, ${-(y1 + my) / 2})`}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={meta.color} />
        </marker>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={active ? 3.2 : 2} result="blur" />
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
        strokeWidth={active ? 4.5 : 3.2}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        filter={`url(#${glowId})`}
        opacity={0.85 + (active ? 0.15 : 0)}
        style={{
          animation: "physics-arrow-pulse 2.2s ease-in-out infinite",
        }}
      />
      <line
        x1={x1}
        y1={y1}
        x2={mx}
        y2={my}
        stroke="transparent"
        strokeWidth={18}
        strokeLinecap="round"
      />
      <title>{meta.tip}</title>
    </g>
  );
}

function TooltipPanel({
  forceId,
  placement,
}: {
  forceId: ForceId | null;
  placement: "overlay" | "below";
}) {
  if (!forceId) {
    return placement === "below" ? (
      <div className="mt-3 min-h-[3.25rem] text-center text-sm text-bronze/70">
        Tap a force arrow to learn what it means
      </div>
    ) : null;
  }

  const meta = FORCE_META[forceId];
  const body = (
    <div
      className="rounded-xl border border-white/15 bg-ink/90 px-4 py-3 text-left shadow-lg backdrop-blur-md"
      style={{ boxShadow: `0 0 24px ${meta.color}33` }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
        {meta.label}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-mist">{meta.tip}</p>
    </div>
  );

  if (placement === "below") {
    return <div className="mt-3 md:hidden">{body}</div>;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-20 hidden w-[min(20rem,90%)] -translate-x-1/2 md:block">
      {body}
    </div>
  );
}

function DiagramFrame({
  children,
  title,
  active,
  offsetX,
}: {
  children: ReactNode;
  title: string;
  active: boolean;
  offsetX: number;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-4"
      style={{
        transform: `translateX(${offsetX}%)`,
        opacity: active ? 1 : Math.abs(offsetX) < 100 ? 0.35 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease",
      }}
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-aurora/80">
        {title}
      </div>
      <div className="relative w-full max-w-xl">{children}</div>
    </div>
  );
}

function DiagramBlockSurface({
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
  const friction = applied;
  const bounce = applied > 0.85 ? Math.sin((applied - 0.85) * 40) * (1 - applied) : 0;

  return (
    <svg viewBox="0 0 400 280" className="mx-auto h-auto w-full max-w-md drop-shadow-lg">
      {/* ground */}
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
      {/* block */}
      <g
        opacity={block}
        transform={`translate(200 168) scale(${0.8 + 0.2 * block}) translate(-200 -168)`}
      >
        <rect
          x="170"
          y="138"
          width="60"
          height="60"
          rx="4"
          fill="rgba(94,200,192,0.18)"
          stroke="#5EC8C0"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 12px rgba(94,200,192,0.35))" }}
        />
      </g>

      <ForceArrow
        id="gravity"
        uid="gravity-1"
        x1={200}
        y1={168}
        x2={200}
        y2={230}
        progress={gravity}
        onSelect={onSelect}
        active={selected === "gravity"}
      />
      <HandLabel text="Weight (mg)" visible={gravity} x={212} y={228} color="#EF5350" />

      <ForceArrow
        id="normal"
        uid="normal-2"
        x1={200}
        y1={168}
        x2={200}
        y2={95}
        progress={normal}
        onSelect={onSelect}
        active={selected === "normal"}
      />
      <HandLabel text="Normal Force" visible={normal} x={212} y={100} color="#4FC3F7" />

      <ForceArrow
        id="applied"
        uid="applied-3"
        x1={200}
        y1={168}
        x2={290}
        y2={168}
        progress={applied}
        bounce={bounce}
        onSelect={onSelect}
        active={selected === "applied"}
      />
      <HandLabel text="Applied Force" visible={applied} x={250} y={158} color="#66BB6A" />

      <ForceArrow
        id="friction"
        uid="friction-4"
        x1={200}
        y1={168}
        x2={110}
        y2={168}
        progress={friction}
        bounce={bounce}
        onSelect={onSelect}
        active={selected === "friction"}
      />
      <HandLabel text="Friction" visible={friction} x={70} y={158} color="#FFA726" />
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

  // Slope from (60,200) to (340,90); block near mid-slope
  const bx = 200;
  const by = 145;

  return (
    <svg viewBox="0 0 400 280" className="mx-auto h-auto w-full max-w-md">
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
      <g
        opacity={block}
        transform={`translate(${bx} ${by}) rotate(-22) scale(${0.85 + 0.15 * block}) translate(-20 -20)`}
      >
        <rect
          x="0"
          y="0"
          width="40"
          height="40"
          rx="3"
          fill="rgba(94,200,192,0.18)"
          stroke="#5EC8C0"
          strokeWidth="2"
        />
      </g>

      <ForceArrow
        id="gravity"
        uid="gravity-5"
        x1={bx}
        y1={by}
        x2={bx}
        y2={by + 70}
        progress={gravity}
        onSelect={onSelect}
        active={selected === "gravity"}
      />
      <HandLabel text="Weight (mg)" visible={gravity} x={bx + 12} y={by + 68} color="#EF5350" />

      {/* Normal ~ perpendicular to slope (~68°) */}
      <ForceArrow
        id="normal"
        uid="normal-6"
        x1={bx}
        y1={by}
        x2={bx - 28}
        y2={by - 62}
        progress={normal}
        onSelect={onSelect}
        active={selected === "normal"}
      />
      <HandLabel text="Normal Force" visible={normal} x={bx - 90} y={by - 55} color="#4FC3F7" />

      <ForceArrow
        id="friction"
        uid="friction-7"
        x1={bx}
        y1={by}
        x2={bx - 70}
        y2={by + 28}
        progress={friction}
        onSelect={onSelect}
        active={selected === "friction"}
      />
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
    <svg viewBox="0 0 400 280" className="mx-auto h-auto w-full max-w-md">
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
        <rect
          x={cx - 28}
          y={cy - 28}
          width="56"
          height="56"
          rx="4"
          fill="rgba(94,200,192,0.18)"
          stroke="#5EC8C0"
          strokeWidth="2"
        />
      </g>

      <ForceArrow
        id="tension"
        uid="tension-8"
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 75}
        progress={tension}
        onSelect={onSelect}
        active={selected === "tension"}
      />
      <HandLabel text="Tension" visible={tension} x={cx + 12} y={cy - 70} color="#CE93D8" />

      <ForceArrow
        id="gravity"
        uid="gravity-9"
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy + 75}
        progress={weight}
        onSelect={onSelect}
        active={selected === "gravity"}
      />
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
  // Parabolic path
  const t = flight;
  const x = 60 + t * 280;
  const y = 200 - (4 * t * (1 - t) * 160 + t * 40);
  const trail = Array.from({ length: 12 }, (_, i) => {
    const ti = Math.max(0, t - i * 0.04);
    return {
      x: 60 + ti * 280,
      y: 200 - (4 * ti * (1 - ti) * 160 + ti * 40),
      o: (1 - i / 12) * t,
    };
  });
  const gravity = stageProgress(local, 0.25, 0.55);

  return (
    <svg viewBox="0 0 400 280" className="mx-auto h-auto w-full max-w-md">
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
        style={{ filter: "drop-shadow(0 0 10px rgba(94,200,192,0.5))" }}
      />
      <ForceArrow
        id="gravity"
        uid="gravity-10"
        x1={x}
        y1={y}
        x2={x}
        y2={y + 55}
        progress={gravity * Math.min(1, flight * 2)}
        onSelect={onSelect}
        active={selected === "gravity"}
      />
      <HandLabel
        text="Weight (mg)"
        visible={gravity * Math.min(1, flight * 2)}
        x={x + 14}
        y={y + 50}
        color="#EF5350"
      />
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
  const angle = local * Math.PI * 4; // two full turns over diagram
  const R = 70;
  const cx = 200;
  const cy = 145;
  const bx = cx + Math.cos(angle) * R;
  const by = cy + Math.sin(angle) * R;
  const fc = stageProgress(local, 0.25, 0.5);

  return (
    <svg viewBox="0 0 400 280" className="mx-auto h-auto w-full max-w-md">
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(240,224,184,0.25)"
        strokeWidth="1.5"
        strokeDasharray="5 7"
        opacity={appear}
      />
      <circle cx={cx} cy={cy} r="3" fill="rgba(240,224,184,0.6)" opacity={appear} />
      <line
        x1={cx}
        y1={cy}
        x2={bx}
        y2={by}
        stroke="rgba(94,200,192,0.25)"
        strokeWidth="1"
        opacity={appear}
      />
      <circle
        cx={bx}
        cy={by}
        r={11}
        fill="rgba(94,200,192,0.3)"
        stroke="#5EC8C0"
        strokeWidth="2"
        opacity={appear}
        style={{ filter: "drop-shadow(0 0 10px rgba(94,200,192,0.45))" }}
      />
      <ForceArrow
        id="centripetal"
        uid="centripetal-11"
        x1={bx}
        y1={by}
        x2={cx + (bx - cx) * 0.25}
        y2={cy + (by - cy) * 0.25}
        progress={fc}
        onSelect={onSelect}
        active={selected === "centripetal"}
      />
      <HandLabel
        text="Centripetal Force"
        visible={fc}
        x={cx - 30}
        y={cy - R - 18}
        color="#26C6DA"
      />
    </svg>
  );
}

export function InteractivePhysicsWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<ForceId | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });

  useMotionValueEvent(smooth, "change", (v) => {
    setProgress(v);
  });

  const onSelect = useCallback((id: ForceId | null) => {
    setSelected(id);
  }, []);

  // 5 diagrams across scroll; each gets ~20% of progress
  const diagramIndex = Math.min(4, Math.floor(progress * 5));
  const local = (progress * 5) % 1;
  // At exactly 1.0, stay on last diagram fully drawn
  const localProgress = progress >= 0.999 ? 1 : local;
  const activeIndex = progress >= 0.999 ? 4 : diagramIndex;

  useEffect(() => {
    setSelected(null);
  }, [activeIndex]);

  // Slide offsets: active at 0, previous exits left, next waits right
  const offsets = [0, 1, 2, 3, 4].map((i) => {
    if (i === activeIndex) return 0;
    if (i < activeIndex) return -110;
    return 110;
  });

  const scrollHintOpacity = progress < 0.04 ? 1 : progress < 0.12 ? 1 - (progress - 0.04) / 0.08 : 0;

  return (
    <section
      ref={containerRef}
      className="relative border-t border-white/10"
      style={{ height: "520vh" }}
      aria-label="Interactive Physics World"
    >
      <style>{`
        @keyframes physics-drift {
          from { transform: translateY(0) rotate(var(--r, 0deg)); }
          to { transform: translateY(-28px) rotate(var(--r, 0deg)); }
        }
        @keyframes physics-spark {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.8); }
        }
        @keyframes physics-arrow-pulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(94,200,192,0.1), transparent 60%)," +
              "linear-gradient(180deg, #0a1218 0%, #0d1a22 45%, #0a1016 100%)",
          }}
        />
        <Particles />
        <FloatingFormulae parallax={smooth} />

        <div className="relative z-10 flex shrink-0 flex-col items-center px-6 pt-10 text-center md:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Physics lab</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-5xl">
            Learn Physics Visually
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-bronze md:text-base">
            Scroll to draw free-body diagrams in real time — forces appear as you move.
          </p>
        </div>

        <div
          className="relative z-10 mx-auto mt-2 w-full max-w-3xl flex-1"
          onClick={() => setSelected(null)}
        >
          <TooltipPanel forceId={selected} placement="overlay" />

          <DiagramFrame title={DIAGRAM_TITLES[0]} active={activeIndex === 0} offsetX={offsets[0]}>
            <DiagramBlockSurface local={activeIndex === 0 ? localProgress : 1} selected={selected} onSelect={onSelect} />
          </DiagramFrame>
          <DiagramFrame title={DIAGRAM_TITLES[1]} active={activeIndex === 1} offsetX={offsets[1]}>
            <DiagramInclined local={activeIndex === 1 ? localProgress : activeIndex > 1 ? 1 : 0} selected={selected} onSelect={onSelect} />
          </DiagramFrame>
          <DiagramFrame title={DIAGRAM_TITLES[2]} active={activeIndex === 2} offsetX={offsets[2]}>
            <DiagramHanging local={activeIndex === 2 ? localProgress : activeIndex > 2 ? 1 : 0} selected={selected} onSelect={onSelect} />
          </DiagramFrame>
          <DiagramFrame title={DIAGRAM_TITLES[3]} active={activeIndex === 3} offsetX={offsets[3]}>
            <DiagramProjectile local={activeIndex === 3 ? localProgress : activeIndex > 3 ? 1 : 0} selected={selected} onSelect={onSelect} />
          </DiagramFrame>
          <DiagramFrame title={DIAGRAM_TITLES[4]} active={activeIndex === 4} offsetX={offsets[4]}>
            <DiagramCircular local={activeIndex === 4 ? localProgress : 0} selected={selected} onSelect={onSelect} />
          </DiagramFrame>
        </div>

        <div className="relative z-10 shrink-0 px-6 pb-8">
          <TooltipPanel forceId={selected} placement="below" />

          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {DIAGRAM_TITLES.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? 22 : 8,
                    background:
                      i === activeIndex ? "rgba(94,200,192,0.9)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
            <div
              className="flex flex-col items-center text-xs uppercase tracking-[0.22em] text-bronze transition-opacity duration-300"
              style={{ opacity: scrollHintOpacity }}
            >
              <span>Scroll to see more</span>
              <span className="mt-1 animate-bounce text-aurora">↓</span>
            </div>
            <p className="text-center text-[11px] text-bronze/60 md:hidden">
              Tip: tap a glowing arrow for a short explanation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InteractivePhysicsWorld;
