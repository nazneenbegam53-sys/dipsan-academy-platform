import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { LoginScienceBg } from "../components/LoginScienceBg";

const INTRO_KEY = "dipsan_intro_done";

type Step = "phone" | "otp";

export default function Login() {
  const { sendLoginOtp, verifyLoginOtp, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
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

  async function requestOtp() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await sendLoginOtp(phone.trim());
      setChallengeId(res.challengeId);
      setDevOtp(res.otp || res.devOtp || "");
      setInfo(res.message || "Enter the OTP shown on this screen.");
      setStep("otp");
      setOtp("");
    } catch (err: any) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    await requestOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyLoginOtp(challengeId, otp.trim());
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-bronze">
            {step === "otp" ? "Enter the 6-digit code shown below" : "Log in with your mobile number"}
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <ErrorBanner message={error} />
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
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <ErrorBanner message={error} />
            {info && <p className="text-xs text-aurora">{info}</p>}
            {devOtp && (
              <p className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-2 text-xs text-champagne">
                Your OTP: <strong className="tracking-widest text-gold">{devOtp}</strong>
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                6-digit OTP
              </span>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${fieldClass} tracking-[0.35em]`}
                autoComplete="one-time-code"
                placeholder="••••••"
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying…" : "Verify & log in"}
            </Button>
            <div className="flex justify-between text-xs text-bronze">
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => {
                  setStep("phone");
                  setError("");
                  setInfo("");
                }}
              >
                Change number
              </button>
              <button
                type="button"
                className="underline underline-offset-2"
                disabled={loading}
                onClick={() => requestOtp()}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-bronze">
          No account?{" "}
          <Link to="/register" className="font-semibold text-gold underline underline-offset-4">
            Sign up with OTP
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
