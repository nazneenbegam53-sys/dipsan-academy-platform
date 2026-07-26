import { useEffect, useRef, useState } from "react";

export function useTimer(
  initialSeconds: number | undefined,
  onExpire: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expired = useRef(false);

  // Initialise timer only when we have a value
  useEffect(() => {
    if (initialSeconds === undefined) return;

    setSecondsLeft(initialSeconds);
    expired.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    // Wait until timer has been initialised
    if (secondsLeft === null) return;

    if (secondsLeft <= 0) {
      if (!expired.current) {
        expired.current = true;
        onExpire();
      }
      return;
    }

    const id = window.setTimeout(() => {
      setSecondsLeft((prev) => (prev ?? 1) - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [secondsLeft, onExpire]);

  return secondsLeft ?? 0;
}

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(m)}:${pad(sec)}`;
}