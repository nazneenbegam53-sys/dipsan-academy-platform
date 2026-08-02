/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Night-lab science palette — deep teal-ink + aurora + warm gold crest
        ink: "#07121C", // dark text ON gold/light chips only
        coal: "#0F1F2E",
        charcoal: "#1A3044",
        gold: "#D4B06A",
        champagne: "#F0E0B8",
        bronze: "#9DB0C0", // secondary text
        mist: "#E8F0F5", // primary readable text
        paper: "#07121C", // page background
        aurora: "#5EC8C0",
        ember: "#FF6B6B",
        soft: "#0F1F2E",
        forest: "#9DB0C0",
        teal: "#5EC8C0",
        signal: "#5EC8C0",
        marigold: "#D4B06A",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "logo-enter": {
          "0%": { opacity: "0", transform: "scale(0.55)", filter: "blur(12px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
        },
        "title-rise": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "intro-title": {
          "0%": { opacity: "0", transform: "translateY(20px)", letterSpacing: "0.42em" },
          "100%": { opacity: "1", transform: "translateY(0)", letterSpacing: "0.18em" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,176,106,0.35)" },
          "50%": { boxShadow: "0 0 0 14px rgba(94,200,192,0)" },
        },
        "ring-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.06)" },
        },
        "orbit-slow": {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.72)", opacity: "0.55" },
          "100%": { transform: "scale(1.55)", opacity: "0" },
        },
        "orbit-tilt": {
          "0%": { transform: "rotateX(68deg) rotateZ(0deg)" },
          "100%": { transform: "rotateX(68deg) rotateZ(360deg)" },
        },
        "star-twinkle": {
          "0%, 100%": { opacity: "0.25", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
        "letter-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(32px) scale(0.85)",
            filter: "blur(8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
            filter: "blur(0)",
          },
        },
        "letter-glow": {
          "0%, 100%": { textShadow: "0 0 0 transparent" },
          "50%": { textShadow: "0 0 18px rgba(94,200,192,0.45), 0 0 8px rgba(212,176,106,0.35)" },
        },
        "crest-orbit": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "crest-face": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.75s ease-out both",
        "fade-in": "fade-in 0.65s ease-out both",
        "logo-enter": "logo-enter 1.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "title-rise": "title-rise 0.9s ease-out both",
        "intro-title": "intro-title 1.15s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gold-pulse": "gold-pulse 2.8s ease-out infinite",
        "ring-spin": "ring-spin 10s linear infinite",
        float: "float 7s ease-in-out infinite",
        "ken-burns": "ken-burns 24s ease-out forwards",
        "orbit-slow": "orbit-slow 36s linear infinite",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        "orbit-tilt": "orbit-tilt 14s linear infinite",
        "star-twinkle": "star-twinkle 2.8s ease-in-out infinite",
        "letter-in": "letter-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "letter-glow": "letter-glow 3.5s ease-in-out infinite",
        "crest-orbit": "crest-orbit 2.75s cubic-bezier(0.4, 0.05, 0.2, 1) both",
        "crest-face": "crest-face 2.75s cubic-bezier(0.4, 0.05, 0.2, 1) both",
        shimmer: "shimmer 5s linear infinite",
        "logo-drift": "float 16s ease-in-out infinite",
        "logo-drift-delayed": "float 20s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};
