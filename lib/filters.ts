import type { Hackathon, Mode, Source } from "./types";

export type SortKey = "deadline" | "prize" | "participants" | "newest";

export interface FilterState {
  q: string;
  mode: Mode | "all";
  loc: string;
  source: Source | "all";
  minPrize: number;
  themes: string[];
  bigTech: boolean; // run or sponsored by any big tech company
  companies: string[]; // run or sponsored by one of these
  closingSoon: boolean; // deadline within 7 days
  from: string; // yyyy-mm-dd, compared against start date
  to: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  mode: "all",
  loc: "",
  source: "all",
  minPrize: 0,
  themes: [],
  bigTech: false,
  companies: [],
  closingSoon: false,
  from: "",
  to: "",
  sort: "deadline",
};

const MODES = ["all", "online", "in-person", "hybrid"];
const SOURCES = ["all", "devpost", "mlh", "cerebralvalley", "lablab", "luma"];
const SORTS = ["deadline", "prize", "participants", "newest"];

export function filtersFromParams(p: URLSearchParams): FilterState {
  const pick = <T extends string>(key: string, allowed: string[], fallback: T) =>
    (allowed.includes(p.get(key) ?? "") ? p.get(key) : fallback) as T;
  return {
    q: p.get("q") ?? "",
    mode: pick("mode", MODES, "all"),
    loc: p.get("loc") ?? "",
    source: pick("source", SOURCES, "all"),
    minPrize: Math.max(0, Number(p.get("minPrize")) || 0),
    themes: p.get("themes")?.split(",").filter(Boolean) ?? [],
    bigTech: p.get("bigtech") === "1",
    companies: p.get("co")?.split(",").filter(Boolean) ?? [],
    closingSoon: p.get("closing") === "1",
    from: p.get("from") ?? "",
    to: p.get("to") ?? "",
    sort: pick("sort", SORTS, "deadline"),
  };
}

export function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.mode !== "all") p.set("mode", f.mode);
  if (f.loc) p.set("loc", f.loc);
  if (f.source !== "all") p.set("source", f.source);
  if (f.minPrize > 0) p.set("minPrize", String(f.minPrize));
  if (f.themes.length) p.set("themes", f.themes.join(","));
  if (f.bigTech) p.set("bigtech", "1");
  if (f.companies.length) p.set("co", f.companies.join(","));
  if (f.closingSoon) p.set("closing", "1");
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.sort !== "deadline") p.set("sort", f.sort);
  return p;
}

export function applyFilters(list: Hackathon[], f: FilterState, now: number): Hackathon[] {
  const q = f.q.trim().toLowerCase();
  const loc = f.loc.trim().toLowerCase();
  const from = f.from ? Date.parse(f.from) : null;
  const to = f.to ? Date.parse(f.to) + 86_399_999 : null;

  const out = list.filter((h) => {
    if (q && ![h.title, h.organizer ?? "", ...h.themes].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.mode !== "all" && h.mode !== f.mode) return false;
    if (loc && !h.location.toLowerCase().includes(loc)) return false;
    if (f.source !== "all" && h.source !== f.source) return false;
    if (f.minPrize > 0 && (h.prizeUsd ?? 0) < f.minPrize) return false;
    if (f.themes.length && !f.themes.some((t) => h.themes.includes(t))) return false;
    if (f.bigTech && h.companies.length === 0) return false;
    if (f.companies.length && !f.companies.some((c) => h.companies.includes(c))) return false;
    if (f.closingSoon) {
      const d = h.deadline ? Date.parse(h.deadline) : NaN;
      if (!(d > now && d - now <= 7 * 86_400_000)) return false;
    }
    const start = h.startDate ? Date.parse(h.startDate) : null;
    if (from !== null && (start === null || start < from)) return false;
    if (to !== null && (start === null || start > to)) return false;
    return true;
  });

  const by = {
    deadline: (a: Hackathon, b: Hackathon) => (a.deadline ?? "9").localeCompare(b.deadline ?? "9"),
    prize: (a: Hackathon, b: Hackathon) => (b.prizeUsd ?? -1) - (a.prizeUsd ?? -1),
    participants: (a: Hackathon, b: Hackathon) => (b.participants ?? -1) - (a.participants ?? -1),
    newest: (a: Hackathon, b: Hackathon) => (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  }[f.sort];
  return out.sort(by);
}

/** Companies present in the list with how many hackathons each has, most first. */
export function companyCounts(list: Hackathon[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const h of list) for (const c of h.companies) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Most common themes across the list, for the theme chips. */
export function topThemes(list: Hackathon[], limit = 14): string[] {
  const counts = new Map<string, number>();
  for (const h of list) for (const t of h.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}
