import { useEffect, useRef, useState } from "react";

export function useTimer(
  initialSeconds: number | undefined,
  onExpire: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expiredRef = useRef(false);

  // Wait until initialSeconds is actually available
  useEffect(() => {
    if (initialSeconds == null) return;

    setSecondsLeft(initialSeconds);
    expiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    // Don't start timer until initialized
    if (secondsLeft == null) return;

    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }

    const id = setTimeout(() => {
      setSecondsLeft((s) => (s == null ? null : s - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [secondsLeft, onExpire]);

  return secondsLeft;
}

export function formatTime(totalSeconds: number | null) {
  if (totalSeconds == null) return "--:--";

  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(m)}:${pad(sec)}`;
}