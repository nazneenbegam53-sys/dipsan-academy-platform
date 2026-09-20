import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, PageShell } from "../components/ui";
import { InstallBanner } from "../components/InstallBanner";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <PageShell className="flex min-h-[100dvh] flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-16 text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-aurora/90 animate-fade-in">
          Live class sessions
        </p>
        <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-mist animate-title-rise sm:text-5xl md:text-6xl">
          <span className="gold-text">DIPSAN ACADEMY</span>
          <br />
          <span className="text-champagne">CLASSROOM</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-bronze animate-fade-up sm:text-base">
          Collaborative whiteboard and video calls — install as a standalone app for class.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
          {user ? (
            <>
              <Link to="/classroom">
                <Button>Enter classroom</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button>Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="ghost">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <InstallBanner />
    </PageShell>
  );
}
