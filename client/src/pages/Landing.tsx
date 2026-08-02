import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { PracticePaperAnim } from "../components/PracticePaperAnim";
import { PrecisionPressureLab } from "../components/PrecisionPressureLab";
import { ReadyFocusClock } from "../components/ReadyFocusClock";
import { SupportButton } from "../components/SupportButton";
import { TeachersPublishAnim } from "../components/TeachersPublishAnim";
import {
  SubjectFunFactInline,
  SubjectNav,
  type SubjectKey,
} from "../components/SubjectFunFacts";

type Phase = "intro" | "settle" | "ready";

// Local subject imagery — physics on hero; math in the mid section
const HERO_IMAGE = "/hero/rocket.jpg";

function AnimatedLetters({
  text,
  className = "",
  letterClassName = "",
  delay = 0,
  stagger = 0.045,
}: {
  text: string;
  className?: string;
  letterClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={`inline-block animate-letter-in ${letterClassName}`}
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
  const [orbitRun, setOrbitRun] = useState(0);
  const [funSubject, setFunSubject] = useState<SubjectKey | null>(null);
  const [funKey, setFunKey] = useState(0);

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
          <div className="relative flex h-[min(48vw,240px)] w-[min(48vw,240px)] items-center justify-center sm:h-[min(62vw,300px)] sm:w-[min(62vw,300px)]">
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

          <h2 className="mt-6 text-center font-display text-2xl font-semibold tracking-[0.14em] sm:mt-9 sm:text-3xl sm:tracking-[0.18em] md:text-5xl">
            <AnimatedLetters text="DIPSAN" delay={0.35} stagger={0.06} letterClassName="gold-text" />
            <span className="mx-2.5 inline-block w-1.5" aria-hidden />
            <AnimatedLetters text="ACADEMY" delay={0.75} stagger={0.055} letterClassName="gold-text" />
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

      {/* Mobile/desktop top actions — always show Alerts icon */}
      <div
        className={`fixed right-2 top-2 z-[80] flex flex-nowrap items-center justify-end gap-2 transition-all duration-700 sm:right-5 sm:top-5 md:right-8 md:top-6 ${
          phase === "ready" ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
        }`}
      >
        <NotificationBell />
        <SupportButton />
        <BrandLogo size="sm" glow spinRing />
      </div>

      {user && (
        <div
          className={`fixed left-3 top-3 z-40 flex max-w-[42vw] items-center gap-2 transition-all duration-700 sm:left-5 sm:top-5 sm:max-w-[50vw] sm:gap-3 md:left-8 md:top-6 md:max-w-none ${
            phase === "ready" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold tracking-wide text-mist sm:text-lg md:text-xl">
              Hi, <span className="gold-text">{firstName}</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-bronze sm:text-[10px] sm:tracking-[0.22em]">
              {user.role === "teacher" ? "Teacher" : "Student"}
            </p>
          </div>
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/55 via-paper/35 to-paper" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,18,28,0.6)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(94,200,192,0.16),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(212,176,106,0.12),transparent_45%)]" />
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

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:px-10">
            <div className="h-8 pr-14 sm:h-10 sm:pr-16" aria-hidden />

            <div className="mb-auto mt-auto flex flex-col items-center py-4 text-center sm:py-8 md:py-10">
              {/* Brand circle: crest stays on the orbit and rests at top-center (middle of ring) */}
              <div className="relative mx-auto aspect-square w-[min(78vw,340px)] sm:w-[min(86vw,460px)] md:w-[min(92vw,560px)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full border border-aurora/35 shadow-[0_0_60px_rgba(94,200,192,0.12)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-[7%] rounded-full border border-gold/15"
                />

                {phase === "ready" && (
                  <div
                    key={`crest-orbit-${orbitRun}`}
                    className={`pointer-events-none absolute inset-0 z-40 ${
                      orbitDone ? "" : "animate-crest-orbit"
                    }`}
                    onAnimationEnd={(e) => {
                      if (e.target === e.currentTarget) setOrbitDone(true);
                    }}
                  >
                    {/* Logo rides the rim; counter-spin keeps it upright (no tilt/scale) */}
                    <button
                      type="button"
                      aria-label="Send logo around the orbit"
                      className="pointer-events-auto absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrbitDone(false);
                        setOrbitRun((n) => n + 1);
                      }}
                    >
                      <div className={orbitDone ? "animate-float" : "animate-crest-face"}>
                        <BrandLogo to={null} size="xl" glow spinRing={orbitDone} />
                      </div>
                    </button>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-4 pt-14 sm:px-8 sm:pt-16">
                  <h1 className="relative z-10 font-display text-[clamp(1.85rem,7.5vw,4.75rem)] font-semibold leading-[0.95] tracking-tight">
                    {phase === "ready" ? (
                      <>
                        <AnimatedLetters text="Dipsan" delay={0.2} stagger={0.06} letterClassName="gold-text" />
                        <br />
                        <AnimatedLetters text="Academy" delay={0.55} stagger={0.055} letterClassName="text-mist" />
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
                    className="mt-3 max-w-[16rem] animate-fade-up text-xs leading-relaxed text-bronze sm:mt-5 sm:max-w-md sm:text-sm md:text-base"
                    style={{ animationDelay: "0.55s" }}
                  >
                    NEET &amp; JEE mocks — timed, scored, and reviewed the moment you submit.
                  </p>

                  <div
                    className="pointer-events-auto mt-4 flex animate-fade-up flex-wrap items-center justify-center gap-2 sm:mt-7 sm:gap-3"
                    style={{ animationDelay: "0.7s" }}
                  >
                    {user ? (
                      <>
                        <Link
                          to={user.role === "teacher" ? "/teacher" : "/student"}
                          className="inline-flex items-center rounded-full bg-gold px-5 py-2.5 text-xs font-bold tracking-wide text-ink transition hover:bg-champagne sm:px-8 sm:py-3.5 sm:text-sm"
                        >
                          Go to dashboard
                        </Link>
                        <button
                          type="button"
                          onClick={logout}
                          className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wide text-mist transition hover:border-gold hover:text-gold sm:px-8 sm:py-3.5 sm:text-sm"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="inline-flex items-center rounded-full bg-gold px-5 py-2.5 text-xs font-bold tracking-wide text-ink transition hover:bg-champagne sm:px-8 sm:py-3.5 sm:text-sm"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wide text-mist transition hover:border-gold hover:text-gold sm:px-8 sm:py-3.5 sm:text-sm"
                        >
                          Sign up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1 border-t border-white/10 pt-3 sm:mt-2 sm:pt-5">
              {funSubject && (
                <SubjectFunFactInline
                  subject={funSubject}
                  refreshKey={funKey}
                  onClose={() => setFunSubject(null)}
                  onShuffle={() => setFunKey((k) => k + 1)}
                />
              )}
              <SubjectNav
                active={funSubject}
                onSelect={(s) => {
                  setFunSubject(s);
                  setFunKey((k) => k + 1);
                }}
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 bg-coal">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10 md:py-24">
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
              <p className="mt-4 text-sm text-bronze/80">
                Try the live clock on the right — pause it, mark questions, feel the pressure drop into
                precision.
              </p>
            </div>
            <PrecisionPressureLab />
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto grid max-w-6xl md:grid-cols-2">
            <div className="flex flex-col border-b border-white/10 md:border-b-0 md:border-r">
              <div className="px-6 pt-12 pb-6 md:px-10 md:pt-16 md:pb-8">
                <BrandLogo size="xs" glow />
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Students
                </div>
                <h3 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
                  Practice like the real paper.
                </h3>
                <p className="mt-3 max-w-sm leading-relaxed text-bronze">
                  Timed attempts, negative marking, and solution walkthroughs for NEET &amp; JEE.
                  Tap the bubbles to mark answers on the live sheet.
                </p>
              </div>
              <div className="relative min-h-[340px] flex-1 overflow-hidden md:min-h-[380px]">
                <PracticePaperAnim />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="px-6 pt-12 pb-6 md:px-10 md:pt-16 md:pb-8">
                <BrandLogo size="xs" glow />
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Teachers
                </div>
                <h3 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
                  Publish once. Read every attempt.
                </h3>
                <p className="mt-3 max-w-sm leading-relaxed text-bronze">
                  Build image-rich papers, then inspect results and question accuracy with clarity.
                  Tap Publish, then inspect the accuracy bars.
                </p>
              </div>
              <div className="relative min-h-[340px] flex-1 overflow-hidden md:min-h-[380px]">
                <TeachersPublishAnim />
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 bg-coal">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,176,106,0.12), transparent 55%)," +
                "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(94,200,192,0.08), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center md:px-10 md:py-20">
            <BrandLogo size="lg" glow spinRing />
            <h2 className="mt-8 font-display text-4xl font-semibold text-mist md:text-5xl">
              Ready when you are.
            </h2>
            <p className="mt-3 max-w-md text-bronze">
              Enter the hall with focus — and the clock ahead.
            </p>
            <div className="mt-6 w-full px-2">
              <ReadyFocusClock />
            </div>
            {user ? (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
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
              <div className="mt-8 flex flex-wrap justify-center gap-3">
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
