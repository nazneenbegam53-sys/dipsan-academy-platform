import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

/**
 * Interactive “Ready when you are” hall entrance —
 * doors open into the exam hall, clock ticks ahead, focus pulse.
 * Tap doors / Enter to open; tap the dial to pause the clock.
 */
export function ReadyHallAnim() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(3 * 60 + 0); // 03:00 to start
  const [focus, setFocus] = useState(62);
  const [seat, setSeat] = useState(14);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

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

  // Auto-open doors shortly after entering view
  useEffect(() => {
    if (!visible || open) return;
    const id = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(id);
  }, [visible, open]);

  useEffect(() => {
    if (!visible || paused || !open) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 0 ? 45 * 60 : s - 1));
      setFocus((f) => {
        const step = f % 2 === 0 ? 1 : -1;
        return Math.max(48, Math.min(98, f + step));
      });
      setSeat((n) => (n % 24) + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [visible, paused, open]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (45 * 60);
  const handAngle = -90 + progress * 360;

  const parallax = useMemo(
    () => ({
      x: (pointer.x - 0.5) * 16,
      y: (pointer.y - 0.5) * 12,
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

  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 19) % 88)}%`,
        top: `${8 + ((i * 27) % 72)}%`,
        delay: `${(i % 5) * 0.28}s`,
        size: 1.5 + (i % 3),
      })),
    []
  );

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      className={`relative h-[340px] w-full overflow-hidden rounded-3xl border border-white/10 md:h-[400px] ready-hall-enter ${
        visible ? "is-visible" : ""
      }`}
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(212,176,106,0.16), transparent 55%)," +
          "radial-gradient(ellipse 55% 50% at 20% 90%, rgba(94,200,192,0.14), transparent 50%)," +
          "linear-gradient(175deg, #0a1622 0%, #0f1f2e 50%, #07121c 100%)",
        boxShadow: "0 0 0 1px rgba(212,176,106,0.16), 0 18px 48px rgba(0,0,0,0.35)",
      }}
    >
      <style>{`
        .ready-hall-enter { opacity: 0; transform: translateY(16px) scale(0.98); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .ready-hall-enter.is-visible { opacity: 1; transform: translateY(0) scale(1); }
        .hall-door {
          transition: transform 0.85s cubic-bezier(0.22,1,0.36,1);
          transform-origin: left center;
        }
        .hall-door.right { transform-origin: right center; }
        .hall-door.open.left { transform: perspective(800px) rotateY(-68deg); }
        .hall-door.open.right { transform: perspective(800px) rotateY(68deg); }
        .hall-tick { animation: hall-pulse 1.2s ease-in-out infinite; }
        @keyframes hall-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .focus-breathe {
          animation: focus-breathe 2.4s ease-in-out infinite;
        }
        @keyframes focus-breathe {
          0%, 100% { transform: scaleX(1); opacity: 0.85; }
          50% { transform: scaleX(1.04); opacity: 1; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-champagne/70 animate-star-twinkle"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Exam hall
            </p>
            <p className="mt-1 font-display text-2xl text-mist sm:text-3xl">
              Enter with focus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
              open
                ? "border-aurora/45 bg-aurora/15 text-aurora"
                : "border-gold/40 bg-gold/15 text-champagne hover:bg-gold/25"
            }`}
            aria-pressed={open}
          >
            {open ? "Inside" : "Enter hall"}
          </button>
        </div>

        <div className="relative mt-3 min-h-0 flex-1">
          {/* Hall interior (behind doors) */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-ink/40"
            style={{ transform: `translate(${parallax.x * 0.12}px, ${parallax.y * 0.12}px)` }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(94,200,192,0.08) 100%)," +
                  "repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.03) 28px, rgba(255,255,255,0.03) 29px)",
              }}
              aria-hidden
            />

            <div className="relative z-10 grid h-full grid-cols-[1fr_minmax(0,1.1fr)] items-center gap-2 p-3 sm:gap-4 sm:p-4">
              {/* Clock ahead */}
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="relative mx-auto aspect-square w-full max-w-[140px] cursor-pointer border-0 bg-transparent p-0 sm:max-w-[168px]"
                aria-label={paused ? "Resume clock" : "Pause clock"}
              >
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <circle
                    cx="100"
                    cy="100"
                    r="86"
                    fill="none"
                    stroke="#D4B06A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(4, progress * 540)} 540`}
                    transform="rotate(-90 100 100)"
                    style={{ filter: "drop-shadow(0 0 8px rgba(212,176,106,0.5))" }}
                  />
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = ((i * 30 - 90) * Math.PI) / 180;
                    return (
                      <line
                        key={i}
                        x1={100 + Math.cos(a) * 72}
                        y1={100 + Math.sin(a) * 72}
                        x2={100 + Math.cos(a) * 80}
                        y2={100 + Math.sin(a) * 80}
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
                    stroke="#5EC8C0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={paused || !open ? "" : "hall-tick"}
                    style={{ filter: "drop-shadow(0 0 6px rgba(94,200,192,0.55))" }}
                  />
                  <circle cx="100" cy="100" r="4" fill="#F0E0B8" />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-semibold tracking-wider text-mist sm:text-2xl">
                    {mm}:{ss}
                  </span>
                  <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-bronze">
                    {paused ? "paused" : "clock ahead"}
                  </span>
                </div>
              </button>

              {/* Focus + seat */}
              <div className="min-w-0 space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze">
                      Focus
                    </p>
                    <span className="font-mono text-xs text-champagne">{focus}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`focus-breathe h-full rounded-full bg-aurora/85 ${open ? "" : "opacity-40"}`}
                      style={{ width: `${open ? focus : 20}%`, transformOrigin: "left center" }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-bronze">Seat</p>
                  <p className="mt-0.5 font-mono text-lg text-mist">
                    H-{String(seat).padStart(2, "0")}
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed text-bronze">
                  {open ? (
                    <>
                      Doors open ·{" "}
                      <span className="text-aurora">{paused ? "clock held" : "time running"}</span>
                    </>
                  ) : (
                    "Tap Enter hall — doors swing open."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Doors overlay */}
          <div
            className={`absolute inset-0 z-20 flex overflow-hidden rounded-2xl ${
              open ? "pointer-events-none" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`hall-door left relative w-1/2 border-0 bg-transparent p-0 ${
                open ? "pointer-events-none open left" : "pointer-events-auto"
              }`}
              aria-label="Open left door"
              tabIndex={open ? -1 : 0}
            >
              <div
                className="absolute inset-0 border-r border-white/15"
                style={{
                  background:
                    "linear-gradient(135deg, #122033 0%, #0c1826 55%, #15283a 100%)",
                  boxShadow: "inset -8px 0 24px rgba(0,0,0,0.35)",
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-2 rounded-full bg-gold/50" />
              {!open && (
                <span className="absolute inset-x-2 bottom-4 text-center text-[9px] uppercase tracking-[0.18em] text-bronze">
                  Hall
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`hall-door right relative w-1/2 border-0 bg-transparent p-0 ${
                open ? "pointer-events-none open right" : "pointer-events-auto"
              }`}
              aria-label="Open right door"
              tabIndex={open ? -1 : 0}
            >
              <div
                className="absolute inset-0 border-l border-white/15"
                style={{
                  background:
                    "linear-gradient(225deg, #122033 0%, #0c1826 55%, #15283a 100%)",
                  boxShadow: "inset 8px 0 24px rgba(0,0,0,0.35)",
                }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-2 rounded-full bg-gold/50" />
              {!open && (
                <span className="absolute inset-x-2 bottom-4 text-center text-[9px] uppercase tracking-[0.18em] text-bronze">
                  Door
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadyHallAnim;
