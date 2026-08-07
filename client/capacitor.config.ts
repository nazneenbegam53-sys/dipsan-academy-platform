import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Live web origin — Capacitor loads this URL so the native shell always mirrors
 * https://dipsan-academy-platform.vercel.app (same product as the free PWA install).
 */
const LIVE_WEB_URL = "https://dipsan-academy-platform.vercel.app";

const config: CapacitorConfig = {
  appId: "com.dipsanacademy.app",
  appName: "Dipsan Academy",
  webDir: "dist",
  server: {
    // Always load the deployed website so every Vercel deploy syncs into the app.
    url: LIVE_WEB_URL,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: [
      "dipsan-academy-platform.vercel.app",
      "*.vercel.app",
      "dipsan-academy-platform.onrender.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#07121C",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07121C",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#07121C",
  },
  ios: {
    backgroundColor: "#07121C",
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
