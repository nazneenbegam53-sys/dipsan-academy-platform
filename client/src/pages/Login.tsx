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
    "w-full rounded-sm border border-gold/25 bg-charcoal px-3.5 py-2.5 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-1 focus:ring-gold/40";

  return (
    <PageShell className="flex min-h-screen">
      <div className="hidden w-[44%] flex-col items-center justify-center gap-8 border-r border-gold/15 bg-coal px-10 lg:flex">
        <BrandLogo size="lg" to="/" />
        <p className="max-w-xs text-center font-display text-2xl italic text-champagne/80">
          Back to the next paper.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="md" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-champagne">Welcome back</h1>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-bronze">
            No account?{" "}
            <Link to="/register" className="font-semibold text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
