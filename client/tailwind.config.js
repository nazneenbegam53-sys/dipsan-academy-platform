/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#182238",
        marigold: "#E2963A",
        paper: "#F6F3EA",
      },
    },
  },
  plugins: [],
};
