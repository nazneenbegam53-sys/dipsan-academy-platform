import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

type Phase = "intro" | "settle" | "ready";

export default function Landing() {
  const { user } = useAuth();
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
    <div className="relative min-h-screen soft-atmosphere text-ink overflow-x-hidden">
      {/* Intro logo — animates only on first open, then docks top-right */}
      <div
        className={`fixed z-50 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          phase === "intro"
            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : "left-auto right-5 top-5 translate-x-0 translate-y-0 md:right-8 md:top-6"
        }`}
      >
        <Link to="/" aria-label="Dipsan Academy home">
          <BrandLogo
            to={null}
            rounded
            size={phase === "intro" ? "hero" : "xs"}
            className={`${phase === "intro" ? "animate-logo-enter" : ""} transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
          />
        </Link>
      </div>

      {/* Soft veil during intro */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 bg-mist/80 transition-opacity duration-700 ${
          phase === "ready" ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        className={`relative z-10 transition-opacity duration-700 ${
          phase === "ready" ? "opacity-100" : "opacity-0"
        }`}
      >
        <section className="relative min-h-[100svh]">
          <div className="mx-auto flex min-h-[100svh] max-w-5xl flex-col px-6 pb-14 pt-8 md:px-10">
            <nav className="flex items-center justify-between pr-14">
              <span className="font-display text-lg font-semibold tracking-wide text-ink">
                Dipsan Academy
              </span>
              {!user ? (
                <Link to="/login" className="text-sm font-medium text-bronze transition hover:text-ink">
                  Log in
                </Link>
              ) : (
                <Link
                  to={user.role === "teacher" ? "/teacher" : "/student"}
                  className="text-sm font-medium text-bronze transition hover:text-ink"
                >
                  Dashboard
                </Link>
              )}
            </nav>

            <div className="mt-auto mb-auto max-w-xl pt-16 pb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bronze">
                Mock test series
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.75rem,9vw,4.75rem)] font-semibold leading-[1.05] tracking-tight text-ink text-balance">
                Practice with calm focus.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-bronze md:text-lg">
                Full-length NEET &amp; JEE mocks — timed, scored, and reviewed the moment you submit.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to={user.role === "teacher" ? "/teacher" : "/student"}
                    className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-mist transition hover:bg-ink/90"
                  >
                    Go to your dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-mist transition hover:bg-ink/90"
                    >
                      Start practicing
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center rounded-full border border-ink/15 bg-white/50 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-ink/10 pt-6 text-xs tracking-wide text-bronze">
              <span>CBT style</span>
              <span>Auto-grade</span>
              <span>Solutions</span>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-soft/70">
          <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-24">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl text-balance max-w-2xl">
              Sit the paper. Trust the timer. Read the truth in your score.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-bronze">
              Every mock mirrors exam-day pressure — question palette, marking scheme, and instant feedback when the clock hits zero.
            </p>

            <ol className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                { n: "01", title: "Enter the hall", body: "Open a published paper, read the instructions, go fullscreen." },
                { n: "02", title: "Mark with intent", body: "Navigate like CBT — answer, clear, or flag for review under the clock." },
                { n: "03", title: "Own the review", body: "See correct vs yours, explanations, and a scorecard you can download." },
              ].map((step) => (
                <li key={step.n} className="border-t border-ink/10 pt-5">
                  <div className="text-xs font-semibold tracking-widest text-gold">{step.n}</div>
                  <div className="mt-2 font-display text-xl font-semibold text-ink">{step.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-bronze">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-ink/8">
          <div className="mx-auto grid max-w-5xl md:grid-cols-2">
            <div className="border-b border-ink/8 px-6 py-16 md:border-b-0 md:border-r md:px-10 md:py-20">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze">Students</div>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink">Practice like the real paper.</h3>
              <p className="mt-3 max-w-sm text-bronze leading-relaxed">
                Timed attempts, negative marking, and solution walkthroughs built for NEET &amp; JEE rhythms.
              </p>
            </div>
            <div className="px-6 py-16 md:px-10 md:py-20">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze">Teachers</div>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink">Publish once. Read every attempt.</h3>
              <p className="mt-3 max-w-sm text-bronze leading-relaxed">
                Build image-rich papers, release them, then inspect results, violations, and question accuracy.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-ink/8 bg-coal/60">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">Ready when you are.</h2>
              <p className="mt-2 max-w-md text-bronze">Create an account and take your next mock with the clock running.</p>
            </div>
            <Link
              to={user ? (user.role === "teacher" ? "/teacher" : "/student") : "/register"}
              className="inline-flex shrink-0 items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-mist transition hover:bg-ink/90"
            >
              {user ? "Open dashboard" : "Create account"}
            </Link>
          </div>
        </section>

        <footer className="border-t border-ink/8 px-6 py-7 md:px-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-sm text-bronze">
            <span className="font-display font-semibold text-ink">Dipsan Academy</span>
            <span className="text-xs">Online examination platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
