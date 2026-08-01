import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  if (user) navigate("/");

  const fieldClass =
    "w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-bronze/50 focus:border-gold focus:ring-2 focus:ring-gold/20";

  return (
    <PageShell className="flex min-h-screen">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>

      <div className="hidden w-[42%] flex-col justify-between border-r border-ink/8 bg-soft/80 p-10 lg:flex">
        <Link to="/" className="font-display text-lg font-semibold text-ink">
          Dipsan Academy
        </Link>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight text-ink">
            Back to the<br />next paper.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bronze">
            Your mocks, attempts, and scorecards are waiting.
          </p>
        </div>
        <p className="text-xs text-bronze/70">Mock test series · NEET &amp; JEE</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <Link to="/" className="mb-8 inline-block font-display text-lg font-semibold text-ink lg:hidden">
            Dipsan Academy
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-bronze">Log in to continue practicing.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <ErrorBanner message={error} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">Password</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
            </label>
            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-bronze">
            No account?{" "}
            <Link to="/register" className="font-semibold text-ink underline decoration-gold/50 underline-offset-4">
              Register
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
