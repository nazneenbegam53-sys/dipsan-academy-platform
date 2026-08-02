import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/ui";

type Phase = "intro" | "settle" | "ready";

// Local subject imagery — physics on hero; chem / bio / math in the mid sections
const HERO_IMAGE = "/hero/rocket.jpg";
const CHEMISTRY_IMAGE = "/hero/chemistry.jpg";
const BIOLOGY_IMAGE = "/hero/biology.jpg";
const MATH_IMAGE = "/hero/math.jpg";
const SPACE_IMAGE = "/hero/earth.jpg";

function AnimatedLetters({
  text,
  className = "",
  delay = 0,
  stagger = 0.045,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="inline-block animate-letter-in"
          style={{ animationDelay: `${delay + i * stagger}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export default function Landing() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState<Phase>("intro");
  const [orbitDone, setOrbitDone] = useState(false);

  useEffect(() => {
    const settleTimer = window.setTimeout(() => setPhase("settle"), 1800);
    const readyTimer = window.setTimeout(() => setPhase("ready"), 3200);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "ready") setOrbitDone(false);
  }, [phase]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "";

  return (
    <div className="relative min-h-screen overflow-x-hidden science-atmosphere text-mist">
      {/* Crest intro — clean, flat reveal (no tilt) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-[850ms] ease-out ${
          phase === "ready" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 science-atmosphere" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 40% at 50% 42%, rgba(94,200,192,0.12), transparent 70%)," +
              "radial-gradient(1.5px 1.5px at 18% 22%, rgba(240,224,184,0.55), transparent)," +
              "radial-gradient(1.5px 1.5px at 82% 28%, rgba(94,200,192,0.55), transparent)," +
              "radial-gradient(1px 1px at 70% 68%, rgba(240,224,184,0.4), transparent)," +
              "radial-gradient(1px 1px at 30% 74%, rgba(94,200,192,0.4), transparent)",
          }}
        />

        <div className="relative flex flex-col items-center px-6">
          <div className="relative flex h-[min(62vw,300px)] w-[min(62vw,300px)] items-center justify-center">
            <span
              aria-hidden
              className="absolute h-[78%] w-[78%] rounded-full bg-[radial-gradient(circle,rgba(212,176,106,0.22)_0%,rgba(94,200,192,0.12)_45%,transparent_70%)] animate-intro-bloom blur-xl"
            />
            <span
              aria-hidden
              className="absolute inset-[4%] rounded-full border border-gold/30 animate-intro-ring"
            />
            <span
              aria-hidden
              className="absolute inset-[10%] rounded-full border border-aurora/25 animate-intro-ring"
              style={{ animationDelay: "0.12s" }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-white/10 animate-pulse-ring"
            />

            <div className="relative z-10">
              <BrandLogo to={null} size="hero" glow className="animate-logo-enter" />
            </div>
          </div>

          <h2 className="mt-9 text-center font-display text-3xl font-semibold tracking-[0.18em] gold-text md:text-5xl">
            <AnimatedLetters text="DIPSAN" delay={0.35} stagger={0.06} />
            <span className="mx-2.5 inline-block w-1.5" aria-hidden />
            <AnimatedLetters text="ACADEMY" delay={0.75} stagger={0.055} />
          </h2>
          <span
            aria-hidden
            className="mt-4 h-px w-24 origin-center bg-gradient-to-r from-transparent via-champagne/80 to-transparent animate-underline-grow"
            style={{ animationDelay: "1.35s" }}
          />
          <p
            className="mt-4 animate-fade-up text-[11px] uppercase tracking-[0.34em] text-aurora/90"
            style={{ animationDelay: "1.45s" }}
          >
            Science · Precision · Practice
          </p>
        </div>
      </div>

      <div
        className={`fixed right-5 top-5 z-40 transition-all duration-700 md:right-8 md:top-6 ${
          phase === "ready" ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <BrandLogo size="sm" glow spinRing />
      </div>

      {user && (
        <div
          className={`fixed left-5 top-5 z-40 transition-all duration-700 md:left-8 md:top-6 ${
            phase === "ready" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <p className="font-display text-lg font-semibold tracking-wide text-mist md:text-xl">
            Hi, <span className="gold-text">{firstName}</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-bronze">
            {user.role === "teacher" ? "Teacher" : "Student"}
          </p>
        </div>
      )}

      <div
        className={`relative z-10 transition-opacity duration-700 ${
          phase === "ready" ? "opacity-100" : "opacity-0"
        }`}
      >
        <section className="relative min-h-[100svh] overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Rocket launch — physics in motion"
            className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
          />
          {/* Keep the launch vivid; only darken edges for type */}
          <div className="absolute inset-0 bg-gradient-to-b from-paper/55 via-paper/35 to-paper" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,18,28,0.6)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(94,200,192,0.16),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(212,176,106,0.12),transparent_45%)]" />
          {/* Soft outer atmosphere — main brand circle is in the hero composition */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[18%] top-[28%] h-2 w-2 rounded-full bg-aurora/80 shadow-[0_0_14px_rgba(94,200,192,0.9)] animate-float"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[22%] top-[36%] h-1.5 w-1.5 rounded-full bg-gold/70 animate-float"
            style={{ animationDelay: "0.8s" }}
          />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-12 pt-8 md:px-10">
            <nav className="flex items-center justify-end gap-4 pr-16">
              <div className="flex items-center gap-2 sm:gap-3">
                {user ? (
                  <>
                    <Link
                      to={user.role === "teacher" ? "/teacher" : "/student"}
                      className="hidden text-sm font-medium text-mist/90 transition hover:text-gold sm:inline"
                    >
                      Dashboard
                    </Link>
                    <Button variant="ghost" onClick={logout} className="!py-2 !text-xs sm:!text-sm">
                      Log out
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="text-sm font-medium text-mist/90 transition hover:text-gold"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </nav>

            <div className="mb-auto mt-auto flex flex-col items-center py-10 text-center">
              {/* Brand circle: crest stays on the orbit and rests at top-center (middle of ring) */}
              <div className="relative mx-auto aspect-square w-[min(92vw,560px)]">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-aurora/35 shadow-[0_0_60px_rgba(94,200,192,0.12)]"
                />
                <div
                  aria-hidden
                  className="absolute inset-[7%] rounded-full border border-gold/15"
                />

                {phase === "ready" && (
                  <div
                    key={orbitDone ? "crest-rest" : "crest-orbit-run"}
                    className={`absolute inset-0 z-20 ${orbitDone ? "" : "animate-crest-orbit"}`}
                    onAnimationEnd={(e) => {
                      if (e.target === e.currentTarget) setOrbitDone(true);
                    }}
                  >
                    {/* Logo rides the rim; counter-spin keeps it upright (no tilt/scale) */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                      <div className={orbitDone ? "animate-float" : "animate-crest-face"}>
                        <BrandLogo
                          to={null}
                          size="xl"
                          glow
                          spinRing={orbitDone}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pt-10">
                  <h1 className="font-display text-[clamp(2.4rem,9vw,4.75rem)] font-semibold leading-[0.95] tracking-tight">
                    {phase === "ready" ? (
                      <>
                        <span className="gold-text">
                          <AnimatedLetters text="Dipsan" delay={0.2} stagger={0.06} />
                        </span>
                        <br />
                        <span className="text-mist">
                          <AnimatedLetters text="Academy" delay={0.55} stagger={0.055} />
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="gold-text">Dipsan</span>
                        <br />
                        <span className="text-mist">Academy</span>
                      </>
                    )}
                  </h1>

                  <p
                    className="mt-5 max-w-md animate-fade-up text-sm leading-relaxed text-bronze md:text-base"
                    style={{ animationDelay: "0.55s" }}
                  >
                    NEET &amp; JEE mocks — timed, scored, and reviewed the moment you submit.
                  </p>

                  <div
                    className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-3"
                    style={{ animationDelay: "0.7s" }}
                  >
                    {user ? (
                      <>
                        <Link
                          to={user.role === "teacher" ? "/teacher" : "/student"}
                          className="inline-flex items-center rounded-full bg-gold px-8 py-3.5 text-sm font-bold tracking-wide text-ink transition hover:bg-champagne"
                        >
                          Go to dashboard
                        </Link>
                        <button
                          type="button"
                          onClick={logout}
                          className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold tracking-wide text-mist transition hover:border-gold hover:text-gold"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="inline-flex items-center rounded-full bg-gold px-8 py-3.5 text-sm font-bold tracking-wide text-ink transition hover:bg-champagne"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold tracking-wide text-mist transition hover:border-gold hover:text-gold"
                        >
                          Sign up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.22em] text-bronze">
              <span>Physics</span>
              <span className="h-1 w-1 rounded-full bg-aurora" />
              <span>Chemistry</span>
              <span className="h-1 w-1 rounded-full bg-gold" />
              <span>Maths</span>
              <span className="h-1 w-1 rounded-full bg-aurora" />
              <span>Biology</span>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 bg-coal">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:px-10 md:py-24">
            <div className="animate-fade-up">
              <div className="mb-4 flex items-center gap-3">
                <BrandLogo size="xs" glow />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  The experience
                </span>
              </div>
              <h2 className="font-display text-4xl font-semibold leading-tight text-mist md:text-5xl">
                Sit the paper.
                <br />
                <span className="gold-text">Trust the timer.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-bronze">
                Every mock mirrors exam-day pressure — question palette, marking scheme, and instant
                feedback when the clock hits zero.
              </p>
            </div>
            <div
              className="relative overflow-hidden rounded-3xl gold-border-glow animate-fade-up"
              style={{ animationDelay: "0.12s" }}
            >
              <img
                src={CHEMISTRY_IMAGE}
                alt="Molecular model — chemistry"
                className="h-[340px] w-full object-cover md:h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 flex items-center gap-3">
                <BrandLogo size="xs" />
                <span className="font-display text-lg text-mist">Precision over pressure.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto grid max-w-6xl md:grid-cols-2">
            <div className="relative min-h-[300px] overflow-hidden border-b border-white/10 md:border-b-0 md:border-r">
              <img
                src={BIOLOGY_IMAGE}
                alt="Fluorescent cells — biology"
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-paper/55" />
              <div className="relative px-6 py-16 md:px-10 md:py-20">
                <BrandLogo size="xs" glow />
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Students
                </div>
                <h3 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
                  Practice like the real paper.
                </h3>
                <p className="mt-3 max-w-sm leading-relaxed text-bronze">
                  Timed attempts, negative marking, and solution walkthroughs for NEET &amp; JEE.
                </p>
              </div>
            </div>
            <div className="relative min-h-[300px] overflow-hidden">
              <img
                src={MATH_IMAGE}
                alt="Equations on paper — mathematics"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-paper/60" />
              <div className="relative px-6 py-16 md:px-10 md:py-20">
                <BrandLogo size="xs" glow />
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Teachers
                </div>
                <h3 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
                  Publish once. Read every attempt.
                </h3>
                <p className="mt-3 max-w-sm leading-relaxed text-bronze">
                  Build image-rich papers, then inspect results and question accuracy with clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 bg-coal">
          <img
            src={SPACE_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-paper/70" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-20 text-center md:px-10">
            <BrandLogo size="lg" glow spinRing />
            <h2 className="font-display text-4xl font-semibold text-mist md:text-5xl">
              Ready when you are.
            </h2>
            <p className="max-w-md text-bronze">Enter the hall with focus — and the clock ahead.</p>
            {user ? (
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to={user.role === "teacher" ? "/teacher" : "/student"}
                  className="inline-flex rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-ink transition hover:bg-champagne"
                >
                  Open dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-mist transition hover:border-gold hover:text-gold"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-ink transition hover:bg-champagne"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-mist transition hover:border-gold hover:text-gold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-white/10 bg-paper px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <BrandLogo size="sm" showWordmark glow />
            <span className="text-xs tracking-wide text-bronze">Online examination platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
