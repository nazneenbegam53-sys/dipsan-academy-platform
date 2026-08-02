import { ReactNode, CSSProperties } from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "accent" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
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
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/8 bg-white/80 shadow-sm shadow-ink/5 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "success" | "danger" | "marigold" | "signal";
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink/5 text-ink",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-ember/10 text-ember",
    marigold: "bg-champagne text-bronze",
    signal: "bg-gold/25 text-ink",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-ember/25 bg-ember/10 px-4 py-2.5 text-sm text-ember">
      {message}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-bronze">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
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
    <div className={`relative min-h-screen overflow-hidden soft-atmosphere text-ink ${className}`}>
      {/* Soft logo watermark — eye-catchy but not overpowering */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src="/dipsan-logo.png"
          alt=""
          className="logo-watermark absolute left-[-8%] top-[12%] h-[55vmin] w-[55vmin] rounded-full object-contain opacity-[0.07] animate-logo-drift"
        />
        <img
          src="/dipsan-logo.png"
          alt=""
          className="logo-watermark absolute bottom-[-10%] right-[-6%] h-[48vmin] w-[48vmin] rounded-full object-contain opacity-[0.05] animate-logo-drift-delayed"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mist/40 via-transparent to-mist/50" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
