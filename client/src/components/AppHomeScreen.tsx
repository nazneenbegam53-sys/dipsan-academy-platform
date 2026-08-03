import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";
import { useEffect } from "react";

/**
 * Compact home shown when the app is installed (standalone / native).
 * Feels like a real app launch screen — not a marketing website.
 */
export function AppHomeScreen() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center science-atmosphere text-mist">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center science-atmosphere text-mist">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col science-atmosphere text-mist"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-aurora/15 blur-3xl" />
        <div className="absolute -right-16 bottom-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <BrandLogo to={null} size="xl" glow spinRing />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-aurora/90">
          Dipsan Academy
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          <span className="gold-text">Mock exams</span>
          <br />
          ready when you are
        </h1>
        <p className="mt-3 max-w-xs text-sm text-bronze">
          Timed NEET &amp; JEE practice — scored the moment you submit.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-bold tracking-wide text-ink"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-mist"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
