import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { Role } from "../types";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", className: "", rollNumber: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ ...form, role });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-sm border border-gold/25 bg-charcoal px-3.5 py-2.5 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-1 focus:ring-gold/40";

  return (
    <PageShell className="flex min-h-screen">
      <div className="hidden w-[44%] flex-col items-center justify-center gap-8 border-r border-gold/15 bg-coal px-10 lg:flex">
        <BrandLogo size="lg" to="/" />
        <p className="max-w-xs text-center font-display text-2xl italic text-champagne/80">
          Join the mock series.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="md" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-champagne">Create your account</h1>
          <p className="mt-2 text-sm text-bronze">Pick a role and get started.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-sm border border-gold/20 bg-charcoal p-1">
            {(["student", "teacher"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                type="button"
                className={`rounded-sm py-2 text-sm font-semibold transition ${
                  role === r ? "bg-gold text-ink" : "text-bronze hover:text-champagne"
                }`}
              >
                {r === "student" ? "Student" : "Teacher"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <ErrorBanner message={error} />
            <input required placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} />
            <input type="email" required placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={fieldClass}
            />

            {role === "student" && (
              <>
                <input placeholder="Class (e.g. 12th, Dropper)" value={form.className} onChange={(e) => update("className", e.target.value)} className={fieldClass} />
                <input placeholder="Roll number (optional)" value={form.rollNumber} onChange={(e) => update("rollNumber", e.target.value)} className={fieldClass} />
                <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} />
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-bronze">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
