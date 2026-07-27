"use client";

import { useEffect, useState } from "react";

/** Isolated clock — prevents parent dashboards from re-rendering every second. */
export function LiveClock({
  className,
  locale = "en-IN",
}: {
  className?: string;
  locale?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className}>
      {now.toLocaleTimeString(locale, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
    </span>
  );
}
