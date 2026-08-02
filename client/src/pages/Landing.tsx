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

export default function Landing() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const settleTimer = window.setTimeout(() => setPhase("settle"), 1600);
    const readyTimer = window.setTimeout(() => setPhase("ready"), 2800);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden science-atmosphere text-mist">
      {/* Crest intro — orbital science reveal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-[900ms] ease-out ${
          phase === "ready" ? "pointer-events-none opacity-0 scale-110" : "opacity-100 scale-100"
        }`}
      >
        <div className="absolute inset-0 science-atmosphere" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 12% 18%, rgba(240,224,184,0.7), transparent)," +
              "radial-gradient(1.5px 1.5px at 78% 22%, rgba(94,200,192,0.8), transparent)," +
              "radial-gradient(1px 1px at 34% 72%, rgba(240,224,184,0.55), transparent)," +
              "radial-gradient(1.5px 1.5px at 88% 68%, rgba(94,200,192,0.65), transparent)," +
              "radial-gradient(1px 1px at 55% 40%, rgba(255,255,255,0.45), transparent)," +
              "radial-gradient(1px 1px at 22% 48%, rgba(94,200,192,0.5), transparent)",
          }}
        />

        <div className="relative flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden
              className="absolute h-[min(72vw,380px)] w-[min(72vw,380px)] rounded-full border border-aurora/25 animate-pulse-ring"
            />
            <span
              aria-hidden
              className="absolute h-[min(72vw,380px)] w-[min(72vw,380px)] rounded-full border border-gold/20 animate-pulse-ring"
              style={{ animationDelay: "0.7s" }}
            />
            <span
              aria-hidden
              className="absolute h-[min(58vw,300px)] w-[min(58vw,300px)] rounded-full border border-aurora/15"
              style={{
                transform: "rotateX(68deg)",
                animation: "orbit-tilt 14s linear infinite",
              }}
            />
            <span
              aria-hidden
              className="absolute h-[min(46vw,240px)] w-[min(46vw,240px)] rounded-full border border-gold/20"
              style={{
                transform: "rotateX(68deg)",
                animation: "orbit-tilt 9s linear infinite reverse",
              }}
            />
            <span
              aria-hidden
              className="absolute -left-8 top-10 h-1.5 w-1.5 rounded-full bg-aurora shadow-[0_0_10px_rgba(94,200,192,0.9)] animate-star-twinkle"
            />
            <span
              aria-hidden
              className="absolute -right-6 bottom-14 h-1 w-1 rounded-full bg-champagne animate-star-twinkle"
              style={{ animationDelay: "0.9s" }}
            />
            <span
              aria-hidden
              className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-gold/80 animate-star-twinkle"
              style={{ animationDelay: "1.4s" }}
            />
            <div className="relative z-10 animate-float">
              <BrandLogo to={null} size="hero" glow spinRing className="animate-logo-enter" />
            </div>
          </div>
          <p
            className="mt-10 font-display text-3xl font-semibold tracking-[0.18em] gold-text animate-intro-title md:text-4xl"
            style={{ animationDelay: "0.45s" }}
          >
            DIPSAN ACADEMY
          </p>
          <p
            className="mt-3 animate-fade-up text-[11px] uppercase tracking-[0.35em] text-aurora/90"
            style={{ animationDelay: "0.85s" }}
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
          {/* Physics orbit rings */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[42%] h-[min(70vw,520px)] w-[min(70vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aurora/30 animate-orbit-slow"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[42%] h-[min(52vw,380px)] w-[min(52vw,380px)] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full border border-gold/20 animate-orbit-slow"
            style={{ animationDirection: "reverse", animationDuration: "48s" }}
          />
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

            <div className="mb-auto mt-auto flex flex-col items-center py-16 text-center">
              <div className="mb-8 animate-float">
                <BrandLogo to={null} size="xl" glow spinRing />
              </div>

              <h1 className="font-display text-[clamp(3rem,11vw,5.75rem)] font-semibold leading-[0.95] tracking-tight">
                <span className="inline-block animate-title-rise gold-text">Dipsan</span>
                <br />
                <span
                  className="inline-block animate-title-rise text-mist"
                  style={{ animationDelay: "0.12s" }}
                >
                  Academy
                </span>
              </h1>

              <p
                className="mt-6 max-w-lg animate-fade-up text-base leading-relaxed text-bronze md:text-lg"
                style={{ animationDelay: "0.25s" }}
              >
                NEET &amp; JEE mocks — timed, scored, and reviewed the moment you submit.
              </p>

              <div
                className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3"
                style={{ animationDelay: "0.38s" }}
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
            <p className="max-w-md text-bronze">
              Enter the hall with focus — and the clock ahead.
            </p>
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
