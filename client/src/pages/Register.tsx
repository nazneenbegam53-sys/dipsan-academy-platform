import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { Role } from "../types";

type Step = "details" | "otp";

export default function Register() {
  const { sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [role, setRole] = useState<Role>("student");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    className: "",
    rollNumber: "",
  });
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await sendRegisterOtp({ ...form, role });
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
      await verifyRegisterOtp(challengeId, otp.trim());
      try {
        sessionStorage.setItem("dipsan_intro_done", "1");
      } catch {
        /* ignore */
      }
      navigate(role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <PageShell quiet className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="sm" />
      </div>

      <div className="w-full max-w-md animate-fade-up luxury-panel rounded-3xl p-8 md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <p className="mt-4 font-display text-sm font-semibold tracking-[0.22em] gold-text">
            DIPSAN ACADEMY
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mist">
            Sign up
          </h1>
          <p className="mt-2 text-sm text-bronze">
            {step === "otp"
              ? "Enter the 6-digit code shown below"
              : "Sign up with your mobile number"}
          </p>
        </div>

        {step === "details" && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-gold/20 bg-ink/60 p-1">
              {(["student", "teacher"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  type="button"
                  className={`rounded-full py-2 text-sm font-semibold transition ${
                    role === r ? "bg-gold text-ink" : "text-bronze hover:text-champagne"
                  }`}
                >
                  {r === "student" ? "Student" : "Teacher"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <ErrorBanner message={error} />
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={fieldClass}
              />
              <input
                required
                placeholder="Mobile number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={fieldClass}
                inputMode="tel"
                autoComplete="tel"
              />

              {role === "student" && (
                <>
                  <input
                    placeholder="Class (e.g. 12th, Dropper)"
                    value={form.className}
                    onChange={(e) => update("className", e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    placeholder="Roll number (optional)"
                    value={form.rollNumber}
                    onChange={(e) => update("rollNumber", e.target.value)}
                    className={fieldClass}
                  />
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Getting OTP…" : "Get OTP"}
              </Button>
            </form>
          </>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <ErrorBanner message={error} />
            {info && <p className="text-xs text-aurora">{info}</p>}
            {devOtp && (
              <p className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-2 text-xs text-champagne">
                Your OTP: <strong className="tracking-widest text-gold">{devOtp}</strong>
              </p>
            )}
            <p className="text-xs text-bronze">
              Code for <span className="text-mist">{form.phone}</span>
            </p>
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
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Creating account…" : "Verify & create account"}
            </Button>
            <div className="flex justify-between text-xs text-bronze">
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => {
                  setStep("details");
                  setError("");
                }}
              >
                Edit details
              </button>
              <button
                type="button"
                className="underline underline-offset-2"
                disabled={loading}
                onClick={() => handleSendOtp({ preventDefault() {} } as React.FormEvent)}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-bronze">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold underline underline-offset-4">
            Log in with OTP
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
