"use client";

import { useEffect, useState } from "react";

export const HOUR = 3600_000;
export const DAY = 24 * HOUR;

/** Current time, re-rendering every `intervalMs`. Null until mounted so server and client markup match. */
export function useNow(intervalMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "passed";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Dates TBA";
  const fmt = (iso: string, withYear: boolean) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  if (!start) return `Until ${fmt(end!, true)}`;
  if (!end) return `From ${fmt(start, true)}`;
  if (fmt(start, true) === fmt(end, true)) return fmt(start, true);
  return `${fmt(start, false)} – ${fmt(end, true)}`;
}
