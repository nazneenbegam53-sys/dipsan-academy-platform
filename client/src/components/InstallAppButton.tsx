import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/**
 * Free install: Android Chrome shows a native install prompt;
 * iOS gets Add-to-Home-Screen instructions. Hidden inside Capacitor.
 */
export function InstallAppButton({
  className = "",
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "solid" | "text";
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const native = Capacitor.isNativePlatform();

  useEffect(() => {
    if (native || isStandalone()) {
      setInstalled(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [native]);

  if (native || installed) return null;

  const styles =
    variant === "solid"
      ? "bg-gold text-ink hover:bg-champagne"
      : variant === "text"
        ? "text-gold hover:text-champagne underline-offset-4 hover:underline"
        : "border border-white/25 bg-white/5 text-mist hover:border-gold hover:text-gold";

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (isIos()) {
      setShowIosHelp(true);
      return;
    }
    // Desktop / unsupported — open install guide
    window.location.assign("/install");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`inline-flex items-center rounded-full px-5 py-2.5 text-xs font-bold tracking-wide transition sm:px-8 sm:py-3.5 sm:text-sm ${styles} ${className}`}
      >
        Install free app
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-coal p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="ios-install-title" className="font-display text-2xl font-semibold text-mist">
              Install on iPhone — free
            </h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Tap the Share button in Safari (square with an arrow).</li>
              <li>Scroll and choose <span className="text-champagne">Add to Home Screen</span>.</li>
              <li>Tap <span className="text-champagne">Add</span> — Dipsan Academy appears like an app.</li>
            </ol>
            <p className="mt-4 text-xs text-bronze/80">
              No App Store fee. Opens full-screen from your home screen.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-bold text-ink"
              onClick={() => setShowIosHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Registers the free PWA service worker once on the web. */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (Capacitor.isNativePlatform()) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline / unsupported — ignore */
    });
  });
}
