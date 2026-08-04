import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { User } from "../types";
import { Button, Card, ErrorBanner, PageShell, Spinner, Badge } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { loadRazorpayScript } from "../lib/razorpay";

type PlanResponse = {
  plan: {
    amountInr: number;
    amountPaise: number;
    currency: string;
    label: string;
    description: string;
    benefits: string[];
  };
  subscribed: boolean;
  subscription: {
    active: boolean;
    paidAt: string | null;
    amountInr: number | null;
  };
  razorpayConfigured: boolean;
  keyId: string | null;
};

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  label: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export default function Subscribe() {
  const { user, refreshUser, setUserFromServer } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role === "teacher") {
      navigate("/teacher", { replace: true });
      return;
    }
    api
      .get<PlanResponse>("/payments/plan")
      .then(setPlan)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function handlePay() {
    setError("");
    setPaying(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout. Check your network and try again.");
      }

      const order = await api.post<OrderResponse>("/payments/create-order");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Dipsan Academy",
          description: order.description,
          order_id: order.orderId,
          prefill: order.prefill,
          theme: { color: "#C9A227" },
          handler: async (response) => {
            try {
              const verified = await api.post<{ user: User; message: string }>("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setUserFromServer(verified.user);
              await refreshUser();
              resolve();
              navigate("/student", { replace: true });
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });
        rzp.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  if (!user) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-mist">Subscribe to unlock</h1>
          <p className="mt-2 text-sm text-bronze">
            Log in or create a student account to purchase full access for ₹2000.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login">
              <Button className="w-full">Log in</Button>
            </Link>
            <Link to="/register">
              <Button variant="ghost" className="w-full">
                Create account
              </Button>
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center">
        <Spinner />
      </PageShell>
    );
  }

  const amount = plan?.plan.amountInr ?? 2000;
  const subscribed = plan?.subscribed || user.subscriptionActive;

  return (
    <PageShell>
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>

      <div className="mx-auto max-w-lg animate-fade-up px-6 py-12 pr-20">
        <Badge tone="marigold">FULL ACCESS</Badge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-mist">
          {subscribed ? "You're subscribed" : "Unlock every mock test"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bronze">
          {plan?.plan.description ||
            "One payment unlocks all published mock tests and detailed solutions."}
        </p>

        <Card className="mt-8 overflow-hidden">
          <div className="border-b border-gold/15 bg-charcoal/50 px-6 py-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {plan?.plan.label || "Dipsan Academy Full Access"}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold text-champagne">₹{amount}</span>
              <span className="text-sm text-bronze">INR · one-time</span>
            </div>
          </div>

          <ul className="space-y-3 px-6 py-5 text-sm text-mist">
            {(plan?.plan.benefits || [
              "Access to all published mock tests",
              "Detailed text, image, and video solutions",
              "Unlimited practice attempts on unlocked papers",
            ]).map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-0.5 text-gold" aria-hidden>
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gold/10 px-6 py-5">
            <ErrorBanner message={error} />

            {subscribed ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-200">
                  Full access is active
                  {plan?.subscription.paidAt
                    ? ` · since ${new Date(plan.subscription.paidAt).toLocaleDateString("en-IN")}`
                    : ""}
                  .
                </p>
                <Link to="/student">
                  <Button className="w-full">Go to mock tests</Button>
                </Link>
              </div>
            ) : (
              <>
                {!plan?.razorpayConfigured && (
                  <p className="mb-3 text-xs text-bronze">
                    Razorpay keys are not configured on the server yet. Add{" "}
                    <code className="text-champagne">RAZORPAY_KEY_ID</code> and{" "}
                    <code className="text-champagne">RAZORPAY_KEY_SECRET</code> to enable checkout.
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={paying || !plan?.razorpayConfigured}
                  onClick={handlePay}
                >
                  {paying ? "Opening checkout…" : `Pay ₹${amount} with Razorpay`}
                </Button>
                <p className="mt-3 text-center text-[11px] text-bronze">
                  Secure payment powered by Razorpay · UPI, cards, netbanking
                </p>
              </>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/student" className="text-sm text-gold hover:text-champagne">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
