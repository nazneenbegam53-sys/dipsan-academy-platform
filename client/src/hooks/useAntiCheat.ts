import { useEffect, useRef } from "react";

export type ViolationType = "tab-blur" | "visibility-hidden" | "fullscreen-exit";

const TAB_TYPES = new Set<ViolationType>(["tab-blur", "visibility-hidden"]);

/**
 * Detects tab/window leave, visibility hide, and fullscreen exit.
 * Tab-blur + visibility-hidden are coalesced (one report per leave) so students
 * get a single popup and teachers see one clean log entry per switch.
 */
export function useAntiCheat(active: boolean, onViolation: (type: ViolationType) => void) {
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;
  const lastTabAtRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const armedAt = Date.now() + 2500; // ignore startup fullscreen/focus churn

    function report(type: ViolationType) {
      if (Date.now() < armedAt) return;

      if (TAB_TYPES.has(type)) {
        const now = Date.now();
        if (now - lastTabAtRef.current < 1200) return;
        lastTabAtRef.current = now;
        // Prefer a single canonical type for tab leaves
        onViolationRef.current("visibility-hidden");
        return;
      }
      onViolationRef.current(type);
    }

    function handleBlur() {
      report("tab-blur");
    }
    function handleVisibility() {
      if (document.hidden) report("visibility-hidden");
    }
    function handleFullscreenChange() {
      if (!document.fullscreenElement) report("fullscreen-exit");
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
    // Some browsers/devices don't support or allow this — fail silently.
  }
}

export function violationLabel(type: string): string {
  if (type === "visibility-hidden" || type === "tab-blur") return "Switched tab / left exam window";
  if (type === "fullscreen-exit") return "Exited fullscreen";
  return type;
}
