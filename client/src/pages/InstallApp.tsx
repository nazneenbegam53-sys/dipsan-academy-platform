import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { InstallAppButton } from "../components/InstallAppButton";
import { PageShell } from "../components/ui";

export default function InstallApp() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <BrandLogo size="md" showWordmark glow />
        <h1 className="mt-8 font-display text-3xl font-semibold text-mist">
          Install Dipsan Academy — free
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bronze">
          You do <span className="text-champagne">not</span> need the Play Store or App Store.
          Install from this website at no cost. It opens like a normal app from your home screen —
          and stays in sync with the website (exams, results, ₹2000 subscription, teacher tools).
        </p>

        <div className="mt-8">
          <InstallAppButton variant="solid" />
        </div>

        <div className="mt-10 space-y-8">
          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">Android (Chrome)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Open this site in Chrome.</li>
              <li>
                Tap <span className="text-mist">Install free app</span> above, or the browser menu →
                Install app.
              </li>
              <li>Confirm — the Dipsan Academy icon appears on your home screen.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">iPhone / iPad (Safari)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Open this site in Safari (not Chrome).</li>
              <li>
                Tap Share → <span className="text-mist">Add to Home Screen</span>.
              </li>
              <li>Tap Add — done. No Apple fee.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">One product everywhere</h2>
            <p className="mt-3 text-sm text-bronze">
              The installed app uses the same live site and API as{" "}
              <span className="text-mist">dipsan-academy-platform.vercel.app</span>. When we ship
              website updates (subscription, exams, solutions), they appear in the app the next time
              you open it — same login, same progress.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">
              Play Store / App Store later?
            </h2>
            <p className="mt-3 text-sm text-bronze">
              Official stores are paid (Google ~$25 once, Apple ~$99/year). The free install above
              works today. Store shells also load this live website so they stay in sync — see{" "}
              <code className="text-mist">client/MOBILE_APP.md</code>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/subscribe" className="text-sm font-semibold text-gold hover:text-champagne">
            Subscribe ₹2000 →
          </Link>
          <Link to="/" className="text-sm font-semibold text-gold hover:text-champagne">
            ← Back to Dipsan Academy
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
