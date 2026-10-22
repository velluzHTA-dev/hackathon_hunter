import type { RawHackathon } from "../types";

const BASE = "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&per_page=40";
const MAX_PAGES = 8;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

interface DevpostHackathon {
  id: number;
  title: string;
  url: string;
  thumbnail_url: string | null;
  displayed_location?: { icon: string; location: string };
  submission_period_dates: string;
  themes: { id: number; name: string }[];
  prize_amount: string;
  registrations_count: number;
  organization_name: string | null;
  invite_only: boolean;
}

interface DevpostPage {
  hackathons: DevpostHackathon[];
  meta: { total_count: number; per_page: number };
}

/**
 * Parses Devpost's date ranges, which come in four shapes:
 *   "Aug 31 - Oct 23, 2026", "Oct 05 - 27, 2026", "Dec 15, 2026 - Jan 10, 2027", "Nov 14, 2026".
 * Times aren't given, so the end date is treated as end of day UTC.
 */
export function parseDevpostDates(text: string): { start: Date | null; end: Date | null } {
  const single = text.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (single) {
    const mon = MONTHS.indexOf(single[1].toLowerCase());
    if (mon < 0) return { start: null, end: null };
    const [y, d] = [Number(single[3]), Number(single[2])];
    return { start: new Date(Date.UTC(y, mon, d)), end: new Date(Date.UTC(y, mon, d, 23, 59, 59)) };
  }
  const m = text
    .trim()
    .match(/^([A-Za-z]{3})\s+(\d{1,2})(?:,\s*(\d{4}))?\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})$/);
  if (!m) return { start: null, end: null };
  const [, sMon, sDay, sYearRaw, eMonRaw, eDay, eYearRaw] = m;
  const sm = MONTHS.indexOf(sMon.toLowerCase());
  const em = MONTHS.indexOf((eMonRaw ?? sMon).toLowerCase());
  if (sm < 0 || em < 0) return { start: null, end: null };
  const eYear = Number(eYearRaw);
  // When the start year is omitted, a later start month means the range wraps the new year.
  const sYear = sYearRaw ? Number(sYearRaw) : sm > em ? eYear - 1 : eYear;
  return {
    start: new Date(Date.UTC(sYear, sm, Number(sDay))),
    end: new Date(Date.UTC(eYear, em, Number(eDay), 23, 59, 59)),
  };
}

function parsePrize(html: string): number | null {
  const text = html.replace(/<[^>]*>/g, "");
  if (!text.trim().startsWith("$")) return null; // non-USD currencies aren't comparable
  const n = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalize(h: DevpostHackathon): RawHackathon {
  const { start, end } = parseDevpostDates(h.submission_period_dates);
  const location = h.displayed_location?.location ?? "Online";
  const online = h.displayed_location?.icon === "globe" || /^online$/i.test(location);
  return {
    id: `devpost:${h.id}`,
    source: "devpost",
    title: h.title.trim(),
    url: h.url,
    image: h.thumbnail_url ? (h.thumbnail_url.startsWith("//") ? `https:${h.thumbnail_url}` : h.thumbnail_url) : null,
    startDate: start?.toISOString() ?? null,
    endDate: end?.toISOString() ?? null,
    deadline: end?.toISOString() ?? null,
    deadlineLabel: "Submissions close",
    location,
    mode: online ? "online" : "in-person",
    prizeUsd: parsePrize(h.prize_amount),
    themes: h.themes.map((t) => t.name),
    participants: h.registrations_count ?? null,
    organizer: h.organization_name,
  };
}

async function fetchPage(page: number): Promise<DevpostPage> {
  const res = await fetch(`${BASE}&page=${page}`, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Devpost responded ${res.status}`);
  return res.json();
}

export async function fetchDevpost(): Promise<RawHackathon[]> {
  const first = await fetchPage(1);
  const pages = Math.min(MAX_PAGES, Math.ceil(first.meta.total_count / first.meta.per_page));
  const rest = await Promise.allSettled(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => fetchPage(i + 2)),
  );
  const all = [
    ...first.hackathons,
    ...rest.flatMap((r) => (r.status === "fulfilled" ? r.value.hackathons : [])),
  ];
  return all.filter((h) => !h.invite_only).map(normalize);
}
