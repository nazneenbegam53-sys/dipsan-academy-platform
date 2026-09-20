/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07121C",
        coal: "#0F1F2E",
        charcoal: "#1A3044",
        gold: "#D4B06A",
        champagne: "#F0E0B8",
        bronze: "#9DB0C0",
        mist: "#E8F0F5",
        paper: "#07121C",
        aurora: "#5EC8C0",
        ember: "#FF6B6B",
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
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "title-rise": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.75s ease-out both",
        "fade-in": "fade-in 0.8s ease-out both",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 5s linear infinite",
        "title-rise": "title-rise 0.9s ease-out both",
        "logo-drift": "float 16s ease-in-out infinite",
        "logo-drift-delayed": "float 20s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};
