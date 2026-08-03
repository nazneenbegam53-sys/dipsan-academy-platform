import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { isStandaloneApp } from "../lib/native";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * When the user is still inside Chrome/Safari (not the installed app),
 * show a persistent app-install gate so they know this is not the real app yet.
 */
export function BrowserInstallGate() {
  const [inBrowser, setInBrowser] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosOpen, setIosOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() || isStandaloneApp()) {
      setInBrowser(false);
      document.documentElement.classList.add("app-shell");
      document.body.classList.add("app-shell");
      return;
    }
    setInBrowser(true);
    document.documentElement.classList.add("in-browser");
    document.body.classList.add("in-browser");

    try {
      if (sessionStorage.getItem("dipsan_hide_install_gate") === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => {
      setInBrowser(false);
      window.location.reload();
    });
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!inBrowser || dismissed) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") window.location.reload();
      return;
    }
    if (isIos()) {
      setIosOpen(true);
      return;
    }
    window.location.assign("/install/");
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("dipsan_hide_install_gate", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="browser-install-gate fixed inset-x-0 bottom-0 z-[120] border-t border-gold/30 bg-[#07121C]/97 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:bottom-4 md:left-1/2 md:max-w-lg md:-translate-x-1/2 md:rounded-2xl md:border">
        <div className="flex items-start gap-3">
          <img src="/dipsan-logo.png" alt="" className="mt-0.5 h-11 w-11 rounded-full object-contain" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-mist">
              You&apos;re still in the browser
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-bronze">
              Install Dipsan Academy to open it full-screen like a real app — no address bar.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink"
              >
                Install real app
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-bronze"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>

      {iosOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setIosOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-coal p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-semibold text-mist">Make it a real iPhone app</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-bronze">
              <li>Tap the <span className="text-champagne">Share</span> button in Safari.</li>
              <li>Choose <span className="text-champagne">Add to Home Screen</span>.</li>
              <li>Tap <span className="text-champagne">Add</span>.</li>
              <li>Open the new <span className="text-champagne">Dipsan Academy</span> icon — not Safari.</li>
            </ol>
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-bold text-ink"
              onClick={() => setIosOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
