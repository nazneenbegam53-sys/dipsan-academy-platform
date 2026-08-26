import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

/**
 * Forces every existing (password-era) account to link a WhatsApp mobile number
 * so login and result delivery work for all users.
 */
export default function CompleteProfile() {
  const { user, sendLinkPhoneOtp, verifyLinkPhoneOtp, logout } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.phone && !user.needsPhone) {
      navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true });
    }
  }, [user, navigate]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await sendLinkPhoneOtp(phone.trim());
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyLinkPhoneOtp(challengeId, otp.trim());
      navigate(user?.role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err: any) {
      setError(err.message || "Verification failed.");
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
          <h1 className="mt-4 font-display text-3xl font-semibold text-mist">Link your mobile</h1>
          <p className="mt-2 text-sm text-bronze">
            All users must verify a mobile number. Log in later with this number and your password.
            {user?.phone ? (
              <>
                {" "}
                Signed in as <span className="text-mist">{user.phone}</span>.
              </>
            ) : null}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSend} className="space-y-4">
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
              {loading ? "Getting OTP…" : "Get OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
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
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${fieldClass} tracking-[0.35em]`}
              placeholder="6-digit OTP"
              autoComplete="one-time-code"
            />
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Linking…" : "Verify & continue"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-bronze underline"
              onClick={() => setStep("phone")}
            >
              Change number
            </button>
          </form>
        )}

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
