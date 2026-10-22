import { safeUrl } from "./safeUrl";
import type { Hackathon } from "./types";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n|\r/g, "\\n");

/** Builds a one-event calendar file for a hackathon's deadline, with a reminder a day before. */
export function buildIcs(h: Hackathon): string | null {
  if (!h.deadline) return null;
  const at = new Date(h.deadline);
  const end = new Date(at.getTime() + 30 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hackathon Hunter//EN",
    "BEGIN:VEVENT",
    `UID:${h.id}@hackathon-hunter`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${h.deadlineLabel}: ${h.title}`)}`,
    `DESCRIPTION:${escape(h.url)}`,
    `URL:${(safeUrl(h.url) ?? "").replace(/[\r\n]/g, "")}`, // a raw newline could inject calendar fields
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(`${h.title} — ${h.deadlineLabel.toLowerCase()} tomorrow`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(h: Hackathon) {
  const ics = buildIcs(h);
  if (!ics) return;
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${h.title.replace(/[^\w-]+/g, "-").slice(0, 60)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
