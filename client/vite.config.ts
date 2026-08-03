import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so Capacitor can load assets from the native WebView.
  base: "./",
  server: { port: 5173 },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
