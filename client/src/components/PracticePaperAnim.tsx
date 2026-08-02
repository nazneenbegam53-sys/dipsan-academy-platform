import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

const OPTIONS = ["A", "B", "C", "D"] as const;

type Row = {
  q: number;
  marked: number | null;
  correct: number;
};

function buildRows(): Row[] {
  return Array.from({ length: 8 }, (_, i) => ({
    q: i + 1,
    marked: i % 3 === 0 ? i % 4 : i % 5 === 0 ? null : (i + 1) % 4,
    correct: (i * 2 + 1) % 4,
  }));
}

/**
 * Interactive “Practice like the real paper” animation —
 * a live MCQ sheet with bubbling marks, timer pulse, and tap-to-fill.
 */
export function PracticePaperAnim() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rows, setRows] = useState<Row[]>(buildRows);
  const [focusQ, setFocusQ] = useState(3);
  const [tick, setTick] = useState(0);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 900);
    return () => window.clearInterval(id);
  }, [visible]);

  // Soft auto-advance focus to feel “alive”
  useEffect(() => {
    if (!visible) return;
    setFocusQ((q) => (q % 8) + 1);
  }, [tick, visible]);

  const scored = useMemo(() => {
    let right = 0;
    let wrong = 0;
    let blank = 0;
    for (const r of rows) {
      if (r.marked === null) blank++;
      else if (r.marked === r.correct) right++;
      else wrong++;
    }
    return { right, wrong, blank, net: right * 4 - wrong };
  }, [rows]);

  function mark(q: number, opt: number) {
    setFocusQ(q);
    setRows((prev) =>
      prev.map((r) => (r.q === q ? { ...r, marked: r.marked === opt ? null : opt } : r))
    );
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  const parallaxX = (pointer.x - 0.5) * 12;
  const parallaxY = (pointer.y - 0.5) * 10;

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      className={`pointer-events-auto absolute inset-0 overflow-hidden practice-paper-enter ${
        visible ? "is-visible" : ""
      }`}
      aria-hidden={false}
    >
      <style>{`
        .practice-paper-enter { opacity: 0; transform: scale(1.02); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22,1,0.36,1); }
        .practice-paper-enter.is-visible { opacity: 1; transform: scale(1); }
        .omr-bubble {
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .omr-bubble:active { transform: scale(0.9); }
        .sheet-scan {
          animation: sheet-scan 3.6s ease-in-out infinite;
        }
        @keyframes sheet-scan {
          0% { transform: translateY(-20%); opacity: 0; }
          15% { opacity: 0.55; }
          85% { opacity: 0.55; }
          100% { transform: translateY(220%); opacity: 0; }
        }
      `}</style>

      {/* Atmospheric base — no photo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 20% 10%, rgba(94,200,192,0.18), transparent 55%)," +
            "radial-gradient(ellipse 60% 50% at 90% 90%, rgba(212,176,106,0.1), transparent 50%)," +
            "linear-gradient(160deg, #0a1622 0%, #0f1f2e 50%, #07121c 100%)",
        }}
      />

      {/* Floating formula ghosts */}
      <div className="pointer-events-none absolute inset-0 font-mono text-[11px] text-mist/[0.08]" aria-hidden>
        {["+4 / −1", "OMR", "Q.14", "NEET", "JEE", "42:18"].map((t, i) => (
          <span
            key={t}
            className="absolute"
            style={{
              left: `${12 + i * 14}%`,
              top: `${18 + ((i * 19) % 55)}%`,
              transform: `translate(${parallaxX * 0.4}px, ${parallaxY * 0.4}px) rotate(${i % 2 ? 8 : -6}deg)`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Animated exam sheet */}
      <div
        className="absolute inset-x-4 top-6 bottom-6 sm:inset-x-8 sm:top-8 sm:bottom-8"
        style={{ transform: `translate(${parallaxX * 0.25}px, ${parallaxY * 0.25}px)` }}
      >
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/12 bg-ink/55 shadow-[0_0_40px_rgba(94,200,192,0.12)] backdrop-blur-[2px]">
          {/* Scan line */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 sheet-scan"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(94,200,192,0.18), transparent)",
            }}
            aria-hidden
          />

          <div className="relative z-20 flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-aurora">Mock OMR</p>
                <p className="font-display text-lg text-mist sm:text-xl">Real-paper rhythm</p>
              </div>
              <div className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 font-mono text-xs text-champagne">
                {String(Math.max(0, 45 - Math.floor(tick / 4))).padStart(2, "0")}:
                {String((60 - (tick % 60)) % 60).padStart(2, "0")}
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden">
              {rows.map((r) => {
                const focused = focusQ === r.q;
                return (
                  <div
                    key={r.q}
                    className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition duration-300 sm:gap-3 sm:px-3 ${
                      focused
                        ? "border-gold/40 bg-gold/10"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`w-7 shrink-0 text-xs font-semibold ${
                        focused ? "text-champagne" : "text-bronze"
                      }`}
                    >
                      Q{r.q}
                    </span>
                    <div className="flex flex-1 flex-wrap gap-1.5 sm:gap-2">
                      {OPTIONS.map((label, opt) => {
                        const selected = r.marked === opt;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => mark(r.q, opt)}
                            className={`omr-bubble flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold sm:h-8 sm:w-8 sm:text-xs ${
                              selected
                                ? "border-aurora bg-aurora text-ink shadow-[0_0_12px_rgba(94,200,192,0.45)]"
                                : "border-white/20 text-bronze hover:border-champagne/50 hover:text-mist"
                            }`}
                            aria-pressed={selected}
                            aria-label={`Question ${r.q} option ${label}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <span className="hidden w-10 text-right text-[10px] text-bronze sm:block">
                      {r.marked === null ? "—" : r.marked === r.correct ? "+4" : "−1"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-bronze">
              <span>
                <span className="text-aurora">{scored.right}</span> correct
              </span>
              <span>
                <span className="text-ember">{scored.wrong}</span> wrong
              </span>
              <span>
                <span className="text-champagne">{scored.blank}</span> blank
              </span>
              <span className="ml-auto font-mono normal-case tracking-normal text-mist">
                Net {scored.net}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticePaperAnim;
