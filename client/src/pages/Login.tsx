import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ErrorBanner } from "../components/ui";

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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-ink mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-5">Log in to Dipsan Academy</p>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300" />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in…" : "Log in"}</Button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          No account? <Link to="/register" className="text-ink font-semibold">Register</Link>
        </p>
      </Card>
    </div>
  );
}
