import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";
import { NotificationBell } from "./NotificationBell";
import { SupportButton } from "./SupportButton";
import { isStandaloneApp } from "../lib/native";

/** Same home on the website and in the installed app. */
export function AppHomeScreen() {
  const { user, loading, logout } = useAuth();
  const standalone = isStandaloneApp();

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col science-atmosphere text-mist"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="safe-top-right flex flex-nowrap items-center gap-2">
        <NotificationBell />
        <SupportButton />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-8">
        <div className="flex items-center gap-3">
          <BrandLogo to={null} size="md" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-aurora/90">
              Dipsan Academy
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight text-mist">
              {loading ? "Home" : user ? `Hi, ${user.name.trim().split(/\s+/)[0] || user.name}` : "Home"}
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-bronze">
          {user
            ? user.role === "teacher"
              ? "Create papers, publish mocks, and review every attempt."
              : "Timed NEET & JEE mocks — same account as the website."
            : "Timed mock exams. Log in or create an account to start."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {loading ? (
            <div className="h-12 w-full animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <>
              <Link
                to={user.role === "teacher" ? "/teacher" : "/student"}
                className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-bold tracking-wide text-ink"
              >
                {user.role === "teacher" ? "Teacher dashboard" : "Available exams"}
              </Link>
              <Link
                to={user.role === "teacher" ? "/teacher/results" : "/student#history"}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-mist"
              >
                Results
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-bronze"
              >
                Log out
              </button>
            </>
          ) : (
            <>
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
              {!standalone && (
                <a
                  href="/install/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-aurora/35 bg-aurora/10 px-6 py-3 text-sm font-semibold text-champagne"
                >
                  Add to home screen
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
