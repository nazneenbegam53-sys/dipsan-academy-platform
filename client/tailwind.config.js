/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Apple-like elegant dark — never pure black body text on dark surfaces
        ink: "#1C1C1E", // dark for text ON gold/light chips only
        coal: "#2C2C2E",
        charcoal: "#3A3A3C",
        gold: "#C9A227",
        champagne: "#F5E6B8",
        bronze: "#D1D1D6", // secondary text — light enough to read
        mist: "#F5F5F7", // primary readable text
        paper: "#1C1C1E", // page background
        ember: "#FF6B6B",
        soft: "#2C2C2E",
        forest: "#D1D1D6",
        teal: "#C9A227",
        signal: "#C9A227",
        marigold: "#C9A227",
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
          "0%": { opacity: "0", transform: "scale(0.78)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "title-rise": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,162,39,0.28)" },
          "50%": { boxShadow: "0 0 0 12px rgba(201,162,39,0)" },
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
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.75s ease-out both",
        "fade-in": "fade-in 0.65s ease-out both",
        "logo-enter": "logo-enter 1s ease-out both",
        "title-rise": "title-rise 0.9s ease-out both",
        "gold-pulse": "gold-pulse 2.8s ease-out infinite",
        "ring-spin": "ring-spin 14s linear infinite",
        float: "float 7s ease-in-out infinite",
        "ken-burns": "ken-burns 24s ease-out forwards",
        shimmer: "shimmer 5s linear infinite",
        "logo-drift": "float 16s ease-in-out infinite",
        "logo-drift-delayed": "float 20s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};
