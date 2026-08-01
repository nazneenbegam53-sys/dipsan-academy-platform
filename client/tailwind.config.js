/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        coal: "#0E0E0E",
        charcoal: "#161616",
        gold: "#D4AF37",
        champagne: "#F0E0A2",
        bronze: "#8C7340",
        mist: "#F5F0E6",
        paper: "#0A0A0A",
        ember: "#C44B3C",
        // keep aliases used across older pages
        forest: "#F0E0A2",
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
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out both",
        "fade-in": "fade-in 0.9s ease-out both",
        shimmer: "shimmer 6s linear infinite",
        "pulse-soft": "pulse-soft 5s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(120deg, #8C7340 0%, #D4AF37 35%, #F0E0A2 50%, #D4AF37 65%, #8C7340 100%)",
      },
    },
  },
  plugins: [],
};
