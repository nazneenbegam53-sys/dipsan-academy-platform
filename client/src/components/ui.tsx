import { ReactNode } from "react";

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "accent" | "ghost" | "danger";
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-ink text-mist hover:bg-ink/90",
    accent: "bg-gold/90 text-ink hover:bg-gold",
    ghost: "bg-white/70 text-ink border border-ink/10 hover:border-ink/25 hover:bg-white",
    danger: "bg-ember text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white/80 rounded-2xl border border-ink/8 shadow-sm shadow-ink/5 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "success" | "danger" | "marigold" | "signal" }) {
  const tones: Record<string, string> = {
    ink: "bg-ink/5 text-ink",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-ember/10 text-ember",
    marigold: "bg-champagne text-bronze",
    signal: "bg-gold/25 text-ink",
  };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-xl bg-ember/10 border border-ember/25 text-ember text-sm px-4 py-2.5 mb-4">{message}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-bronze">
      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
      Loading…
    </div>
  );
}

export function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen soft-atmosphere text-ink ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
}
