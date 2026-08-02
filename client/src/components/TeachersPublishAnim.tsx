import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

type Attempt = {
  id: string;
  name: string;
  score: number;
  max: number;
  mins: number;
};

type QStat = {
  q: number;
  accuracy: number;
};

const SEED_ATTEMPTS: Attempt[] = [
  { id: "a1", name: "A. Sharma", score: 148, max: 180, mins: 168 },
  { id: "a2", name: "R. Patel", score: 132, max: 180, mins: 175 },
  { id: "a3", name: "S. Khan", score: 156, max: 180, mins: 152 },
  { id: "a4", name: "M. Iyer", score: 120, max: 180, mins: 179 },
  { id: "a5", name: "P. Das", score: 164, max: 180, mins: 141 },
];

const SEED_STATS: QStat[] = [
  { q: 1, accuracy: 78 },
  { q: 2, accuracy: 62 },
  { q: 3, accuracy: 41 },
  { q: 4, accuracy: 88 },
  { q: 5, accuracy: 55 },
  { q: 6, accuracy: 71 },
];

/**
 * Interactive “Publish once. Read every attempt.” panel —
 * draft → live publish, live attempt feed, and tap-to-inspect accuracy.
 */
export function TeachersPublishAnim() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [published, setPublished] = useState(false);
  const [tick, setTick] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [focusQ, setFocusQ] = useState(3);
  const [stats, setStats] = useState<QStat[]>(SEED_STATS);
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

  // Auto-publish shortly after entering view
  useEffect(() => {
    if (!visible || published) return;
    const id = window.setTimeout(() => setPublished(true), 1200);
    return () => window.clearTimeout(id);
  }, [visible, published]);

  useEffect(() => {
    if (!visible || !published) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1100);
    return () => window.clearInterval(id);
  }, [visible, published]);

  // Stream attempts one-by-one after publish
  useEffect(() => {
    if (!published) return;
    const next = SEED_ATTEMPTS[attempts.length];
    if (!next) return;
    if (tick < attempts.length + 1) return;
    setAttempts((prev) => [...prev, next]);
  }, [tick, published, attempts.length]);

  // Soft-pulse accuracy on the focused question
  useEffect(() => {
    if (!published || attempts.length === 0) return;
    setFocusQ((q) => (q % 6) + 1);
    setStats((prev) =>
      prev.map((s) => {
        const wobble = ((tick + s.q) % 5) - 2;
        return { ...s, accuracy: Math.max(18, Math.min(96, s.accuracy + wobble)) };
      })
    );
  }, [tick, published, attempts.length]);

  const liveCount = attempts.length;
  const avg =
    liveCount === 0
      ? 0
      : Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / liveCount);

  const parallaxX = (pointer.x - 0.5) * 12;
  const parallaxY = (pointer.y - 0.5) * 10;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  function publishNow() {
    setPublished(true);
  }

  function inspectQ(q: number) {
    setFocusQ(q);
  }

  const ghosts = useMemo(
    () => ["PUBLISH", "Q-BANK", "NEET", "JEE", "Δ%", "OMR"],
    []
  );

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      className={`pointer-events-auto absolute inset-0 overflow-hidden teachers-publish-enter ${
        visible ? "is-visible" : ""
      }`}
    >
      <style>{`
        .teachers-publish-enter { opacity: 0; transform: scale(1.02); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22,1,0.36,1); }
        .teachers-publish-enter.is-visible { opacity: 1; transform: scale(1); }
        .pub-bar { transition: width 0.55s cubic-bezier(0.22,1,0.36,1), background 0.3s ease; }
        .attempt-row { animation: attempt-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes attempt-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pub-pulse {
          animation: pub-pulse 1.8s ease-in-out infinite;
        }
        @keyframes pub-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(94,200,192,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(94,200,192,0); }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 50% at 85% 15%, rgba(212,176,106,0.14), transparent 55%)," +
            "radial-gradient(ellipse 60% 55% at 10% 85%, rgba(94,200,192,0.14), transparent 50%)," +
            "linear-gradient(200deg, #0a1622 0%, #0f1f2e 55%, #07121c 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 font-mono text-[11px] text-mist/[0.08]" aria-hidden>
        {ghosts.map((t, i) => (
          <span
            key={t}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${14 + ((i * 23) % 60)}%`,
              transform: `translate(${parallaxX * 0.35}px, ${parallaxY * 0.35}px) rotate(${i % 2 ? -7 : 6}deg)`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        className="absolute inset-x-4 top-6 bottom-6 sm:inset-x-8 sm:top-8 sm:bottom-8"
        style={{ transform: `translate(${parallaxX * 0.2}px, ${parallaxY * 0.2}px)` }}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-ink/55 shadow-[0_0_40px_rgba(212,176,106,0.1)] backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
                Teacher desk
              </p>
              <p className="font-display text-lg text-mist sm:text-xl">Publish &amp; inspect</p>
            </div>
            <button
              type="button"
              onClick={publishNow}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                published
                  ? "border-aurora/50 bg-aurora/15 text-aurora pub-pulse"
                  : "border-gold/40 bg-gold/15 text-champagne hover:bg-gold/25"
              }`}
              aria-pressed={published}
            >
              {published ? "Live" : "Publish"}
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 sm:grid-cols-2">
            {/* Paper + attempts */}
            <div className="flex min-h-0 flex-col border-b border-white/10 p-3 sm:border-b-0 sm:border-r sm:p-4">
              <div
                className={`rounded-xl border px-3 py-2 transition duration-500 ${
                  published
                    ? "border-aurora/35 bg-aurora/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-mist">NEET Mock · Set B</span>
                  <span
                    className={`text-[9px] uppercase tracking-[0.14em] ${
                      published ? "text-aurora" : "text-bronze"
                    }`}
                  >
                    {published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-bronze">45 Q · image figures · −1 marking</p>
              </div>

              <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-bronze">
                Attempts {liveCount}/5
              </p>
              <div className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                {!published && (
                  <p className="py-4 text-center text-[11px] text-bronze/80">
                    Tap Publish to open the paper.
                  </p>
                )}
                {attempts.map((a) => (
                  <div
                    key={a.id}
                    className="attempt-row flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5"
                  >
                    <span className="truncate text-xs text-mist">{a.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-[11px] text-champagne">
                      {a.score}/{a.max}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] uppercase tracking-[0.12em] text-bronze">
                <span>
                  Avg <span className="font-mono normal-case tracking-normal text-mist">{avg || "—"}</span>
                </span>
                <span className="text-aurora">{liveCount} live</span>
              </div>
            </div>

            {/* Question accuracy */}
            <div className="flex min-h-0 flex-col p-3 sm:p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-bronze">
                Question accuracy
              </p>
              <p className="mt-0.5 text-[10px] text-bronze/80">Tap a bar to inspect</p>
              <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-hidden">
                {stats.map((s) => {
                  const focused = focusQ === s.q;
                  const weak = s.accuracy < 50;
                  return (
                    <button
                      key={s.q}
                      type="button"
                      onClick={() => inspectQ(s.q)}
                      className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition ${
                        focused ? "bg-gold/10" : "hover:bg-white/[0.04]"
                      }`}
                      aria-pressed={focused}
                      aria-label={`Question ${s.q} accuracy ${s.accuracy}%`}
                    >
                      <span
                        className={`w-6 shrink-0 text-[10px] font-semibold ${
                          focused ? "text-champagne" : "text-bronze"
                        }`}
                      >
                        Q{s.q}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`pub-bar h-full rounded-full ${
                            weak ? "bg-ember/80" : "bg-aurora/80"
                          }`}
                          style={{
                            width: published ? `${s.accuracy}%` : "8%",
                            opacity: published ? 1 : 0.35,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-mist">
                        {published ? `${s.accuracy}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-bronze">
                {published ? (
                  <>
                    Focus <span className="text-champagne">Q{focusQ}</span>
                    {stats.find((s) => s.q === focusQ)?.accuracy != null &&
                    (stats.find((s) => s.q === focusQ)!.accuracy < 50) ? (
                      <span className="text-ember"> · needs review</span>
                    ) : (
                      <span className="text-aurora"> · holding well</span>
                    )}
                  </>
                ) : (
                  "Accuracy unlocks after publish."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeachersPublishAnim;
