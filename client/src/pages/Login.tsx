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
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <PageShell className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="w-full max-w-md animate-fade-up luxury-panel rounded-3xl p-8 md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="lg" glow spinRing />
          <p className="mt-4 font-display text-sm font-semibold tracking-[0.22em] gold-text">
            DIPSAN ACADEMY
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mist">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-bronze">Log in to continue your mock series.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-bronze">
          No account?{" "}
          <Link to="/register" className="font-semibold text-gold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
