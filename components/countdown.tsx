"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  airingAt: number;
  episode: number;
}

export function Countdown({ airingAt, episode }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = airingAt * 1000 - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ya disponible");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d > 0 ? `${d}d ` : ""}${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [airingAt]);

  return (
    <span className="text-xs text-primary font-medium">
      Ep. {episode} en {timeLeft}
    </span>
  );
}
