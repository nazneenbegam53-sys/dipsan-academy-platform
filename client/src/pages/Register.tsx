import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
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
    "w-full rounded-md border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20";

  return (
    <PageShell className="flex min-h-screen">
      <div className="hidden w-[42%] flex-col justify-between bg-forest p-10 text-mist lg:flex">
        <Link to="/" className="font-display text-sm font-semibold text-signal">
          Dipsan Academy
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Join the<br />mock series.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist/60">
            Students sit timed papers. Teachers publish and read every attempt.
          </p>
        </div>
        <p className="text-xs text-mist/35">Create once · Practice often</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <Link to="/" className="mb-8 inline-block font-display text-sm font-semibold text-ink lg:hidden">
            Dipsan Academy
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-forest/60">Pick a role and get started.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-mist p-1">
            {(["student", "teacher"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                type="button"
                className={`rounded-md py-2 text-sm font-semibold transition ${
                  role === r ? "bg-ink text-mist shadow-sm" : "text-forest/55 hover:text-ink"
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

            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-forest/55">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
