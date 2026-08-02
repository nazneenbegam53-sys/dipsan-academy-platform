/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070707",
        coal: "#111111",
        charcoal: "#1A1A1A",
        gold: "#D4AF37",
        champagne: "#F3E5B5",
        bronze: "#A88B4A",
        mist: "#F7F2E8",
        paper: "#0A0A0A",
        ember: "#C44B3C",
        soft: "#141414",
        forest: "#A88B4A",
        teal: "#D4AF37",
        signal: "#D4AF37",
        marigold: "#D4AF37",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "logo-enter": {
          "0%": { opacity: "0", transform: "scale(0.7) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(1.06) rotate(0deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "title-rise": {
          "0%": { opacity: "0", transform: "translateY(36px)", filter: "blur(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0.35)" },
          "50%": { boxShadow: "0 0 0 14px rgba(212,175,55,0)" },
        },
        "ring-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out both",
        "fade-in": "fade-in 0.7s ease-out both",
        "logo-enter": "logo-enter 1.2s cubic-bezier(0.22,1,0.36,1) both",
        "title-rise": "title-rise 1s ease-out both",
        "gold-pulse": "gold-pulse 2.8s ease-out infinite",
        "ring-spin": "ring-spin 12s linear infinite",
        float: "float 6s ease-in-out infinite",
        "ken-burns": "ken-burns 22s ease-out forwards",
        shimmer: "shimmer 5s linear infinite",
        "logo-drift": "float 14s ease-in-out infinite",
        "logo-drift-delayed": "float 18s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};
