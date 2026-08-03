import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Capacitor WebViews need relative asset paths; Vercel/web needs absolute `/`.
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

export default defineConfig({
  plugins: [react()],
  base: isCapacitorBuild ? "./" : "/",
  server: { port: 5173 },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
