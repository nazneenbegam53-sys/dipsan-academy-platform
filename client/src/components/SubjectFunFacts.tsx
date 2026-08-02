import { useEffect, useMemo, useState } from "react";

export type SubjectKey = "physics" | "chemistry" | "maths" | "biology";

type DiagramId =
  | "sun-earth"
  | "dense-star"
  | "lightning"
  | "free-fall"
  | "sound-wave"
  | "orbit-escape"
  | "circuit"
  | "carbon-lattice"
  | "ice-water"
  | "mole"
  | "catalyst"
  | "ph-scale"
  | "salt-dissolve"
  | "combustion"
  | "zero-place"
  | "pi-circle"
  | "growth-e"
  | "golden-spiral"
  | "infinity"
  | "primes"
  | "calculus"
  | "triangle"
  | "mitochondria"
  | "blood-cell"
  | "dna"
  | "photosynthesis"
  | "neuron"
  | "microbe"
  | "enzyme";

type FactItem = { text: string; diagram: DiagramId };

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

const FACTS: Record<SubjectKey, FactItem[]> = {
  physics: [
    { text: "Light takes about 8 minutes 20 seconds to travel from the Sun to Earth — we always see the Sun slightly in the past.", diagram: "sun-earth" },
    { text: "A neutron star’s teaspoon of material would weigh billions of tonnes — denser than an atomic nucleus packed tight.", diagram: "dense-star" },
    { text: "Lightning heats air to ~30,000°C, hotter than the Sun’s surface — thunder is that rapid expansion you hear.", diagram: "lightning" },
    { text: "In free fall, every object accelerates the same under gravity — feather or hammer — until air resistance matters.", diagram: "free-fall" },
    { text: "Sound needs a medium; in space, explosions are silent. Movies add sound for drama, not physics.", diagram: "sound-wave" },
    { text: "Earth’s escape velocity is about 11.2 km/s — slower than that and gravity eventually pulls you back.", diagram: "orbit-escape" },
    { text: "Ohm’s law (V = IR) is linear only for ohmic materials; semiconductors and LEDs break that straight line.", diagram: "circuit" },
    { text: "Your phone’s accelerometer measures proper acceleration — the same idea behind weightlessness in free fall.", diagram: "free-fall" },
    { text: "c ≈ 3×10⁸ m/s is not only light’s speed — it is the cosmic speed limit for information itself.", diagram: "sun-earth" },
    { text: "A black hole’s event horizon is where escape velocity equals c — nothing, not even light, can climb out.", diagram: "dense-star" },
    { text: "Momentum p = mv is conserved in isolated systems — collisions rearrange velocities, not total momentum.", diagram: "free-fall" },
    { text: "Kinetic energy is ½mv² — double the speed and you quadruple the energy that brakes must shed.", diagram: "orbit-escape" },
    { text: "Magnetic fields never begin or end; field lines form closed loops — Gauss’s law for magnetism in action.", diagram: "circuit" },
    { text: "Resonance makes a swing go higher with tiny timed pushes — forced oscillators love their natural frequency.", diagram: "sound-wave" },
    { text: "Total internal reflection traps light in optical fibres — the backbone of high-speed internet.", diagram: "sun-earth" },
    { text: "Snell’s law bends rays at interfaces: n₁sinθ₁ = n₂sinθ₂ — why a straw looks broken in water.", diagram: "sun-earth" },
    { text: "Capacitors store energy in electric fields; inductors store it in magnetic fields — AC circuits trade both.", diagram: "circuit" },
    { text: "The photoelectric effect showed light comes in packets (photons) — Einstein’s Nobel-winning insight.", diagram: "lightning" },
    { text: "Centripetal force always points toward the centre — without it, circular motion becomes a straight-line escape.", diagram: "orbit-escape" },
    { text: "Bernoulli’s principle links faster flow with lower pressure — a key idea behind lift on a wing.", diagram: "sound-wave" },
  ],
  chemistry: [
    { text: "Diamond and graphite are both pure carbon — same atoms, different lattices, wildly different properties.", diagram: "carbon-lattice" },
    { text: "Water expands when it freezes, so ice floats — lakes rarely freeze solid and life can survive under the ice.", diagram: "ice-water" },
    { text: "A mole holds 6.022×10²³ particles — Avogadro’s number bridges the tiny world of atoms to grams on a balance.", diagram: "mole" },
    { text: "Catalysts speed reactions without being consumed — they lower activation energy, like a shorter mountain pass.", diagram: "catalyst" },
    { text: "pH 7 is neutral only at 25°C for pure water; temperature shifts Kw, so ‘neutral’ isn’t always exactly 7.", diagram: "ph-scale" },
    { text: "Salt dissolves because water’s polarity stabilises Na⁺ and Cl⁻ — solvent forces beat the crystal lattice.", diagram: "salt-dissolve" },
    { text: "Combustion of hydrocarbons is a redox race — oxygen oxidises carbon and hydrogen, releasing energy.", diagram: "combustion" },
    { text: "Noble gases were once thought fully inert; xenon compounds and neon lights show chemistry keeps surprising us.", diagram: "mole" },
    { text: "Isotopes share proton count but differ in neutrons — same chemistry, different mass and nuclear behaviour.", diagram: "mole" },
    { text: "Endothermic reactions absorb heat; exothermic ones release it — enthalpy tells you which way the ledger tips.", diagram: "combustion" },
    { text: "Le Chatelier’s principle: stress a system at equilibrium and it shifts to partially undo that stress.", diagram: "catalyst" },
    { text: "Buffers resist pH swings — weak acid/base pairs keep blood near 7.4 despite metabolic acid loads.", diagram: "ph-scale" },
    { text: "Covalent bonds share electrons; ionic bonds transfer them — two strategies for a full outer shell.", diagram: "carbon-lattice" },
    { text: "Hydrogen bonding gives water its high boiling point and the unique structure of ice’s open lattice.", diagram: "ice-water" },
    { text: "Electronegativity rises toward fluorine — the tug-of-war that makes polar bonds and molecular dipoles.", diagram: "salt-dissolve" },
    { text: "Ideal gas law PV = nRT links pressure, volume, moles, and temperature — a compact model for many gases.", diagram: "mole" },
    { text: "First ionisation energy is the cost to remove one electron — noble gases guard their shells fiercely.", diagram: "catalyst" },
    { text: "Chirality: mirror-image molecules can smell or drug differently — same formula, opposite ‘handedness’.", diagram: "carbon-lattice" },
    { text: "Soap works because amphiphilic molecules bridge grease and water — micelles ferry dirt into solution.", diagram: "salt-dissolve" },
    { text: "Ozone (O₃) in the stratosphere absorbs UV; CFCs once punched holes in that protective layer.", diagram: "combustion" },
  ],
  maths: [
    { text: "Zero was formalised in Indian mathematics centuries ago — a placeholder that unlocked place value and algebra.", diagram: "zero-place" },
    { text: "π never ends and never repeats, yet it ties circles, waves, and probability into one constant.", diagram: "pi-circle" },
    { text: "e ≈ 2.718… appears in continuous growth, decay, and compound interest — nature’s favourite base.", diagram: "growth-e" },
    { text: "The golden ratio φ ≈ 1.618 shows up in pentagons and spirals — geometry meeting natural growth.", diagram: "golden-spiral" },
    { text: "Infinity comes in sizes: integers are countable; the real numbers are a larger, uncountable infinity.", diagram: "infinity" },
    { text: "Primes never stop — Euclid’s proof shows there is always a larger prime waiting to be found.", diagram: "primes" },
    { text: "Derivatives measure instantaneous change; integrals accumulate — calculus speaks motion and area.", diagram: "calculus" },
    { text: "On a flat plane, triangle angles sum to 180° — on a sphere, geometry bends and that rule changes.", diagram: "triangle" },
    { text: "Pythagoras: a² + b² = c² for right triangles — the gateway from geometry to distance formulas.", diagram: "triangle" },
    { text: "The quadratic formula solves ax² + bx + c = 0 for any a ≠ 0 — completing the square in one line.", diagram: "calculus" },
    { text: "Logarithms turn multiplication into addition — the original ‘computer’ for astronomers and engineers.", diagram: "growth-e" },
    { text: "A matrix packs linear maps into a grid — rotations, scalings, and projections become multiplication.", diagram: "zero-place" },
    { text: "Binomial coefficients count combinations: C(n,k) = n! / (k!(n−k)!) — Pascal’s triangle in formula form.", diagram: "primes" },
    { text: "Fourier series rebuild waveforms from sines and cosines — music, signals, and heat all speak this language.", diagram: "pi-circle" },
    { text: "Complex numbers i² = −1 expand the plane — every non-constant polynomial has a root (fundamental theorem).", diagram: "infinity" },
    { text: "Probability 0 doesn’t mean impossible on continuous spaces — a dart can hit a point with probability 0.", diagram: "pi-circle" },
    { text: "The number line’s density means between any two reals sits another — no ‘next’ real after 0.", diagram: "infinity" },
    { text: "Euler’s identity e^{iπ} + 1 = 0 links five constants in one breathtaking equation.", diagram: "growth-e" },
    { text: "A vector has magnitude and direction — forces, velocity, and gradients all live in this language.", diagram: "triangle" },
    { text: "Limits formalise ‘approaching’ — the bedrock that makes derivatives and integrals rigorous.", diagram: "calculus" },
  ],
  biology: [
    { text: "Mitochondria have their own DNA — a clue they were once free-living bacteria that joined our cells.", diagram: "mitochondria" },
    { text: "Most red blood cells renew about every 120 days — a quiet factory working while you sleep.", diagram: "blood-cell" },
    { text: "DNA’s double helix stores ~3 billion base pairs, yet folds into a nucleus only a few micrometres across.", diagram: "dna" },
    { text: "By day, plants take in CO₂ and release O₂ — photosynthesis is Earth’s oxygen engine.", diagram: "photosynthesis" },
    { text: "Neurons can fire hundreds of times per second — thought is electricity and chemistry across synapses.", diagram: "neuron" },
    { text: "Antibiotics target bacteria, not viruses — which is why a cold doesn’t improve with antibacterial pills.", diagram: "microbe" },
    { text: "Gut microbes help digest food and train immunity — the microbiome is a living partner inside us.", diagram: "microbe" },
    { text: "Enzymes are shape-specific biological catalysts — lock-and-key proteins that make life’s reactions fast enough.", diagram: "enzyme" },
    { text: "ATP is the cell’s energy currency — mitochondria recharge it so muscles, nerves, and pumps can work.", diagram: "mitochondria" },
    { text: "Stem cells can renew themselves and specialise — the repair crew behind growth and tissue maintenance.", diagram: "blood-cell" },
    { text: "Transcription copies DNA → RNA; translation builds proteins from that message — the central dogma in motion.", diagram: "dna" },
    { text: "Chlorophyll looks green because it reflects green light while absorbing red and blue for photosynthesis.", diagram: "photosynthesis" },
    { text: "Reflex arcs skip conscious thought — a fast spinal loop that pulls your hand off a hot surface.", diagram: "neuron" },
    { text: "Vaccines train adaptive immunity safely so memory cells recognise a pathogen before a real infection.", diagram: "microbe" },
    { text: "Homeostasis keeps variables like temperature and glucose in range — feedback loops are biology’s thermostat.", diagram: "enzyme" },
    { text: "Meiosis halves chromosome number for gametes — so fertilisation restores the diploid count.", diagram: "dna" },
    { text: "Haemoglobin binds oxygen in lungs and releases it in tissues — iron-centred proteins doing gas exchange.", diagram: "blood-cell" },
    { text: "Xylem carries water up; phloem moves sugars around — plants run two specialised transport highways.", diagram: "photosynthesis" },
    { text: "Natural selection favours heritable traits that improve survival and reproduction in a given environment.", diagram: "microbe" },
    { text: "Apoptosis is programmed cell death — a tidy way tissues sculpt organs and remove damaged cells.", diagram: "enzyme" },
  ],
};

function pickFact(subject: SubjectKey, avoid?: string): FactItem {
  const list = FACTS[subject];
  let next = list[Math.floor(Math.random() * list.length)];
  let guard = 0;
  while (avoid && next.text === avoid && guard++ < 8) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function FactDiagram({ id, accent }: { id: DiagramId; accent: string }) {
  const stroke = accent;
  const muted = "rgba(232,240,245,0.35)";

  const common = {
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "diagram-draw",
  };

  switch (id) {
    case "sun-earth":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="42" cy="70" r="22" stroke={stroke} strokeWidth="2" {...common} />
          <circle cx="42" cy="70" r="8" fill={stroke} opacity="0.35" />
          <path d="M70 70 H155" stroke={muted} strokeWidth="1.5" strokeDasharray="4 5" {...common} />
          <circle cx="168" cy="70" r="12" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M78 58 l8 12 -8 0 z" fill={stroke} opacity="0.7" />
          <text x="100" y="52" fill={muted} fontSize="10" fontFamily="ui-monospace, monospace">
            ~8 min 20 s
          </text>
        </svg>
      );
    case "dense-star":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="100" cy="70" r="36" stroke={stroke} strokeWidth="2" {...common} />
          <circle cx="100" cy="70" r="14" fill={stroke} opacity="0.25" stroke={stroke} strokeWidth="1.5" />
          <path d="M100 34 V20 M100 106 V120 M64 70 H50 M136 70 H150" stroke={muted} strokeWidth="1.5" {...common} />
          <rect x="152" y="58" width="22" height="22" rx="2" stroke={stroke} strokeWidth="1.5" {...common} />
          <text x="58" y="128" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            extreme density
          </text>
        </svg>
      );
    case "lightning":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M20 40 Q60 20 100 35 T180 28" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M108 36 L92 72 H112 L88 118" stroke={stroke} strokeWidth="2.5" {...common} />
          <path d="M40 110 H160" stroke={muted} strokeWidth="1.5" {...common} />
        </svg>
      );
    case "free-fall":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M70 24 V110" stroke={muted} strokeWidth="1.5" strokeDasharray="3 4" {...common} />
          <path d="M130 24 V110" stroke={muted} strokeWidth="1.5" strokeDasharray="3 4" {...common} />
          <rect x="58" y="40" width="24" height="18" rx="2" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M118 38 c8 0 14 8 14 14 s-6 12-14 12-12-4-12-10 6-16 12-16z" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M70 118 l-6-8 M70 118 l6-8 M130 118 l-6-8 M130 118 l6-8" stroke={stroke} strokeWidth="1.5" {...common} />
          <text x="78" y="132" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            a = g
          </text>
        </svg>
      );
    case "sound-wave":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="40" cy="70" r="10" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M60 70 Q75 40 90 70 T120 70 T150 70 T180 70" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M60 70 Q75 100 90 70" stroke={muted} strokeWidth="1.5" {...common} />
          <text x="70" y="118" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            needs a medium
          </text>
        </svg>
      );
    case "orbit-escape":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="100" cy="78" r="20" stroke={stroke} strokeWidth="2" {...common} />
          <ellipse cx="100" cy="78" rx="58" ry="28" stroke={muted} strokeWidth="1.5" strokeDasharray="4 4" {...common} />
          <path d="M155 65 Q175 40 188 22" stroke={stroke} strokeWidth="2" {...common} />
          <circle cx="152" cy="68" r="5" fill={stroke} opacity="0.7" />
          <text x="118" y="28" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            vₑ ≈ 11.2 km/s
          </text>
        </svg>
      );
    case "circuit":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M40 40 H160 V100 H40 V40" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M70 40 V28 M70 28 H90 M90 28 V40" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M110 100 l8-10 8 10 8-10 8 10 8-10" stroke={stroke} strokeWidth="2" {...common} />
          <text x="72" y="70" fill={muted} fontSize="11" fontFamily="ui-monospace, monospace">
            V = IR
          </text>
        </svg>
      );
    case "carbon-lattice":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          {/* diamond-ish */}
          <path d="M50 40 L70 55 L70 85 L50 100 L30 85 L30 55 Z" stroke={stroke} strokeWidth="1.8" {...common} />
          <circle cx="50" cy="40" r="3" fill={stroke} />
          <circle cx="70" cy="55" r="3" fill={stroke} />
          <circle cx="70" cy="85" r="3" fill={stroke} />
          <circle cx="50" cy="100" r="3" fill={stroke} />
          <circle cx="30" cy="85" r="3" fill={stroke} />
          <circle cx="30" cy="55" r="3" fill={stroke} />
          {/* graphite layers */}
          <path d="M120 45 H180 M120 70 H180 M120 95 H180" stroke={stroke} strokeWidth="1.8" {...common} />
          <circle cx="130" cy="45" r="3" fill={stroke} />
          <circle cx="150" cy="45" r="3" fill={stroke} />
          <circle cx="170" cy="45" r="3" fill={stroke} />
          <circle cx="130" cy="70" r="3" fill={stroke} />
          <circle cx="150" cy="70" r="3" fill={stroke} />
          <circle cx="170" cy="70" r="3" fill={stroke} />
          <text x="36" y="122" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            diamond
          </text>
          <text x="132" y="122" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            graphite
          </text>
        </svg>
      );
    case "ice-water":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M30 100 H170 V110 H30 Z" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M40 100 Q70 70 100 100 T160 100" stroke={stroke} strokeWidth="1.5" fill={`${stroke}22`} className="diagram-draw" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M80 55 L95 75 L80 70 L65 75 Z" stroke={stroke} strokeWidth="1.8" {...common} />
          <path d="M120 48 L132 68 L120 62 L108 68 Z" stroke={stroke} strokeWidth="1.8" {...common} />
          <text x="70" y="128" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            ice floats
          </text>
        </svg>
      );
    case "mole":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <circle
              key={i}
              cx={55 + (i % 3) * 22}
              cy={45 + Math.floor(i / 3) * 22}
              r="6"
              stroke={stroke}
              strokeWidth="1.5"
              {...common}
            />
          ))}
          <path d="M130 40 H175 V100 H130 Z" stroke={muted} strokeWidth="1.5" {...common} />
          <text x="136" y="78" fill={stroke} fontSize="12" fontFamily="ui-monospace, monospace">
            1 mol
          </text>
          <text x="48" y="128" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            Nₐ ≈ 6.022×10²³
          </text>
        </svg>
      );
    case "catalyst":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M30 110 Q70 30 100 70 Q130 30 170 110" stroke={muted} strokeWidth="1.8" {...common} />
          <path d="M30 110 Q70 70 100 85 Q130 70 170 110" stroke={stroke} strokeWidth="2.2" {...common} />
          <text x="78" y="28" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            Eₐ
          </text>
          <text x="70" y="128" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            with catalyst
          </text>
        </svg>
      );
    case "ph-scale":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M30 70 H170" stroke={muted} strokeWidth="2" {...common} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${40 + i * 20} 62 V78`} stroke={stroke} strokeWidth="1.5" {...common} />
          ))}
          <circle cx="100" cy="70" r="7" stroke={stroke} strokeWidth="2" fill={`${stroke}33`} className="diagram-draw" strokeLinecap="round" strokeLinejoin="round" />
          <text x="92" y="98" fill={muted} fontSize="10" fontFamily="ui-monospace, monospace">
            pH 7
          </text>
          <text x="34" y="50" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            acid
          </text>
          <text x="148" y="50" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            base
          </text>
        </svg>
      );
    case "salt-dissolve":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <ellipse cx="100" cy="100" rx="70" ry="16" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M40 100 Q40 40 100 40 Q160 40 160 100" stroke={muted} strokeWidth="1.5" {...common} />
          <circle cx="78" cy="72" r="8" stroke={stroke} strokeWidth="1.8" {...common} />
          <text x="73" y="76" fill={stroke} fontSize="9">
            Na
          </text>
          <circle cx="120" cy="78" r="8" stroke={stroke} strokeWidth="1.8" {...common} />
          <text x="115" y="82" fill={stroke} fontSize="9">
            Cl
          </text>
          <path d="M88 68 Q100 55 112 72" stroke={muted} strokeWidth="1.2" strokeDasharray="3 3" {...common} />
        </svg>
      );
    case "combustion":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M100 110 C85 90 78 70 92 48 C100 62 112 58 108 40 C130 58 128 88 100 110 Z" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M40 110 H160" stroke={muted} strokeWidth="1.5" {...common} />
          <text x="58" y="28" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            CxHy + O₂ → CO₂ + H₂O
          </text>
        </svg>
      );
    case "zero-place":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <text x="40" y="78" fill={stroke} fontSize="42" fontFamily="Georgia, serif">
            10
          </text>
          <circle cx="118" cy="48" r="14" stroke={stroke} strokeWidth="2" {...common} />
          <text x="111" y="54" fill={stroke} fontSize="16" fontFamily="Georgia, serif">
            0
          </text>
          <text x="48" y="118" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            place value
          </text>
        </svg>
      );
    case "pi-circle":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="90" cy="70" r="40" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M90 70 H130" stroke={muted} strokeWidth="1.5" {...common} />
          <circle cx="90" cy="70" r="3" fill={stroke} />
          <text x="108" y="66" fill={muted} fontSize="10" fontFamily="ui-monospace, monospace">
            r
          </text>
          <text x="145" y="78" fill={stroke} fontSize="28" fontFamily="Georgia, serif">
            π
          </text>
        </svg>
      );
    case "growth-e":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M30 110 H170 M30 110 V30" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M40 100 Q80 95 110 70 T165 28" stroke={stroke} strokeWidth="2.2" {...common} />
          <text x="140" y="55" fill={muted} fontSize="12" fontFamily="Georgia, serif">
            eˣ
          </text>
        </svg>
      );
    case "golden-spiral":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path
            d="M100 70 m0-8 a8 8 0 1 1 0 0.1 m0-8 a16 16 0 1 0 0-0.1 m0 16 a24 24 0 1 1 0 0.1 m0-24 a36 36 0 1 0 0-0.1"
            stroke={stroke}
            strokeWidth="1.8"
            {...common}
          />
          <text x="130" y="118" fill={muted} fontSize="11" fontFamily="Georgia, serif">
            φ ≈ 1.618
          </text>
        </svg>
      );
    case "infinity":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M60 70 C60 40 95 40 100 70 C105 100 140 100 140 70 C140 40 105 40 100 70 C95 100 60 100 60 70" stroke={stroke} strokeWidth="2.4" {...common} />
        </svg>
      );
    case "primes":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          {[2, 3, 5, 7, 11, 13].map((n, i) => (
            <g key={n}>
              <circle cx={40 + i * 26} cy="70" r="12" stroke={stroke} strokeWidth="1.6" {...common} />
              <text x={40 + i * 26 - (n > 9 ? 7 : 4)} y="74" fill={stroke} fontSize="11" fontFamily="ui-monospace, monospace">
                {n}
              </text>
            </g>
          ))}
          <text x="70" y="110" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            primes go on…
          </text>
        </svg>
      );
    case "calculus":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M30 110 H170 M30 110 V30" stroke={muted} strokeWidth="1.4" {...common} />
          <path d="M40 95 Q80 90 100 55 T160 35" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M100 55 L130 40" stroke={muted} strokeWidth="1.5" {...common} />
          <path d="M70 110 V80 H115 V110" stroke={stroke} strokeWidth="1.2" fill={`${stroke}22`} className="diagram-draw" strokeLinecap="round" strokeLinejoin="round" />
          <text x="138" y="70" fill={muted} fontSize="10" fontFamily="ui-monospace, monospace">
            dy/dx
          </text>
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M50 110 L100 40 L150 110 Z" stroke={stroke} strokeWidth="2" {...common} />
          <text x="88" y="95" fill={muted} fontSize="10" fontFamily="ui-monospace, monospace">
            180°
          </text>
        </svg>
      );
    case "mitochondria":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <ellipse cx="100" cy="70" rx="70" ry="36" stroke={stroke} strokeWidth="2" {...common} />
          <ellipse cx="100" cy="70" rx="58" ry="26" stroke={muted} strokeWidth="1.4" {...common} />
          <path d="M50 70 Q65 50 80 70 T110 70 T140 70 T155 70" stroke={stroke} strokeWidth="1.8" {...common} />
        </svg>
      );
    case "blood-cell":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <ellipse cx="100" cy="70" rx="48" ry="28" stroke={stroke} strokeWidth="2" {...common} />
          <ellipse cx="100" cy="70" rx="22" ry="12" stroke={muted} strokeWidth="1.5" {...common} />
          <text x="72" y="118" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            ~120 day cycle
          </text>
        </svg>
      );
    case "dna":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M70 20 Q110 40 70 60 Q30 80 70 100 Q110 120 70 130" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M130 20 Q90 40 130 60 Q170 80 130 100 Q90 120 130 130" stroke={stroke} strokeWidth="2" {...common} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${70 + (i % 2 === 0 ? 0 : 8)} ${35 + i * 20} H${130 - (i % 2 === 0 ? 0 : 8)}`} stroke={muted} strokeWidth="1.4" {...common} />
          ))}
        </svg>
      );
    case "photosynthesis":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="150" cy="36" r="14" stroke={stroke} strokeWidth="1.8" {...common} />
          <path d="M100 120 C100 70 70 55 55 45" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M100 85 Q70 70 48 78 Q70 55 100 70" stroke={stroke} strokeWidth="1.8" {...common} />
          <path d="M100 95 Q130 78 150 88 Q128 65 100 80" stroke={stroke} strokeWidth="1.8" {...common} />
          <text x="30" y="30" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            CO₂ → O₂
          </text>
        </svg>
      );
    case "neuron":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="70" cy="70" r="16" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M54 58 L40 42 M50 70 H28 M54 82 L40 98" stroke={stroke} strokeWidth="1.6" {...common} />
          <path d="M86 70 H150" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M150 70 L170 55 M150 70 L170 70 M150 70 L170 85" stroke={stroke} strokeWidth="1.6" {...common} />
          <circle cx="70" cy="70" r="5" fill={stroke} opacity="0.4" />
        </svg>
      );
    case "microbe":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <ellipse cx="70" cy="70" rx="28" ry="16" stroke={stroke} strokeWidth="2" {...common} />
          <path d="M42 70 Q30 50 22 70 Q30 90 42 70" stroke={muted} strokeWidth="1.4" {...common} />
          <circle cx="140" cy="70" r="22" stroke={stroke} strokeWidth="1.8" strokeDasharray="3 4" {...common} />
          <circle cx="140" cy="70" r="8" stroke={muted} strokeWidth="1.4" {...common} />
          <text x="52" y="112" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            bacteria
          </text>
          <text x="122" y="112" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            virus
          </text>
        </svg>
      );
    case "enzyme":
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M40 50 H90 V40 H120 V60 H160 V90 H120 V110 H90 V100 H40 Z" stroke={stroke} strokeWidth="2" {...common} />
          <rect x="95" y="62" width="30" height="26" rx="3" stroke={muted} strokeWidth="1.6" {...common} />
          <text x="58" y="128" fill={muted} fontSize="9" fontFamily="ui-monospace, monospace">
            lock & key
          </text>
        </svg>
      );
    default:
      return null;
  }
}

export function SubjectFunFactInline({
  subject,
  refreshKey,
  onClose,
  onShuffle,
}: {
  subject: SubjectKey;
  refreshKey: number;
  onClose: () => void;
  onShuffle: () => void;
}) {
  const meta = SUBJECT_META[subject];
  const [fact, setFact] = useState<FactItem>(() => pickFact(subject));
  const [show, setShow] = useState(false);

  useEffect(() => {
    setFact(pickFact(subject));
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, [subject, refreshKey]);

  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: `${10 + ((i * 19) % 80)}%`,
        top: `${15 + ((i * 27) % 65)}%`,
        delay: `${(i % 5) * 0.2}s`,
        size: 1.5 + (i % 3),
      })),
    [subject]
  );

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-white/12 transition-all duration-300 ease-out ${
        show ? "max-h-[420px] translate-y-0 opacity-100" : "max-h-0 translate-y-3 opacity-0"
      }`}
      style={{
        background: "rgba(15,31,46,0.82)",
        boxShadow: `0 0 40px ${meta.glow}`,
      }}
      role="region"
      aria-label={`${meta.label} fun fact`}
    >
      <style>{`
        .diagram-draw {
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: diagram-sketch 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes diagram-sketch {
          to { stroke-dashoffset: 0; }
        }
        .fact-copy-in {
          animation: fact-copy-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes fact-copy-in {
          from { opacity: 0; transform: translateY(10px); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="relative px-4 py-4 md:px-5 md:py-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 80% at 15% 40%, ${meta.glow}, transparent 60%)`,
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
                opacity: 0.4,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ borderColor: `${meta.accent}55`, color: meta.accent }}
          >
            <span className="font-mono text-[10px] normal-case tracking-normal">{meta.mark}</span>
            {meta.label} fact
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-bronze transition hover:border-gold/40 hover:text-gold"
          >
            Close
          </button>
        </div>

        <div className="relative mt-3 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(140px,200px)]">
          <div key={`${refreshKey}-copy`} className="fact-copy-in min-w-0">
            <p className="font-display text-lg leading-snug text-mist md:text-xl">{fact.text}</p>
            <div
              className="mt-3 h-px w-14 origin-left animate-underline-grow"
              style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent)` }}
            />
            <button
              type="button"
              onClick={onShuffle}
              className="mt-3 inline-flex items-center rounded-full px-4 py-2 text-xs font-bold tracking-wide text-ink transition hover:brightness-110"
              style={{ background: meta.accent }}
            >
              Another fact
            </button>
          </div>

          <div
            key={`${refreshKey}-diagram`}
            className="fact-copy-in relative mx-auto aspect-[10/7] w-full max-w-[220px] rounded-xl border border-white/10 bg-ink/40 p-2"
            style={{ boxShadow: `inset 0 0 24px ${meta.glow}` }}
          >
            <FactDiagram id={fact.diagram} accent={meta.accent} />
            <span className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] uppercase tracking-[0.16em] text-bronze/70">
              sketch
            </span>
          </div>
        </div>
      </div>
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
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
      {items.map((key, i) => {
        const meta = SUBJECT_META[key];
        const isActive = active === key;
        return (
          <div key={key} className="flex items-center gap-3 sm:gap-5">
            {i > 0 && (
              <span
                className="hidden h-1 w-1 rounded-full sm:block"
                style={{ background: i % 2 === 0 ? "#5EC8C0" : "#D4B06A" }}
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(key)}
              className={`relative rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 ${
                isActive ? "text-ink" : "text-bronze hover:text-mist"
              }`}
              style={
                isActive
                  ? { background: meta.accent, boxShadow: `0 0 22px ${meta.glow}` }
                  : undefined
              }
              aria-pressed={isActive}
            >
              {meta.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
