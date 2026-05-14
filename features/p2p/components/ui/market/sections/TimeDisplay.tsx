"use client";

import { useEffect, useState } from "react";

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface TimeDisplayProps {
  seconds?: number;
}

/**
 * When `seconds` is a number, shows mm:ss for that value only — parents that need a live
 * countdown must update `seconds` each tick (no hidden interval here; avoids ticking
 * during "inactive" phases such as pending_acceptance while still passing limit_duration).
 */
export const TimeDisplay = ({ seconds }: TimeDisplayProps) => {
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    if (typeof seconds === "number") {
      return;
    }
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", {
          timeZone: "UTC",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  if (typeof seconds === "number") {
    return (
      <span className="font-bold" suppressHydrationWarning>
        {formatTime(seconds)}
      </span>
    );
  }

  return (
    <span className="font-bold" suppressHydrationWarning>
      {clock}
    </span>
  );
};
