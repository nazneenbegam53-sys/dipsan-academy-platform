import { useEffect, useMemo, useState } from "react";

export type SubjectKey = "physics" | "chemistry" | "maths" | "biology";

const SUBJECT_META: Record<
  SubjectKey,
  { label: string; accent: string; glow: string; hint: string; mark: string }
> = {
  physics: {
    label: "Physics",
    accent: "#5EC8C0",
    glow: "rgba(94,200,192,0.35)",
    hint: "Forces, fields & motion",
    mark: "F = ma",
  },
  chemistry: {
    label: "Chemistry",
    accent: "#D4B06A",
    glow: "rgba(212,176,106,0.35)",
    hint: "Atoms, bonds & reactions",
    mark: "ΔH",
  },
  maths: {
    label: "Maths",
    accent: "#F0E0B8",
    glow: "rgba(240,224,184,0.3)",
    hint: "Patterns, proofs & precision",
    mark: "∑",
  },
  biology: {
    label: "Biology",
    accent: "#7DCEA0",
    glow: "rgba(125,206,160,0.35)",
    hint: "Life, cells & systems",
    mark: "DNA",
  },
};

const FACTS: Record<SubjectKey, string[]> = {
  physics: [
    "Light takes about 8 minutes 20 seconds to travel from the Sun to Earth — that delay is why we always see the Sun slightly in the past.",
    "A neutron star’s teaspoon of material would weigh billions of tonnes on Earth — denser than an atomic nucleus packed tight.",
    "Lightning heats air to ~30,000°C, hotter than the Sun’s surface, which is why you hear thunder from the rapid expansion.",
    "Your phone accelerometer is a tiny MEMS device that measures proper acceleration — the same idea as weightlessness in free fall.",
    "In free fall, every object accelerates the same way under gravity — feather or hammer — until air resistance gets involved.",
    "Sound needs a medium; in space, explosions are silent. Movies add sound for drama, not physics.",
    "The escape velocity from Earth is about 11.2 km/s — slower than that and gravity eventually pulls you back.",
    "Ohm’s law (V = IR) is linear only for ohmic materials; semiconductors and LEDs break that simple straight line.",
  ],
  chemistry: [
    "Diamond and graphite are both pure carbon — same atoms, different lattices, wildly different hardness and conductivity.",
    "Water expands when it freezes, which is why ice floats and why lakes rarely freeze solid — life under the ice survives winters.",
    "A mole of anything contains 6.022×10²³ particles — Avogadro’s number — the chemist’s bridge between atoms and grams.",
    "Noble gases were once thought completely inert; today xenon compounds and neon signs prove chemistry is never finished.",
    "Catalysts speed reactions without being consumed — they lower activation energy, like a shorter mountain pass.",
    "pH 7 is neutral only at 25°C for pure water; temperature shifts Kw, so ‘neutral’ isn’t always exactly 7.",
    "Salt dissolves because water’s polarity stabilises Na⁺ and Cl⁻ ions — solvent–solute forces win over the crystal lattice.",
    "Combustion of hydrocarbons isn’t just ‘burning’ — it’s a redox race where oxygen oxidises carbon and hydrogen.",
  ],
  maths: [
    "Zero was formalised in Indian mathematics centuries ago — a placeholder that unlocked place value and modern algebra.",
    "π is transcendental: it never ends and never repeats, yet it ties circles, waves, and probability together.",
    "e ≈ 2.718… appears in continuous growth, radioactive decay, and compound interest — nature’s favourite base.",
    "The golden ratio φ ≈ 1.618 shows up in pentagons, spirals, and some growth patterns — geometry meeting aesthetics.",
    "A set can be infinite yet countable (integers) or uncountable (reals) — infinity comes in different sizes.",
    "Prime numbers never stop: Euclid’s proof shows there is no largest prime — only larger ones waiting to be found.",
    "Derivatives measure instantaneous rate of change; integrals accumulate — calculus is the language of motion and area.",
    "In a triangle, the sum of interior angles is 180° on a flat plane — but not on a sphere, where geometry bends.",
  ],
  biology: [
    "Mitochondria have their own DNA — a clue they once were free-living bacteria that joined our cells long ago.",
    "Your body replaces most red blood cells every ~120 days — a quiet renewal factory working while you sleep.",
    "DNA’s double helix stores ~3 billion base pairs in humans, yet fits inside a cell nucleus only a few micrometres across.",
    "Plants ‘breathe’ opposite to us by day: photosynthesis takes in CO₂ and releases O₂ — the planet’s oxygen engine.",
    "Neurons can fire hundreds of times per second; thought is electricity and chemistry dancing across synapses.",
    "Antibiotics target bacteria, not viruses — which is why a cold doesn’t improve with antibacterial pills.",
    "The human microbiome outnumbers our own cells; gut microbes help digest food and train the immune system.",
    "Enzymes are biological catalysts — shape-specific proteins that make life’s reactions fast enough to sustain us.",
  ],
};

function pickFact(subject: SubjectKey, avoid?: string) {
  const list = FACTS[subject];
  if (list.length === 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  let guard = 0;
  while (next === avoid && guard++ < 8) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

export function SubjectFunFactPanel({
  subject,
  onClose,
}: {
  subject: SubjectKey;
  onClose: () => void;
}) {
  const meta = SUBJECT_META[subject];
  const [fact, setFact] = useState(() => pickFact(subject));
  const [factKey, setFactKey] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setFact(pickFact(subject));
    setFactKey((k) => k + 1);
  }, [subject]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close handler uses local visible state
  }, []);

  function requestClose() {
    setVisible(false);
    window.setTimeout(onClose, 280);
  }

  function shuffle() {
    setFact((prev) => pickFact(subject, prev));
    setFactKey((k) => k + 1);
  }

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        top: `${12 + ((i * 29) % 70)}%`,
        delay: `${(i % 7) * 0.18}s`,
        size: 2 + (i % 3),
      })),
    [subject]
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fun-fact-title"
    >
      <button
        type="button"
        aria-label="Close fun fact"
        className={`absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={requestClose}
      />

      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/12 bg-coal/95 shadow-2xl transition-all duration-300 ease-out ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.96] opacity-0"
        }`}
        style={{ boxShadow: `0 0 60px ${meta.glow}` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 55% at 20% 0%, ${meta.glow}, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(212,176,106,0.08), transparent 50%)`,
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full animate-star-twinkle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: meta.accent,
                opacity: 0.45,
                animationDelay: p.delay,
                boxShadow: `0 0 8px ${meta.accent}`,
              }}
            />
          ))}
        </div>

        <div className="relative px-6 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ borderColor: `${meta.accent}55`, color: meta.accent }}
              >
                <span aria-hidden className="font-mono text-[11px] normal-case tracking-normal">
                  {meta.mark}
                </span>
                Fun fact
              </div>
              <h3
                id="fun-fact-title"
                className="mt-3 font-display text-3xl font-semibold tracking-tight text-mist md:text-4xl"
              >
                {meta.label}
              </h3>
              <p className="mt-1 text-sm text-bronze">{meta.hint}</p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-bronze transition hover:border-gold/50 hover:text-gold"
            >
              Close
            </button>
          </div>

          <div
            key={factKey}
            className="fact-card-enter mt-6 rounded-2xl border border-white/10 bg-ink/50 px-5 py-5 md:px-6 md:py-6"
          >
            <p
              className="font-display text-xl leading-snug text-mist md:text-2xl"
              style={{ textShadow: `0 0 24px ${meta.glow}` }}
            >
              {fact}
            </p>
            <div
              className="mt-4 h-px w-16 origin-left animate-underline-grow"
              style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent)` }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={shuffle}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold tracking-wide text-ink transition hover:brightness-110"
              style={{ background: meta.accent }}
            >
              Another fact
            </button>
            <p className="text-xs text-bronze">Tap again on a subject anytime for a new surprise.</p>
          </div>
        </div>
      </div>

      <style>{`
        .fact-card-enter {
          animation: fact-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes fact-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}

export function SubjectNav({
  active,
  onSelect,
}: {
  active: SubjectKey | null;
  onSelect: (s: SubjectKey) => void;
}) {
  const items: SubjectKey[] = ["physics", "chemistry", "maths", "biology"];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6 sm:gap-5">
      {items.map((key, i) => {
        const meta = SUBJECT_META[key];
        const isActive = active === key;
        return (
          <div key={key} className="flex items-center gap-3 sm:gap-5">
            {i > 0 && (
              <span
                className="hidden h-1 w-1 rounded-full sm:block"
                style={{ background: i % 2 === 0 ? "var(--aurora)" : "var(--gold)" }}
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(key)}
              className={`group relative rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 ${
                isActive ? "text-ink" : "text-bronze hover:text-mist"
              }`}
              style={
                isActive
                  ? { background: meta.accent, boxShadow: `0 0 22px ${meta.glow}` }
                  : undefined
              }
              aria-pressed={isActive}
            >
              <span
                className={`absolute inset-0 -z-10 rounded-full opacity-0 transition duration-300 group-hover:opacity-100 ${
                  isActive ? "opacity-0" : ""
                }`}
                style={{ boxShadow: `0 0 18px ${meta.glow}` }}
                aria-hidden
              />
              {meta.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
