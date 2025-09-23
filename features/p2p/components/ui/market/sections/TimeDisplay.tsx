"use client";

import { useEffect, useState } from "react";

interface TimeDisplayProps {
  seconds?: number;
}

export const TimeDisplay = ({ seconds }: TimeDisplayProps) => {
  const [time, setTime] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof seconds === "number") {
      setCount(seconds);
      setTime(formatTime(seconds));
      const interval = setInterval(() => {
        setCount((prev) => {
          if (prev !== null && prev > 0) {
            setTime(formatTime(prev - 1));
            return prev - 1;
          }
          return 0;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // fallback: show current time
      const updateTime = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString("en-US", {
          timeZone: "UTC"
        }));
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [seconds]);

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return <span className="font-bold" suppressHydrationWarning>{time}</span>;
};
