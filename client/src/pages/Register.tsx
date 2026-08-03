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
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    className: "",
    rollNumber: "",
    phone: "",
  });
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
      try {
        sessionStorage.setItem("dipsan_intro_done", "1");
      } catch {
        /* ignore */
      }
      navigate(role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <PageShell className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="w-full max-w-md animate-fade-up luxury-panel rounded-3xl p-8 md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" glow spinRing />
          <p className="mt-4 font-display text-sm font-semibold tracking-[0.22em] gold-text">
            DIPSAN ACADEMY
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mist">
            Sign up
          </h1>
          <p className="mt-2 text-sm text-bronze">Join the mock series.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-gold/20 bg-ink/60 p-1">
          {(["student", "teacher"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              type="button"
              className={`rounded-full py-2 text-sm font-semibold transition ${
                role === r ? "bg-gold text-ink" : "text-bronze hover:text-champagne"
              }`}
            >
              {r === "student" ? "Student" : "Teacher"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <ErrorBanner message={error} />
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={fieldClass}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={fieldClass}
          />
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
              <input
                placeholder="Class (e.g. 12th, Dropper)"
                value={form.className}
                onChange={(e) => update("className", e.target.value)}
                className={fieldClass}
              />
              <input
                placeholder="Roll number (optional)"
                value={form.rollNumber}
                onChange={(e) => update("rollNumber", e.target.value)}
                className={fieldClass}
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={fieldClass}
              />
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-bronze">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
