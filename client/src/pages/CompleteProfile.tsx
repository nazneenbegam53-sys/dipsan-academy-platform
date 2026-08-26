import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

/** Older accounts without a mobile number save one here. */
export default function CompleteProfile() {
  const { user, linkPhone, logout } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.phone && !user.needsPhone) {
      navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true });
    }
  }, [user, navigate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await linkPhone(phone.trim());
      navigate(user?.role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err: any) {
      setError(err.message || "Could not save mobile number.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <PageShell quiet className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-up luxury-panel rounded-3xl p-8 md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-mist">Add your mobile</h1>
          <p className="mt-2 text-sm text-bronze">
            Save a mobile number so you can log in with it and your password.
            {user?.phone ? (
              <>
                {" "}
                Signed in as <span className="text-mist">{user.phone}</span>.
              </>
            ) : null}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <ErrorBanner message={error} />
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
            placeholder="Mobile number"
            inputMode="tel"
            autoComplete="tel"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save number"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 w-full text-center text-xs text-bronze underline"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Log out
        </button>
      </div>
    </PageShell>
  );
}
