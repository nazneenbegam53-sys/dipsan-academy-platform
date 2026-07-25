import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ErrorBanner } from "../components/ui";
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-paper py-10">
      <Card className="p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-ink mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-5">Join Dipsan Academy</p>

        <div className="flex rounded-full bg-gray-100 p-1 mb-5">
          {(["student", "teacher"] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} type="button"
              className={`flex-1 rounded-full py-1.5 text-sm font-semibold ${role === r ? "bg-ink text-paper" : "text-gray-500"}`}>
              {r === "student" ? "Student" : "Teacher"}
            </button>
          ))}
        </div>

        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
          <input type="email" required placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
          <input type="password" required minLength={6} placeholder="Password (min 6 characters)" value={form.password}
            onChange={(e) => update("password", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />

          {role === "student" && (
            <>
              <input placeholder="Class (e.g. 12th, Dropper)" value={form.className} onChange={(e) => update("className", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
              <input placeholder="Roll number (optional)" value={form.rollNumber} onChange={(e) => update("rollNumber", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
              <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</Button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-ink font-semibold">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
