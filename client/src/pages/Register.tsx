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
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-bronze/50 focus:border-gold focus:ring-2 focus:ring-gold/20";

  return (
    <PageShell className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>

      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-ink/8 bg-white/75 p-8 shadow-sm shadow-ink/5 backdrop-blur-sm md:p-10">
        <div className="mb-6 text-center">
          <Link to="/" className="font-display text-lg font-semibold text-ink">
            Dipsan Academy
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">
            Sign up
          </h1>
          <p className="mt-2 text-sm text-bronze">Pick a role and get started.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-coal/80 p-1">
          {(["student", "teacher"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              type="button"
              className={`rounded-full py-2 text-sm font-semibold transition ${
                role === r ? "bg-ink text-mist shadow-sm" : "text-bronze hover:text-ink"
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

          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-bronze">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-ink underline decoration-gold/50 underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
