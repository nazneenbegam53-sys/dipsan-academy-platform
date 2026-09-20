import { useEffect, useState } from "react";

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
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    try {
      if (sessionStorage.getItem("dipsan_class_install_dismiss") === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
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
  }, []);

  if (installed || dismissed) return null;

  async function handleInstall() {
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
    setShowIosHelp(true);
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("dipsan_class_install_dismiss", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-coal/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-mist">Install Classroom app</p>
            <p className="text-xs text-bronze">
              Add DIPSAN ACADEMY CLASSROOM to your home screen for full-screen class sessions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-bronze hover:text-mist"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink transition hover:bg-champagne"
            >
              {deferred ? "Install" : isIos() ? "How to install" : "Install app"}
            </button>
          </div>
        </div>
      </div>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-coal p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-semibold text-mist">
              {isIos() ? "Install on iPhone" : "Install this app"}
            </h3>
            {isIos() ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-bronze">
                <li>Open this site in Safari.</li>
                <li>
                  Tap Share → <span className="text-champagne">Add to Home Screen</span>.
                </li>
                <li>Tap Add — Dipsan Class appears like an app.</li>
              </ol>
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-bronze">
                <li>Open this site in Chrome (or Edge).</li>
                <li>
                  Use the browser menu → <span className="text-champagne">Install app</span>, or
                  the install banner when it appears.
                </li>
                <li>Confirm — the Classroom icon lands on your home screen.</li>
              </ol>
            )}
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

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline / unsupported */
    });
  });
}
