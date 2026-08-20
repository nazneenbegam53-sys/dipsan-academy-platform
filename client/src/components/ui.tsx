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
    primary: "bg-gold text-ink hover:bg-champagne",
    accent: "bg-gold text-ink hover:bg-champagne",
    ghost:
      "bg-white/5 text-mist border border-white/15 hover:border-aurora/50 hover:bg-aurora/10 hover:text-champagne",
    danger: "bg-ember text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 ${variants[variant]} ${className}`}
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
    <div className={`luxury-panel rounded-2xl text-mist ${className}`} style={style}>
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
    ink: "bg-white/10 text-mist border border-white/15",
    success: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30",
    danger: "bg-ember/20 text-ember border border-ember/30",
    marigold: "bg-gold/20 text-champagne border border-gold/30",
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
  quiet = false,
}: {
  children: ReactNode;
  className?: string;
  /** Skip drifting logo animations (use on login/register for snappy typing). */
  quiet?: boolean;
}) {
  return (
    <div
      className={`relative min-h-screen min-h-[100dvh] overflow-x-hidden text-mist ${quiet ? "bg-paper" : "luxury-atmosphere"} ${className}`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 hidden h-72 w-72 rounded-full bg-aurora/10 blur-3xl md:block" />
        <div className="absolute -right-16 bottom-10 hidden h-80 w-80 rounded-full bg-gold/10 blur-3xl md:block" />
        {!quiet && (
          <>
            <img
              src="/dipsan-logo.png"
              alt=""
              className="deco-logo absolute left-[-10%] top-[10%] hidden h-[50vmin] w-[50vmin] rounded-full object-contain opacity-[0.05] animate-logo-drift md:block"
            />
            <img
              src="/dipsan-logo.png"
              alt=""
              className="deco-logo absolute bottom-[-12%] right-[-8%] hidden h-[44vmin] w-[44vmin] rounded-full object-contain opacity-[0.04] animate-logo-drift-delayed md:block"
            />
          </>
        )}
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
    <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:pb-8">
      <div className="min-w-0">
        <h1 className="break-anywhere font-display text-2xl font-semibold tracking-tight text-mist sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-bronze">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </header>
  );
}
