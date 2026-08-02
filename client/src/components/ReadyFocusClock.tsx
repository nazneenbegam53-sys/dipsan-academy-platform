import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * Compact “clock ahead” accent for the Ready CTA —
 * a slim focus chronograph: hold to lock focus, watch the second sweep.
 * Intentionally small — not a full scene or desk UI.
 */
export function ReadyFocusClock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [holding, setHolding] = useState(false);
  const [focus, setFocus] = useState(28);
  const [locked, setLocked] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (holding) {
      const id = window.setInterval(() => {
        setFocus((f) => {
          const next = Math.min(100, f + 3);
          if (next >= 100) setLocked(true);
          return next;
        });
      }, 40);
      return () => window.clearInterval(id);
    }
    if (!locked) {
      const id = window.setInterval(() => {
        setFocus((f) => Math.max(18, f - 1));
      }, 80);
      return () => window.clearInterval(id);
    }
  }, [holding, locked, visible]);

  const angle = (seconds % 60) * 6 - 90;
  const mm = String(Math.floor(seconds / 60) % 60).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 6,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 4,
    });
  }

  function resetLock() {
    setLocked(false);
    setFocus(28);
  }

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      className={`ready-focus-enter mx-auto w-full max-w-sm ${visible ? "is-visible" : ""}`}
    >
      <style>{`
        .ready-focus-enter { opacity: 0; transform: translateY(10px); transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1); }
        .ready-focus-enter.is-visible { opacity: 1; transform: translateY(0); }
        .focus-ring-spin { animation: focus-ring-spin 8s linear infinite; }
        @keyframes focus-ring-spin {
          to { transform: rotate(360deg); }
        }
        .focus-core {
          transition: transform 0.15s ease, box-shadow 0.25s ease;
        }
        .focus-core:active { transform: scale(0.94); }
      `}</style>

      <div
        className="flex items-center justify-center gap-4"
        style={{ transform: `translate(${tilt.x}px, ${tilt.y}px)` }}
      >
        <button
          type="button"
          onPointerDown={() => {
            if (locked) resetLock();
            else setHolding(true);
          }}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          className="focus-core relative h-14 w-14 shrink-0 rounded-full border border-white/15 bg-ink/60 sm:h-16 sm:w-16"
          style={{
            boxShadow: locked
              ? "0 0 22px rgba(94,200,192,0.45)"
              : holding
                ? "0 0 18px rgba(212,176,106,0.4)"
                : "0 0 12px rgba(212,176,106,0.15)",
          }}
          aria-label={locked ? "Focus locked — tap to reset" : "Hold to build focus"}
        >
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={locked ? "#5EC8C0" : "#D4B06A"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(focus / 100) * 176} 176`}
              transform="rotate(-90 32 32)"
            />
            <line
              x1="32"
              y1="32"
              x2={32 + Math.cos((angle * Math.PI) / 180) * 20}
              y2={32 + Math.sin((angle * Math.PI) / 180) * 20}
              stroke="#F0E0B8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="32" r="2.5" fill="#F0E0B8" />
          </svg>
          <span
            className="pointer-events-none absolute inset-0 focus-ring-spin rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(94,200,192,0.35) 8%, transparent 18%)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
              opacity: locked ? 0.9 : 0.4,
            }}
            aria-hidden
          />
        </button>

        <div className="min-w-0 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-bronze">
            Clock ahead · {locked ? "locked" : `${focus}%`}
          </p>
          <p className="mt-0.5 font-mono text-2xl tracking-[0.12em] text-mist">
            <span className="text-champagne">{mm}</span>
            <span className="mx-0.5 text-bronze">:</span>
            <span>{ss}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-bronze">
            {locked ? (
              <span className="text-aurora">Focus locked — you&apos;re ready.</span>
            ) : holding ? (
              <span className="text-champagne">Holding focus…</span>
            ) : (
              "Hold the dial to lock focus."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReadyFocusClock;
