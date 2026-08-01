import { ReactNode } from "react";

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "accent" | "ghost" | "danger";
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-gold text-ink hover:bg-champagne",
    accent: "bg-gold text-ink hover:bg-champagne",
    ghost: "bg-transparent text-champagne border border-gold/35 hover:border-gold hover:text-gold",
    danger: "bg-ember text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm px-5 py-2.5 text-sm font-semibold tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-charcoal rounded-md border border-gold/20 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "success" | "danger" | "marigold" | "signal" }) {
  const tones: Record<string, string> = {
    ink: "bg-gold/15 text-gold border border-gold/25",
    success: "bg-gold/20 text-champagne border border-gold/30",
    danger: "bg-ember/20 text-ember border border-ember/30",
    marigold: "bg-gold/15 text-gold border border-gold/25",
    signal: "bg-gold text-ink",
  };
  return <span className={`inline-block rounded-sm px-2.5 py-1 text-xs font-semibold tracking-wide ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-sm bg-ember/15 border border-ember/40 text-ember text-sm px-4 py-2.5 mb-4">{message}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-bronze">
      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
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
    <div className={`min-h-screen bg-ink text-mist ${className}`}>
      <div className="pointer-events-none fixed inset-0 opacity-80" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(212,175,55,0.12), transparent), radial-gradient(ellipse 40% 30% at 100% 20%, rgba(140,115,64,0.08), transparent)",
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
