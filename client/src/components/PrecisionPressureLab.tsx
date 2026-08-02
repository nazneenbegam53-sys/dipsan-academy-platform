import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

const PALETTE = Array.from({ length: 20 }, (_, i) => i + 1);

/**
 * Interactive exam-pressure lab — replaces the static photo beside
 * “Sit the paper / Trust the timer.” Pointer moves the clock hand;
 * tap chips to mark answered; tap the dial to pause/resume the tick.
 */
export function PrecisionPressureLab() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(42 * 60 + 18); // 42:18 remaining feel
  const [answered, setAnswered] = useState<Set<number>>(() => new Set([1, 2, 4, 7]));
  const [activeQ, setActiveQ] = useState(5);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.45 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !visible) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 0 ? 45 * 60 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, visible]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (45 * 60);
  const handAngle = -90 + progress * 360;

  const parallax = useMemo(
    () => ({
      x: (pointer.x - 0.5) * 18,
      y: (pointer.y - 0.5) * 14,
    }),
    [pointer]
  );

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  function toggleAnswer(n: number) {
    setActiveQ(n);
    setAnswered((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        top: `${10 + ((i * 29) % 70)}%`,
        delay: `${(i % 6) * 0.25}s`,
        size: 1.5 + (i % 3),
      })),
    []
  );

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      className={`relative h-[340px] w-full overflow-hidden rounded-3xl border border-white/10 md:h-[400px] precision-lab-enter ${
        visible ? "is-visible" : ""
      }`}
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 30% 20%, rgba(94,200,192,0.16), transparent 55%)," +
          "radial-gradient(ellipse 50% 45% at 85% 80%, rgba(212,176,106,0.12), transparent 50%)," +
          "linear-gradient(165deg, #0a1622 0%, #0f1f2e 55%, #07121c 100%)",
        boxShadow: "0 0 0 1px rgba(94,200,192,0.18), 0 18px 48px rgba(0,0,0,0.35)",
      }}
    >
      <style>{`
        .precision-lab-enter { opacity: 0; transform: translateY(18px) scale(0.98); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .precision-lab-enter.is-visible { opacity: 1; transform: translateY(0) scale(1); }
        .precision-tick { animation: precision-pulse 1.2s ease-in-out infinite; }
        @keyframes precision-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .precision-chip {
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .precision-chip:active { transform: scale(0.94); }
      `}</style>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-aurora/70 animate-star-twinkle"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              transform: `translate(${parallax.x * 0.35}px, ${parallax.y * 0.35}px)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-aurora">Live mock clock</p>
            <p className="mt-1 font-display text-2xl text-mist sm:text-3xl">Precision over pressure.</p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-bronze transition hover:border-gold/40 hover:text-gold"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-3 sm:gap-5">
          {/* Timer dial — pointer angle subtly nudges the glow */}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="relative mx-auto aspect-square w-full max-w-[168px] cursor-pointer border-0 bg-transparent p-0 sm:max-w-[200px]"
            aria-label={paused ? "Resume timer" : "Pause timer"}
            style={{ transform: `translate(${parallax.x * 0.2}px, ${parallax.y * 0.2}px)` }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke="#5EC8C0"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(4, progress * 540)} 540`}
                transform="rotate(-90 100 100)"
                style={{ filter: "drop-shadow(0 0 8px rgba(94,200,192,0.55))" }}
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const a = ((i * 30 - 90) * Math.PI) / 180;
                const x1 = 100 + Math.cos(a) * 72;
                const y1 = 100 + Math.sin(a) * 72;
                const x2 = 100 + Math.cos(a) * 80;
                const y2 = 100 + Math.sin(a) * 80;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(240,224,184,0.45)"
                    strokeWidth="1.5"
                  />
                );
              })}
              <line
                x1="100"
                y1="100"
                x2={100 + Math.cos((handAngle * Math.PI) / 180) * 58}
                y2={100 + Math.sin((handAngle * Math.PI) / 180) * 58}
                stroke="#D4B06A"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={paused ? "" : "precision-tick"}
                style={{ filter: "drop-shadow(0 0 6px rgba(212,176,106,0.6))" }}
              />
              <circle cx="100" cy="100" r="4" fill="#F0E0B8" />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-semibold tracking-wider text-mist sm:text-3xl">
                {mm}:{ss}
              </span>
              <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-bronze">
                {paused ? "paused" : "remaining"}
              </span>
            </div>
          </button>

          {/* Question palette */}
          <div className="min-w-0" style={{ transform: `translate(${parallax.x * -0.15}px, ${parallax.y * -0.15}px)` }}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
              Question palette · tap to mark
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {PALETTE.map((n) => {
                const done = answered.has(n);
                const current = activeQ === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleAnswer(n)}
                    className={`precision-chip flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold sm:text-sm ${
                      current
                        ? "border-gold bg-gold/25 text-champagne"
                        : done
                          ? "border-aurora/50 bg-aurora/15 text-aurora"
                          : "border-white/10 bg-white/[0.03] text-bronze hover:border-white/25 hover:text-mist"
                    }`}
                    style={
                      current
                        ? { boxShadow: "0 0 16px rgba(212,176,106,0.35)" }
                        : done
                          ? { boxShadow: "0 0 12px rgba(94,200,192,0.25)" }
                          : undefined
                    }
                    aria-pressed={done}
                    aria-current={current ? "true" : undefined}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-bronze">
              <span className="text-aurora">{answered.size}</span> answered ·{" "}
              <span className="text-champagne">Q{activeQ}</span> in focus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrecisionPressureLab;
