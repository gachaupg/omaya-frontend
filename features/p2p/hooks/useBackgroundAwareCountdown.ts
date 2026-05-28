import { useCallback, useEffect, useRef, useState } from "react";

export type UseBackgroundAwareCountdownOptions = {
  /** Duration in seconds when the timer arms. */
  durationSeconds: number;
  /** Master switch — when false, timer stops and shows durationSeconds. */
  active: boolean;
  /**
   * Additional gate (e.g. trade status === "matched").
   * When false, timer is paused and remaining resets to durationSeconds.
   */
  armed?: boolean;
  /** Changing this re-arms the deadline from durationSeconds. */
  resetKey?: string | number | null;
  /** Fires once when the deadline is reached (including after a background tab). */
  onExpire?: () => void;
};

/**
 * Countdown that keeps correct time when the browser tab is inactive
 * by storing a wall-clock deadline instead of relying on setInterval alone.
 */
export function useBackgroundAwareCountdown({
  durationSeconds,
  active,
  armed = true,
  resetKey,
  onExpire,
}: UseBackgroundAwareCountdownOptions): number {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const deadlineRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const computeRemaining = useCallback(() => {
    const deadline = deadlineRef.current;
    if (deadline == null) {
      return Math.max(0, durationSeconds);
    }
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }, [durationSeconds]);

  const tick = useCallback(() => {
    if (!active || !armed || durationSeconds <= 0) {
      setRemainingSeconds(Math.max(0, durationSeconds));
      return;
    }

    const next = computeRemaining();
    setRemainingSeconds(next);

    if (next <= 0 && deadlineRef.current != null && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [active, armed, computeRemaining, durationSeconds]);

  useEffect(() => {
    if (!active || !armed || durationSeconds <= 0) {
      deadlineRef.current = null;
      expiredRef.current = false;
      setRemainingSeconds(Math.max(0, durationSeconds));
      return;
    }

    deadlineRef.current = Date.now() + durationSeconds * 1000;
    expiredRef.current = false;
    setRemainingSeconds(durationSeconds);
    tick();
  }, [active, armed, durationSeconds, resetKey, tick]);

  useEffect(() => {
    if (!active || !armed || durationSeconds <= 0) return;

    const intervalId = window.setInterval(tick, 1000);

    const onVisibilityOrFocus = () => {
      tick();
    };

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [active, armed, durationSeconds, tick]);

  return remainingSeconds;
}
