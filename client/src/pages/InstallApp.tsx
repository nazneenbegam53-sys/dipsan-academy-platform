import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { InstallAppButton } from "../components/InstallAppButton";
import { PageShell } from "../components/ui";

const INSTALL_URL = "https://dipsan-academy-platform.vercel.app/install";

export default function InstallApp() {
  return (
    <PageShell>
      <div className="mx-auto max-w-lg screen-pad py-10 sm:max-w-2xl">
        <BrandLogo size="md" showWordmark glow />
        <h1 className="mt-8 font-display text-3xl font-semibold text-mist">Get the app</h1>
        <p className="mt-3 text-sm leading-relaxed text-bronze">
          Same logins, exams, results, and teacher tools as the website — sized for a phone.
          No Play Store or App Store.
        </p>

        <div className="mt-8">
          <InstallAppButton variant="solid" />
        </div>

        <div className="mt-10 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">Android</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Open this page in Chrome.</li>
              <li>
                Tap <span className="text-mist">Install free app</span>, or Chrome menu → Install app.
              </li>
              <li>Leave the browser and open the new Dipsan Academy home-screen icon.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-white/10 bg-charcoal/50 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">iPhone</h2>
            <p className="mt-2 text-sm text-bronze">
              Apple does not allow installing unsigned apps from a download link. Use Safari:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Open this page in Safari (not Chrome).</li>
              <li>
                Tap Share → <span className="text-mist">Add to Home Screen</span> → Add.
              </li>
              <li>Leave Safari and open the home-screen icon.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">Share this link</h2>
            <p className="mt-3 break-all text-sm font-semibold text-mist">{INSTALL_URL}</p>
            <p className="mt-2 text-sm text-bronze">
              Works on both iPhone and Android. The installed app stays in sync with the live website.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link to="/" className="text-sm font-semibold text-gold hover:text-champagne">
            ← Back to Dipsan Academy
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
