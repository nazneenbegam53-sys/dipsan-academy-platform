import { Link } from "react-router-dom";

export function BrandLogo({
  size = "md",
  to = "/",
  showWordmark = false,
  className = "",
  rounded = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "hero";
  to?: string | null;
  showWordmark?: boolean;
  className?: string;
  rounded?: boolean;
}) {
  const sizes = {
    xs: "h-9 w-9",
    sm: "h-11 w-11",
    md: "h-14 w-14",
    lg: "h-20 w-20",
    hero: "h-36 w-36 md:h-44 md:w-44",
  };

  const img = (
    <img
      src="/dipsan-logo.png"
      alt="Dipsan Academy"
      className={`${sizes[size]} object-contain ${rounded ? "rounded-full" : ""} ${className}`}
    />
  );

  if (to === null) {
    return showWordmark ? (
      <div className="flex items-center gap-3">
        {img}
        <span className="font-display text-lg font-semibold tracking-wide text-ink">Dipsan Academy</span>
      </div>
    ) : (
      img
    );
  }

  return (
    <Link to={to} className="inline-flex items-center gap-3 transition hover:opacity-80">
      {img}
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-wide text-ink">Dipsan Academy</span>
      )}
    </Link>
  );
}
