import { Link } from "react-router-dom";

export function BrandLogo({
  size = "md",
  to = "/",
  showWordmark = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "hero";
  to?: string | null;
  showWordmark?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-24 w-24",
    hero: "h-[min(52vw,280px)] w-[min(52vw,280px)] md:h-[320px] md:w-[320px]",
  };

  const img = (
    <img
      src="/dipsan-logo.png"
      alt="Dipsan Academy"
      className={`${sizes[size]} object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.25)] ${className}`}
    />
  );

  if (to === null) {
    return showWordmark ? (
      <div className="flex items-center gap-3">
        {img}
        <span className="font-display text-lg font-semibold tracking-wide gold-text">Dipsan Academy</span>
      </div>
    ) : (
      img
    );
  }

  return (
    <Link to={to} className="inline-flex items-center gap-3 transition hover:opacity-90">
      {img}
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-wide gold-text">Dipsan Academy</span>
      )}
    </Link>
  );
}
