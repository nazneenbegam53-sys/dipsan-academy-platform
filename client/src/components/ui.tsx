import { ReactNode } from "react";

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "accent" | "ghost" | "danger";
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-ink text-mist hover:bg-forest",
    accent: "bg-signal text-ink hover:brightness-110",
    ghost: "bg-white text-ink border border-ink/15 hover:border-ink/30 hover:bg-mist/60",
    danger: "bg-ember text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-ink/10 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "success" | "danger" | "marigold" | "signal" }) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-mist",
    success: "bg-teal/15 text-forest",
    danger: "bg-ember/15 text-ember",
    marigold: "bg-teal/15 text-teal",
    signal: "bg-signal text-ink",
  };
  return <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-md bg-ember/10 border border-ember/30 text-ember text-sm px-4 py-2.5 mb-4">{message}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-forest/50">
      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
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
    <div className={`min-h-screen bg-paper ${className}`}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.35]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 10% -10%, rgba(26,155,142,0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(200,245,66,0.08), transparent)",
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
