import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

type Attempt = {
  id: string;
  name: string;
  score: number;
  max: number;
};

type QStat = {
  q: number;
  accuracy: number;
};

const SEED_ATTEMPTS: Attempt[] = [
  { id: "a1", name: "A. Sharma", score: 148, max: 180 },
  { id: "a2", name: "R. Patel", score: 132, max: 180 },
  { id: "a3", name: "S. Khan", score: 156, max: 180 },
  { id: "a4", name: "M. Iyer", score: 120, max: 180 },
  { id: "a5", name: "P. Das", score: 164, max: 180 },
];

/** Accuracy settles as attempts arrive — no random wobble. */
const ACCURACY_BY_COUNT: QStat[][] = [
  [
    { q: 1, accuracy: 100 },
    { q: 2, accuracy: 100 },
    { q: 3, accuracy: 0 },
    { q: 4, accuracy: 100 },
    { q: 5, accuracy: 0 },
    { q: 6, accuracy: 100 },
  ],
  [
    { q: 1, accuracy: 100 },
    { q: 2, accuracy: 50 },
    { q: 3, accuracy: 0 },
    { q: 4, accuracy: 100 },
    { q: 5, accuracy: 50 },
    { q: 6, accuracy: 50 },
  ],
  [
    { q: 1, accuracy: 100 },
    { q: 2, accuracy: 67 },
    { q: 3, accuracy: 33 },
    { q: 4, accuracy: 100 },
    { q: 5, accuracy: 33 },
    { q: 6, accuracy: 67 },
  ],
  [
    { q: 1, accuracy: 75 },
    { q: 2, accuracy: 50 },
    { q: 3, accuracy: 25 },
    { q: 4, accuracy: 100 },
    { q: 5, accuracy: 50 },
    { q: 6, accuracy: 75 },
  ],
  [
    { q: 1, accuracy: 80 },
    { q: 2, accuracy: 60 },
    { q: 3, accuracy: 40 },
    { q: 4, accuracy: 100 },
    { q: 5, accuracy: 60 },
    { q: 6, accuracy: 80 },
  ],
];

const EMPTY_STATS: QStat[] = [1, 2, 3, 4, 5, 6].map((q) => ({ q, accuracy: 0 }));

/**
 * Interactive “Publish once. Read every attempt.” panel —
 * Tap Publish → attempts stream in → tap accuracy bars to inspect.
 * Does not auto-publish (matches the on-page instruction).
 */
export function TeachersPublishAnim() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [published, setPublished] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [focusQ, setFocusQ] = useState<number | null>(null);
  const [stats, setStats] = useState<QStat[]>(EMPTY_STATS);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const userPickedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: "40px" }
    );
    io.observe(el);
    // Fallback if IO never fires (e.g. already on-screen quirks)
    const fallback = window.setTimeout(() => setVisible(true), 900);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  // Stream attempts only after the user taps Publish
  useEffect(() => {
    if (!published || !visible) return;
    if (attempts.length >= SEED_ATTEMPTS.length) return;

    const id = window.setTimeout(() => {
      const next = SEED_ATTEMPTS[attempts.length];
      if (!next) return;
      const count = attempts.length + 1;
      setAttempts((prev) => [...prev, next]);
      setStats(ACCURACY_BY_COUNT[count - 1] ?? EMPTY_STATS);
      // Soft highlight newest weak question unless user is inspecting
      if (!userPickedRef.current) {
        const board = ACCURACY_BY_COUNT[count - 1] ?? EMPTY_STATS;
        const weak = board.find((s) => s.accuracy < 50);
        setFocusQ(weak?.q ?? board[0]?.q ?? 1);
      }
    }, attempts.length === 0 ? 450 : 900);

    return () => window.clearTimeout(id);
  }, [published, visible, attempts.length]);

  const liveCount = attempts.length;
  const avg =
    liveCount === 0
      ? 0
      : Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / liveCount);

  const parallaxX = (pointer.x - 0.5) * 10;
  const parallaxY = (pointer.y - 0.5) * 8;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  function publishNow() {
    if (published) {
      // Reset so the “Tap Publish…” flow can be tried again
      setPublished(false);
      setAttempts([]);
      setStats(EMPTY_STATS);
      setFocusQ(null);
      userPickedRef.current = false;
      return;
    }
    setPublished(true);
    userPickedRef.current = false;
    setFocusQ(null);
  }

  function inspectQ(q: number) {
    if (!published) return;
    userPickedRef.current = true;
    setFocusQ(q);
  }

  const focusedStat = focusQ != null ? stats.find((s) => s.q === focusQ) : null;

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
        .teachers-publish-enter { opacity: 0; transform: translateY(10px); transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1); }
        .teachers-publish-enter.is-visible { opacity: 1; transform: translateY(0); }
        .pub-bar { transition: width 0.55s cubic-bezier(0.22,1,0.36,1), background 0.3s ease; }
        .attempt-row { animation: attempt-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
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
        className="absolute inset-x-3 top-4 bottom-4 sm:inset-x-6 sm:top-6 sm:bottom-6"
        style={{ transform: `translate(${parallaxX * 0.15}px, ${parallaxY * 0.15}px)` }}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-ink/60 shadow-[0_0_40px_rgba(212,176,106,0.1)] backdrop-blur-[2px]">
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
              className={`relative z-10 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                published
                  ? "border-aurora/50 bg-aurora/15 text-aurora pub-pulse hover:border-white/30 hover:text-mist"
                  : "border-gold/50 bg-gold/20 text-champagne hover:bg-gold/30"
              }`}
              aria-pressed={published}
              aria-label={published ? "Reset to draft" : "Publish paper"}
              title={published ? "Tap to reset and try again" : "Publish the paper"}
            >
              {published ? "Live · reset" : "Publish"}
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 sm:grid-cols-2">
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
              <div className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
                {!published && (
                  <p className="py-6 text-center text-[11px] leading-relaxed text-bronze">
                    Tap <span className="text-champagne">Publish</span> to open the paper.
                    <br />
                    Attempts will stream in live.
                  </p>
                )}
                {published && attempts.length === 0 && (
                  <p className="py-6 text-center text-[11px] text-bronze">Waiting for first attempt…</p>
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
                  Avg{" "}
                  <span className="font-mono normal-case tracking-normal text-mist">
                    {avg || "—"}
                  </span>
                </span>
                <span className={published ? "text-aurora" : "text-bronze"}>
                  {liveCount} live
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-col p-3 sm:p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-bronze">
                Question accuracy
              </p>
              <p className="mt-0.5 text-[10px] text-bronze/80">
                {published ? "Tap a bar to inspect" : "Unlocks after Publish"}
              </p>
              <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
                {stats.map((s) => {
                  const focused = focusQ === s.q;
                  const weak = published && s.accuracy < 50;
                  const width = published && liveCount > 0 ? `${s.accuracy}%` : "0%";
                  return (
                    <button
                      key={s.q}
                      type="button"
                      onClick={() => inspectQ(s.q)}
                      disabled={!published || liveCount === 0}
                      className={`relative z-10 flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition disabled:cursor-not-allowed ${
                        focused ? "bg-gold/15 ring-1 ring-gold/35" : "hover:bg-white/[0.04]"
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
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`pub-bar h-full rounded-full ${
                            weak ? "bg-ember/85" : "bg-aurora/85"
                          }`}
                          style={{
                            width,
                            opacity: published && liveCount > 0 ? 1 : 0.25,
                          }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right font-mono text-[10px] text-mist">
                        {published && liveCount > 0 ? `${s.accuracy}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-bronze">
                {!published ? (
                  "Tap Publish, then inspect the accuracy bars."
                ) : liveCount === 0 ? (
                  "Accuracy fills as attempts arrive."
                ) : focusedStat ? (
                  <>
                    Focus <span className="text-champagne">Q{focusedStat.q}</span>
                    {focusedStat.accuracy < 50 ? (
                      <span className="text-ember"> · needs review</span>
                    ) : (
                      <span className="text-aurora"> · holding well</span>
                    )}
                  </>
                ) : (
                  "Tap any bar to inspect a question."
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
