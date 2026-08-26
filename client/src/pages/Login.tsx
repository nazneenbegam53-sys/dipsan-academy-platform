import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { LoginScienceBg } from "../components/LoginScienceBg";

const INTRO_KEY = "dipsan_intro_done";

type Mode = "login" | "set-phone" | "set-otp";

export default function Login() {
  const { login, sendSetPasswordOtp, verifySetPasswordOtp, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    if (user.needsPhone || !user.phone) {
      navigate("/complete-profile", { replace: true });
      return;
    }
    navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true });
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await login(phone.trim(), password);
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      setError(err.message || "Could not log in.");
      setLoading(false);
    }
  }

  async function requestSetPasswordOtp() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await sendSetPasswordOtp(phone.trim());
      setChallengeId(res.challengeId);
      setDevOtp(res.otp || res.devOtp || "");
      setInfo(res.message || "Enter the OTP shown on this screen.");
      setMode("set-otp");
      setOtp("");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSetPassword(e: React.FormEvent) {
    e.preventDefault();
    await requestSetPasswordOtp();
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const message = await verifySetPasswordOtp(challengeId, otp.trim(), password);
      setInfo(message);
      setMode("login");
      setOtp("");
      setDevOtp("");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message || "Could not save password.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  const subtitle =
    mode === "login"
      ? "Log in with your mobile number and password"
      : mode === "set-otp"
        ? "Enter the 6-digit code, then choose a password"
        : "Verify your number to set a password";

  return (
    <PageShell quiet className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <LoginScienceBg />

      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="sm" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up luxury-panel rounded-3xl p-8 md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <p className="mt-4 font-display text-sm font-semibold tracking-[0.22em] gold-text">
            DIPSAN ACADEMY
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mist">
            {mode === "login" ? "Welcome back" : "Set password"}
          </h1>
          <p className="mt-2 text-sm text-bronze">{subtitle}</p>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <ErrorBanner message={error} />
            {info && <p className="text-xs text-aurora">{info}</p>}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                Mobile number
              </span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                autoComplete="tel"
                inputMode="tel"
                placeholder="98XXXXXXXX"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                Password
              </span>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-bronze underline underline-offset-2"
              onClick={() => {
                setMode("set-phone");
                setError("");
                setInfo("");
              }}
            >
              Set or reset password
            </button>
          </form>
        )}

        {mode === "set-phone" && (
          <form onSubmit={handleSendSetPassword} className="space-y-4">
            <ErrorBanner message={error} />
            <p className="text-xs text-bronze">
              OTP is only used to set a password. After that, log in with mobile number and password.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                Mobile number
              </span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                autoComplete="tel"
                inputMode="tel"
                placeholder="98XXXXXXXX"
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Getting OTP…" : "Get OTP"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-bronze underline underline-offset-2"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Back to log in
            </button>
          </form>
        )}

        {mode === "set-otp" && (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <ErrorBanner message={error} />
            {info && <p className="text-xs text-aurora">{info}</p>}
            {devOtp && (
              <p className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-2 text-xs text-champagne">
                Your OTP: <strong className="tracking-widest text-gold">{devOtp}</strong>
              </p>
            )}
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${fieldClass} tracking-[0.35em]`}
              autoComplete="one-time-code"
              placeholder="6-digit OTP"
            />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              autoComplete="new-password"
              placeholder="New password (min 6 characters)"
            />
            <input
              required
              type="password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={fieldClass}
              autoComplete="new-password"
              placeholder="Confirm password"
            />
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Saving…" : "Save password"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-bronze underline underline-offset-2"
              onClick={() => {
                setMode("set-phone");
                setError("");
              }}
            >
              Change number
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-bronze">
          No account?{" "}
          <Link to="/register" className="font-semibold text-gold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
