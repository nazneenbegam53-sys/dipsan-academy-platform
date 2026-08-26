import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { PageShell } from "../components/ui";

export default function PrivacyPolicy() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <BrandLogo size="md" showWordmark glow />
        <h1 className="mt-8 font-display text-3xl font-semibold text-mist">Privacy Policy</h1>
        <p className="mt-2 text-sm text-bronze">Last updated: August 2026 · Dipsan Academy</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-mist/90">
          <p>
            Dipsan Academy (&quot;we&quot;) provides timed mock exams for students and exam tools for
            teachers. This policy explains what we collect and why.
          </p>

          <section>
            <h2 className="font-display text-xl font-semibold text-champagne">Account data</h2>
            <p className="mt-2 text-bronze">
              When you register we store your name, mobile number, role (student or
              teacher), and optional class and roll number. We use this to send SMS OTP,
              authenticate you, and personalise your dashboard.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-champagne">Exam activity</h2>
            <p className="mt-2 text-bronze">
              During attempts we store answers, timing, scores, and integrity signals (for example
              focus or fullscreen changes) so teachers can review results and fairness. Teachers may
              also upload question images or video solutions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-champagne">Device &amp; app</h2>
            <p className="mt-2 text-bronze">
              The mobile app loads content in a secure WebView and talks to our API over HTTPS. We do
              not sell personal data. Push notifications, if enabled later, will be opt-in.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-champagne">Your choices</h2>
            <p className="mt-2 text-bronze">
              Contact support from the in-app Support button to request account deletion or a copy of
              your data. Continue using the service only if you agree to this policy.
            </p>
          </section>
        </div>

        <Link to="/" className="mt-10 inline-block text-sm font-semibold text-gold hover:text-champagne">
          ← Back to Dipsan Academy
        </Link>
      </div>
    </PageShell>
  );
}
