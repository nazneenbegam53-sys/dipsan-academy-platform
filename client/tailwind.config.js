/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2F2C28",
        coal: "#EAE6DF",
        charcoal: "#FFFFFF",
        gold: "#C6A96A",
        champagne: "#EDE6D6",
        bronze: "#8A7B5F",
        mist: "#F7F5F1",
        paper: "#F7F5F1",
        ember: "#C96B5D",
        soft: "#F0EDE7",
        // aliases for older pages
        forest: "#8A7B5F",
        teal: "#C6A96A",
        signal: "#C6A96A",
        marigold: "#C6A96A",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "logo-enter": {
          "0%": { opacity: "0", transform: "scale(0.82)" },
          "55%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.6s ease-out both",
        "logo-enter": "logo-enter 1.1s ease-out both",
      },
    },
  },
  plugins: [],
};
