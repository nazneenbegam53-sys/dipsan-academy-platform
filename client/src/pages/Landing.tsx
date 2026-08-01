import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-ink text-mist">
      {/* HERO — logo as brand-first signal, one composition */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere" />
        <div className="absolute inset-x-0 top-1/3 h-px hairline-gold opacity-40" />
        <div className="absolute left-1/2 top-[42%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl animate-pulse-soft" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col px-6 pb-12 pt-7 md:px-10">
          <nav className="flex items-center justify-between animate-fade-in">
            <BrandLogo size="sm" />
            {!user ? (
              <Link to="/login" className="text-sm font-medium text-bronze transition hover:text-gold">
                Log in
              </Link>
            ) : (
              <Link
                to={user.role === "teacher" ? "/teacher" : "/student"}
                className="text-sm font-medium text-bronze transition hover:text-gold"
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="mt-auto mb-auto flex flex-col items-center text-center">
            <div className="animate-fade-up animate-float">
              <BrandLogo size="hero" to={null} />
            </div>

            <h1 className="sr-only">Dipsan Academy</h1>

            <p
              className="mt-8 max-w-md font-display text-2xl font-medium italic leading-snug text-champagne/85 animate-fade-up md:text-3xl text-balance"
              style={{ animationDelay: "0.15s" }}
            >
              Full-length NEET &amp; JEE mocks — timed, scored, reviewed.
            </p>

            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "0.28s" }}
            >
              {user ? (
                <Link
                  to={user.role === "teacher" ? "/teacher" : "/student"}
                  className="inline-flex items-center rounded-sm bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-champagne"
                >
                  Go to your dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-sm bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-champagne"
                  >
                    Start practicing
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-sm border border-gold/40 px-7 py-3.5 text-sm font-semibold tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-6 border-t border-gold/15 pt-6 text-[11px] uppercase tracking-[0.22em] text-bronze animate-fade-in"
            style={{ animationDelay: "0.45s" }}
          >
            <span>Mock series</span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span>CBT</span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span>Auto-grade</span>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-coal">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-champagne md:text-5xl text-balance max-w-2xl">
            Sit the paper. Trust the timer. Read the truth in your score.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-bronze">
            Every mock mirrors exam-day pressure — question palette, marking scheme, and instant feedback when the clock hits zero.
          </p>

          <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              { n: "01", title: "Enter the hall", body: "Open a published paper, read the instructions, go fullscreen." },
              { n: "02", title: "Mark with intent", body: "Navigate like CBT — answer, clear, or flag for review under the clock." },
              { n: "03", title: "Own the review", body: "See correct vs yours, explanations, and a scorecard you can download." },
            ].map((step) => (
              <li key={step.n} className="border-t border-gold/20 pt-6">
                <div className="font-display text-sm font-semibold tracking-widest text-gold">{step.n}</div>
                <div className="mt-3 font-display text-2xl font-semibold text-mist">{step.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-bronze">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-gold/10">
        <div className="mx-auto grid max-w-5xl md:grid-cols-2">
          <div className="border-b border-gold/10 px-6 py-20 md:border-b-0 md:border-r md:px-10 md:py-24">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Students</div>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-champagne md:text-4xl">
              Practice like the real paper.
            </h3>
            <p className="mt-4 max-w-sm text-bronze leading-relaxed">
              Timed attempts, negative marking, and solution walkthroughs built for NEET &amp; JEE rhythms.
            </p>
          </div>
          <div className="px-6 py-20 md:px-10 md:py-24">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Teachers</div>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-champagne md:text-4xl">
              Publish once. Read every attempt.
            </h3>
            <p className="mt-4 max-w-sm text-bronze leading-relaxed">
              Build image-rich papers, release them, then inspect results, violations, and question accuracy.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-gold/10 bg-charcoal">
        <div className="absolute inset-0 opacity-40 hero-atmosphere" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-24 md:flex-row md:items-center md:justify-between md:px-10 md:py-28">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-champagne md:text-5xl">
              Ready when you are.
            </h2>
            <p className="mt-3 max-w-md text-bronze">
              Create an account and take your next mock with the clock running.
            </p>
          </div>
          <Link
            to={user ? (user.role === "teacher" ? "/teacher" : "/student") : "/register"}
            className="inline-flex shrink-0 items-center rounded-sm bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-champagne"
          >
            {user ? "Open dashboard" : "Create account"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gold/10 bg-ink px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLogo size="sm" showWordmark />
          <span className="text-xs text-bronze">Online examination platform</span>
        </div>
      </footer>
    </div>
  );
}
