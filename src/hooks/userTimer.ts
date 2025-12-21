import { useEffect, useRef, useState } from "react";

type UseTimerOpts = {
  initialSeconds?: number;
  autoPauseOnBlur?: boolean;
  onTickSeconds?: ((s: number) => void) | undefined;
  onStart?: (() => void) | undefined;
};

export function useTimer(opts: UseTimerOpts = {}) {
  const { initialSeconds = 0, autoPauseOnBlur = true, onTickSeconds, onStart } = opts;
  const [elapsed, setElapsed] = useState<number>(initialSeconds);
  const [running, setRunning] = useState(false);
  const lastStartRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    lastStartRef.current = Date.now();
    if (onStart) onStart();

    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const newVal = prev + 1;
        if (onTickSeconds) onTickSeconds(newVal);
        return newVal;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!autoPauseOnBlur) return;
    function handleVisibility() {
      if (document.hidden && running) {
        pause();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [autoPauseOnBlur, running]);

  function start() {
    if (running) return;
    setRunning(true);
  }
  function pause() {
    if (!running) return;
    setRunning(false);
    lastStartRef.current = null;
  }
  function reset() {
    setRunning(false);
    setElapsed(0);
    lastStartRef.current = null;
  }
  // for manual server sync
  function sync(setSeconds: number) {
    setElapsed(setSeconds);
  }

  return { elapsed, running, start, pause, reset, sync };
}
