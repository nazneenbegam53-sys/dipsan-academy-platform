import { Link } from "react-router-dom";

export function BrandLogo({
  size = "md",
  to = "/",
  showWordmark = false,
  className = "",
  rounded = true,
  glow = false,
  spinRing = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  to?: string | null;
  showWordmark?: boolean;
  className?: string;
  rounded?: boolean;
  glow?: boolean;
  spinRing?: boolean;
}) {
  const sizes = {
    xs: "h-10 w-10",
    sm: "h-10 w-10 md:h-12 md:w-12",
    md: "h-14 w-14 md:h-16 md:w-16",
    lg: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24",
    xl: "h-14 w-14 sm:h-20 sm:w-20 md:h-28 md:w-28",
    hero: "h-[min(42vw,220px)] w-[min(42vw,220px)] sm:h-[min(48vw,260px)] sm:w-[min(48vw,260px)] md:h-[340px] md:w-[340px]",
  };

  const wordSizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    hero: "text-3xl",
  };

  const img = (
    <span className={`relative inline-flex shrink-0 ${glow ? "animate-gold-pulse rounded-full" : ""}`}>
      {spinRing && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 rounded-full animate-ring-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #D4B06A 18%, transparent 38%, #5EC8C0 58%, transparent 78%, #F0E0B8 92%, transparent 100%)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))",
          }}
        />
      )}
      <img
        src="/dipsan-logo.png"
        alt="Dipsan Academy"
        className={`${sizes[size]} object-contain ${rounded ? "rounded-full" : ""} ${className}`}
      />
    </span>
  );

  const wordmark = showWordmark ? (
    <span className={`font-display font-semibold tracking-wide gold-text ${wordSizes[size]}`}>
      Dipsan Academy
    </span>
  ) : null;

  if (to === null) {
    return (
      <div className="inline-flex items-center gap-3">
        {img}
        {wordmark}
      </div>
    );
  }

  return (
    <Link to={to} className="inline-flex items-center gap-3 transition hover:opacity-90">
      {img}
      {wordmark}
    </Link>
  );
}
