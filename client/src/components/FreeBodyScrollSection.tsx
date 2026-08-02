import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
        else setVisible(false);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function GravityDiagram({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 280" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="g-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(94,200,192,0.25)" />
          <stop offset="100%" stopColor="rgba(94,200,192,0.05)" />
        </linearGradient>
        <marker id="arrow-gold" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#D4B06A" />
        </marker>
        <marker id="arrow-aurora" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5EC8C0" />
        </marker>
      </defs>

      <rect x="40" y="210" width="240" height="18" rx="2" fill="url(#g-ground)" />
      <line x1="40" y1="210" x2="280" y2="210" stroke="rgba(232,240,245,0.35)" strokeWidth="2" />

      <g
        className={`origin-center transition-all duration-700 ${
          active ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
      >
        <rect
          x="130"
          y="120"
          width="60"
          height="60"
          rx="6"
          fill="rgba(212,176,106,0.18)"
          stroke="#D4B06A"
          strokeWidth="2"
        />
        <text x="160" y="155" textAnchor="middle" fill="#F0E0B8" fontSize="14" fontFamily="Outfit, sans-serif">
          m
        </text>
      </g>

      {/* Weight mg */}
      <g
        className={`transition-all duration-700 delay-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transform: active ? "scaleY(1)" : "scaleY(0.2)",
          transformOrigin: "160px 180px",
        }}
      >
        <line
          x1="160"
          y1="180"
          x2="160"
          y2="248"
          stroke="#D4B06A"
          strokeWidth="2.5"
          markerEnd="url(#arrow-gold)"
        />
        <text x="172" y="230" fill="#D4B06A" fontSize="13" fontFamily="Outfit, sans-serif">
          mg
        </text>
      </g>

      {/* Normal N */}
      <g
        className={`transition-all duration-700 delay-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transform: active ? "scaleY(1)" : "scaleY(0.2)",
          transformOrigin: "160px 120px",
        }}
      >
        <line
          x1="160"
          y1="120"
          x2="160"
          y2="52"
          stroke="#5EC8C0"
          strokeWidth="2.5"
          markerEnd="url(#arrow-aurora)"
        />
        <text x="172" y="70" fill="#5EC8C0" fontSize="13" fontFamily="Outfit, sans-serif">
          N
        </text>
      </g>

      <text
        x="160"
        y="30"
        textAnchor="middle"
        fill="#E8F0F5"
        fontSize="14"
        fontFamily="Cormorant Garamond, serif"
        className={`transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
      >
        Gravitation — free body
      </text>
    </svg>
  );
}

function FrictionDiagram({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 280" className="h-full w-full" aria-hidden>
      <defs>
        <marker id="arrow-gold-f" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#D4B06A" />
        </marker>
        <marker id="arrow-aurora-f" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5EC8C0" />
        </marker>
        <marker id="arrow-mist-f" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#E8F0F5" />
        </marker>
      </defs>

      <line x1="36" y1="200" x2="284" y2="200" stroke="rgba(232,240,245,0.35)" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line
          key={i}
          x1={50 + i * 26}
          y1="200"
          x2={40 + i * 26}
          y2="214"
          stroke="rgba(157,176,192,0.45)"
          strokeWidth="1.5"
        />
      ))}

      <g
        className={`transition-all duration-700 ${
          active ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
        }`}
      >
        <rect
          x="120"
          y="140"
          width="80"
          height="60"
          rx="6"
          fill="rgba(94,200,192,0.14)"
          stroke="#5EC8C0"
          strokeWidth="2"
        />
        <text x="160" y="175" textAnchor="middle" fill="#E8F0F5" fontSize="14" fontFamily="Outfit, sans-serif">
          m
        </text>
      </g>

      {/* Applied force F */}
      <g className={`transition-all duration-700 delay-150 ${active ? "opacity-100" : "opacity-0"}`}>
        <line
          x1="200"
          y1="170"
          x2="270"
          y2="170"
          stroke="#E8F0F5"
          strokeWidth="2.5"
          markerEnd="url(#arrow-mist-f)"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: active ? 0 : 80,
            transition: "stroke-dashoffset 0.8s ease",
          }}
        />
        <text x="240" y="158" fill="#E8F0F5" fontSize="13" fontFamily="Outfit, sans-serif">
          F
        </text>
      </g>

      {/* Friction f */}
      <g className={`transition-all duration-700 delay-300 ${active ? "opacity-100" : "opacity-0"}`}>
        <line
          x1="120"
          y1="170"
          x2="55"
          y2="170"
          stroke="#D4B06A"
          strokeWidth="2.5"
          markerEnd="url(#arrow-gold-f)"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: active ? 0 : 80,
            transition: "stroke-dashoffset 0.9s ease 0.15s",
          }}
        />
        <text x="70" y="158" fill="#D4B06A" fontSize="13" fontFamily="Outfit, sans-serif">
          f
        </text>
      </g>

      {/* Normal + weight */}
      <g className={`transition-all duration-700 delay-200 ${active ? "opacity-100" : "opacity-0"}`}>
        <line
          x1="160"
          y1="140"
          x2="160"
          y2="78"
          stroke="#5EC8C0"
          strokeWidth="2"
          markerEnd="url(#arrow-aurora-f)"
        />
        <text x="170" y="95" fill="#5EC8C0" fontSize="12" fontFamily="Outfit, sans-serif">
          N
        </text>
        <line
          x1="160"
          y1="200"
          x2="160"
          y2="248"
          stroke="#D4B06A"
          strokeWidth="2"
          markerEnd="url(#arrow-gold-f)"
        />
        <text x="170" y="238" fill="#D4B06A" fontSize="12" fontFamily="Outfit, sans-serif">
          mg
        </text>
      </g>

      <text
        x="160"
        y="36"
        textAnchor="middle"
        fill="#E8F0F5"
        fontSize="14"
        fontFamily="Cormorant Garamond, serif"
        className={`transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
      >
        Friction — free body
      </text>
      <text
        x="160"
        y="268"
        textAnchor="middle"
        fill="#9DB0C0"
        fontSize="11"
        fontFamily="Outfit, sans-serif"
        className={`transition-opacity duration-1000 delay-500 ${active ? "opacity-100" : "opacity-0"}`}
      >
        f ≤ μN
      </text>
    </svg>
  );
}

export function FreeBodyScrollSection() {
  const { ref, visible } = useInView(0.3);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-white/10 bg-paper"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 20% 40%, rgba(94,200,192,0.1), transparent)," +
            "radial-gradient(ellipse 50% 40% at 80% 60%, rgba(212,176,106,0.08), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <div className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Physics in motion
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
            Free-body diagrams that come alive
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-bronze md:text-base">
            Scroll to reveal gravity and friction — the forces NEET &amp; JEE keep asking for.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div
            className={`rounded-3xl border border-aurora/25 bg-coal/60 p-4 transition-all duration-700 md:p-6 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="aspect-[8/7]">
              <GravityDiagram active={visible} />
            </div>
          </div>
          <div
            className={`rounded-3xl border border-gold/25 bg-coal/60 p-4 transition-all duration-700 delay-150 md:p-6 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="aspect-[8/7]">
              <FrictionDiagram active={visible} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
