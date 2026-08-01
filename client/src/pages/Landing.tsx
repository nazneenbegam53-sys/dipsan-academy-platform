import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 omr-sheet" />
      <div className="absolute inset-0 hero-grid opacity-40" />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-teal/30 blur-3xl animate-drift" />
      <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-signal/20 blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-forest/60 blur-3xl" />

      {/* Abstract OMR / answer-bubble motif — the exam desk atmosphere */}
      <svg
        className="absolute right-[-8%] top-[12%] h-[78%] w-auto opacity-[0.55] max-md:right-[-30%] max-md:opacity-30"
        viewBox="0 0 420 560"
        fill="none"
      >
        <rect x="40" y="30" width="300" height="500" rx="18" stroke="rgba(200,245,66,0.35)" strokeWidth="1.5" />
        <rect x="70" y="70" width="160" height="10" rx="3" fill="rgba(228,236,234,0.25)" />
        <rect x="70" y="92" width="110" height="8" rx="3" fill="rgba(228,236,234,0.15)" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <g key={row} transform={`translate(70 ${140 + row * 36})`}>
            <text x="0" y="14" fill="rgba(200,245,66,0.55)" fontSize="11" fontFamily="DM Sans, sans-serif">
              {String(row + 1).padStart(2, "0")}
            </text>
            {[0, 1, 2, 3].map((col) => {
              const filled = (row + col) % 3 === 0;
              return (
                <circle
                  key={col}
                  cx={60 + col * 42}
                  cy={10}
                  r="11"
                  fill={filled ? "#C8F542" : "transparent"}
                  stroke={filled ? "#C8F542" : "rgba(228,236,234,0.35)"}
                  strokeWidth="1.5"
                  className={filled ? "animate-mark-in" : undefined}
                  style={filled ? { animationDelay: `${0.4 + row * 0.08}s` } : undefined}
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-paper text-ink">
      {/* HERO — one composition: brand, headline, line, CTA, dominant visual */}
      <section className="relative min-h-[100svh] overflow-hidden text-mist">
        <HeroVisual />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-14 pt-8 md:px-10">
          <nav className="flex items-center justify-between animate-fade-in">
            <span className="font-display text-sm font-semibold tracking-wide text-signal/90">
              Dipsan Academy
            </span>
            {!user && (
              <Link
                to="/login"
                className="text-sm font-medium text-mist/70 transition hover:text-signal"
              >
                Log in
              </Link>
            )}
          </nav>

          <div className="mt-auto mb-auto max-w-xl pt-20 pb-16 md:pt-8">
            <h1 className="font-display text-[clamp(3.25rem,12vw,6.5rem)] font-extrabold leading-[0.92] tracking-tight text-mist animate-fade-up">
              Dipsan
              <br />
              <span className="text-signal">Academy</span>
            </h1>

            <p
              className="mt-6 max-w-md text-lg leading-relaxed text-mist/75 animate-fade-up text-balance"
              style={{ animationDelay: "0.12s" }}
            >
              Full-length NEET &amp; JEE mocks — timed, scored, and reviewed the moment you submit.
            </p>

            <div
              className="mt-10 flex flex-wrap items-center gap-3 animate-fade-up"
              style={{ animationDelay: "0.22s" }}
            >
              {user ? (
                <Link
                  to={user.role === "teacher" ? "/teacher" : "/student"}
                  className="inline-flex items-center rounded-md bg-signal px-6 py-3.5 font-display text-sm font-bold text-ink transition hover:brightness-110"
                >
                  Go to your dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-md bg-signal px-6 py-3.5 font-display text-sm font-bold text-ink transition hover:brightness-110"
                  >
                    Start practicing
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-md border border-mist/25 px-6 py-3.5 font-display text-sm font-semibold text-mist transition hover:border-signal/50 hover:text-signal"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div
            className="flex items-end justify-between gap-4 border-t border-mist/10 pt-6 text-xs tracking-wide text-mist/45 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <span>Mock test series</span>
            <span className="hidden sm:inline">CBT · Auto-grade · Solutions</span>
          </div>
        </div>
      </section>

      {/* One job: how a session feels */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl text-balance max-w-2xl">
          Sit the paper. Trust the timer. Read the truth in your score.
        </h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-forest/70">
          Every mock mirrors exam-day pressure — question palette, marking scheme, and instant feedback when the clock hits zero.
        </p>

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            { n: "01", title: "Enter the hall", body: "Open a published paper, read the instructions, go fullscreen." },
            { n: "02", title: "Mark with intent", body: "Navigate like CBT — answer, clear, or flag for review under the clock." },
            { n: "03", title: "Own the review", body: "See correct vs yours, explanations, and a scorecard you can download." },
          ].map((step) => (
            <li key={step.n} className="border-t border-ink/10 pt-6">
              <div className="font-display text-sm font-semibold text-teal">{step.n}</div>
              <div className="mt-3 font-display text-xl font-bold">{step.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-forest/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* One job: who it's for */}
      <section className="bg-ink text-mist">
        <div className="mx-auto grid max-w-6xl md:grid-cols-2">
          <div className="border-b border-mist/10 px-6 py-20 md:border-b-0 md:border-r md:px-10 md:py-28">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-signal">Students</div>
            <h3 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Practice like the real paper.
            </h3>
            <p className="mt-4 max-w-sm text-mist/65 leading-relaxed">
              Timed attempts, negative marking, and solution walkthroughs built for NEET &amp; JEE rhythms.
            </p>
          </div>
          <div className="px-6 py-20 md:px-10 md:py-28">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-signal">Teachers</div>
            <h3 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Publish once. Read every attempt.
            </h3>
            <p className="mt-4 max-w-sm text-mist/65 leading-relaxed">
              Build image-rich papers, release them, then inspect results, violations, and question accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-forest">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-24 md:flex-row md:items-end md:justify-between md:px-10 md:py-28">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-mist md:text-5xl">
              Ready when you are.
            </h2>
            <p className="mt-3 max-w-md text-mist/65">
              Create an account and take your next mock with the clock running.
            </p>
          </div>
          {user ? (
            <Link
              to={user.role === "teacher" ? "/teacher" : "/student"}
              className="inline-flex shrink-0 items-center rounded-md bg-signal px-6 py-3.5 font-display text-sm font-bold text-ink transition hover:brightness-110"
            >
              Open dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex shrink-0 items-center rounded-md bg-signal px-6 py-3.5 font-display text-sm font-bold text-ink transition hover:brightness-110"
            >
              Create account
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-paper px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-sm font-semibold text-ink">Dipsan Academy</span>
          <span className="text-xs text-forest/50">Online examination platform</span>
        </div>
      </footer>
    </div>
  );
}
