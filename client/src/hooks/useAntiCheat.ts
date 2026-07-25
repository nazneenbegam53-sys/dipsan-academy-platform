import { useEffect, useRef } from "react";

type ViolationType = "tab-blur" | "visibility-hidden" | "fullscreen-exit";

// Wires up the standard-browser anti-cheat signals from spec #13.
// Honest limitation: no website can fully stop someone switching apps/screens —
// this covers what's actually detectable (window blur, tab visibility, exiting
// fullscreen) and reports each event via onViolation.
export function useAntiCheat(active: boolean, onViolation: (type: ViolationType) => void) {
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  useEffect(() => {
    if (!active) return;

    function handleBlur() {
      onViolationRef.current("tab-blur");
    }
    function handleVisibility() {
      if (document.hidden) onViolationRef.current("visibility-hidden");
    }
    function handleFullscreenChange() {
      if (!document.fullscreenElement) onViolationRef.current("fullscreen-exit");
    }
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    function blockCopyPaste(e: ClipboardEvent) {
      e.preventDefault();
    }

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockCopyPaste);
    document.addEventListener("paste", blockCopyPaste);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockCopyPaste);
      document.removeEventListener("paste", blockCopyPaste);
    };
  }, [active]);
}

export async function requestFullscreen() {
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // Some browsers/devices don't support or allow this — fail silently,
    // the exam still works, just without the fullscreen deterrent.
  }
}
