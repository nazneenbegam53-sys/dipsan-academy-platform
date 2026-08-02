import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/ui";

type Phase = "intro" | "settle" | "ready";

// Eye-catchy physics-themed imagery (no chalkboards)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=2400&q=80"; // rocket launch
const PHYSICS_IMAGE =
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80"; // nebula / cosmos
const STUDY_IMAGE =
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80"; // exam writing desk
const CLASS_IMAGE =
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1600&q=80"; // classroom
const SPACE_IMAGE =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"; // earth / orbit

export default function Landing() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const settleTimer = window.setTimeout(() => setPhase("settle"), 1200);
    const readyTimer = window.setTimeout(() => setPhase("ready"), 2000);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper text-mist">
      {/* Elegant crest intro */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-paper transition-all duration-700 ${
          phase === "ready" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div className="animate-float">
            <BrandLogo to={null} size="hero" glow spinRing className="animate-logo-enter" />
          </div>
          <p
            className="mt-8 font-display text-3xl font-semibold tracking-[0.18em] gold-text animate-title-rise md:text-4xl"
            style={{ animationDelay: "0.3s" }}
          >
            DIPSAN ACADEMY
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
          {/* Lighter overlay so type stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-paper/75 via-paper/65 to-paper" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.14),transparent_60%)]" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-12 pt-8 md:px-10">
            <nav className="flex items-center justify-between gap-4 pr-16">
              <BrandLogo size="sm" showWordmark glow />
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
              <span className="h-1 w-1 rounded-full bg-gold" />
              <span>Chemistry</span>
              <span className="h-1 w-1 rounded-full bg-gold" />
              <span>Maths</span>
              <span className="h-1 w-1 rounded-full bg-gold" />
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
                src={PHYSICS_IMAGE}
                alt="Cosmos and physics"
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
                src={STUDY_IMAGE}
                alt="Exam preparation"
                className="absolute inset-0 h-full w-full object-cover opacity-45"
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
                src={CLASS_IMAGE}
                alt="Classroom teaching"
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
