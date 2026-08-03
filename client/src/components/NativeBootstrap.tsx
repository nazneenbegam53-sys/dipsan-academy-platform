import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Wires Capacitor plugins once the app mounts on iOS / Android.
 * Safe to render on web — all calls are gated.
 */
export function NativeBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let removeBack: (() => void) | undefined;

    async function setup() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#07121C" });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch {
        /* StatusBar optional on some platforms */
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (!cancelled) await SplashScreen.hide({ fadeOutDuration: 350 });
      } catch {
        /* ignore */
      }

      try {
        const { App } = await import("@capacitor/app");
        const sub = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else void App.exitApp();
        });
        removeBack = () => {
          void sub.remove();
        };
      } catch {
        /* ignore */
      }
    }

    void setup();
    document.documentElement.classList.add("native-app");
    document.body.classList.add("native-app");

    return () => {
      cancelled = true;
      removeBack?.();
      document.documentElement.classList.remove("native-app");
      document.body.classList.remove("native-app");
    };
  }, []);

  return null;
}
