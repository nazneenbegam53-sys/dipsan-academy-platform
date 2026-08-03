import { Capacitor } from "@capacitor/core";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function getPlatform() {
  return Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
}

/** True when running as installed PWA or Capacitor — no browser chrome. */
export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const twa = document.referrer.startsWith("android-app://");
  return mq || ios || twa;
}

/** Soft haptic tap — no-ops on web browser; works in Capacitor. */
export async function tapHaptic() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* plugin unavailable */
  }
}
