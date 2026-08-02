import { ReactNode, CSSProperties } from "react";
import { BrandLogo } from "./BrandLogo";

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
    primary: "bg-gold text-ink hover:bg-champagne",
    accent: "bg-gold text-ink hover:bg-champagne",
    ghost:
      "bg-transparent text-champagne border border-gold/35 hover:border-gold hover:bg-gold/10 hover:text-gold",
    danger: "bg-ember text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
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
    <div className={`luxury-panel rounded-2xl ${className}`} style={style}>
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
    ink: "bg-gold/15 text-gold border border-gold/25",
    success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
    danger: "bg-ember/15 text-ember border border-ember/30",
    marigold: "bg-gold/15 text-champagne border border-gold/25",
    signal: "bg-gold text-ink",
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
    <div className="mb-4 rounded-xl border border-ember/40 bg-ember/15 px-4 py-2.5 text-sm text-ember">
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
    <div className={`relative min-h-screen overflow-hidden luxury-atmosphere text-mist ${className}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src="/dipsan-logo.png"
          alt=""
          className="absolute left-[-12%] top-[8%] h-[62vmin] w-[62vmin] rounded-full object-contain opacity-[0.12] animate-logo-drift"
        />
        <img
          src="/dipsan-logo.png"
          alt=""
          className="absolute bottom-[-14%] right-[-10%] h-[55vmin] w-[55vmin] rounded-full object-contain opacity-[0.09] animate-logo-drift-delayed"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink/70" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function AppHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-gold/20 pb-8">
      <div className="flex items-center gap-4">
        <BrandLogo size="md" glow spinRing showWordmark={false} />
        <div>
          <p className="font-display text-sm font-semibold tracking-[0.18em] gold-text">
            DIPSAN ACADEMY
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-mist md:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-bronze">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
