import { ReactNode } from "react";

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "accent" | "ghost" | "danger";
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-ink text-paper hover:opacity-90",
    accent: "bg-marigold text-ink hover:opacity-90",
    ghost: "bg-white text-ink border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:opacity-90",
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
  return <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "success" | "danger" | "marigold" }) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-paper",
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    marigold: "bg-orange-100 text-orange-700",
  };
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2.5 mb-4">{message}</div>;
}

export function Spinner() {
  return <div className="text-sm text-gray-400">Loading…</div>;
}
