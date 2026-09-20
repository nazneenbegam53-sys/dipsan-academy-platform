import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { PageShell } from "../components/ui";

const CLASSROOM_APP_URL =
  (import.meta.env.VITE_CLASSROOM_APP_URL as string | undefined) ||
  "https://dipsan-classroom.vercel.app";

export default function InstallClassroom() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <BrandLogo size="md" showWordmark glow />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-aurora">
          Separate app
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
          Install DIPSAN ACADEMY CLASSROOM
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bronze">
          This is the live teaching app — whiteboard plus video &amp; microphone — not the mock-exam
          app. Install it free from the browser (no Play Store / App Store fee).
        </p>

        <a
          href={CLASSROOM_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-champagne sm:w-auto"
        >
          Open Classroom app
        </a>

        <div className="mt-10 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">Android (Chrome)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>
                Open{" "}
                <a href={CLASSROOM_APP_URL} className="text-gold underline-offset-2 hover:underline">
                  {CLASSROOM_APP_URL.replace(/^https?:\/\//, "")}
                </a>{" "}
                in Chrome.
              </li>
              <li>Tap the menu (⋮) → Install app / Add to Home screen.</li>
              <li>Confirm — launch DIPSAN ACADEMY CLASSROOM from your home screen.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">iPhone / iPad (Safari)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Open the Classroom app URL in Safari.</li>
              <li>
                Tap Share → <span className="text-mist">Add to Home Screen</span>.
              </li>
              <li>Tap Add. Allow camera &amp; microphone when you join a live board.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-bronze">
              <li>Live collaborative whiteboard</li>
              <li>Teacher and students can talk with video &amp; mic</li>
              <li>Same Dipsan Academy account as the exam platform</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/" className="text-sm font-semibold text-gold hover:text-champagne">
            ← Back to Dipsan Academy
          </Link>
          <Link to="/install" className="text-sm font-semibold text-bronze hover:text-mist">
            Install exams app instead
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
