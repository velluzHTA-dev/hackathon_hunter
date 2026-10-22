import type { RawHackathon } from "../types";

// Cerebral Valley runs AI hackathons for Google DeepMind, Meta, OpenAI, Anthropic and others,
// and lists community ones too. Its events page only renders the first 20 events, so read the
// public API it loads the rest from instead.
const API = "https://api.cerebralvalley.ai/v1/public/event/pull";
const HOST = "Cerebral Valley";
const PAGE_SIZE = 100; // the API's maximum
const MAX_PAGES = 30;

// Some talks and conferences are typed as hackathons; skip those unless the name says otherwise.
const NOT_A_HACKATHON = /\b(conference|summit|expo|seminar|speaker series|laureate|unconference|devcon|meetup|panel)\b/i;
const HACKATHON_NAME = /hack|build|sprint|jam|challenge/i;

interface CvEvent {
  id: string;
  name: string;
  descriptionSummary: string | null;
  startDateTime: string; // "2026-10-26 17:00:00", UTC
  endDateTime: string | null;
  url: string;
  location: string | null; // a city, "Remote" or "Other"
  venue: string | null;
  type: string | null; // "HACKATHON", ...
  imageUrl: string | null;
  platformEventData: {
    startDateTime?: string;
    endDateTime?: string;
    // Set on events hosted on Cerebral Valley itself; the sponsoring company is usually a co-host.
    hosts?: { hidden: boolean; userProfile?: { firstName?: string; lastName?: string } }[] | null;
  } | null;
}

interface CvPage {
  events: CvEvent[];
  totalCount: number;
}

const toIso = (s: string | null | undefined) => (s ? new Date(`${s.replace(" ", "T")}Z`).toISOString() : null);

const AMOUNT = /\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|thousand)?\b/gi;
const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6 };

/** The largest dollar amount mentioned as a prize, e.g. "$1 million in prizes" or "$65K Hackathon". */
function parsePrize(title: string, summary: string | null): number | null {
  const amounts: number[] = [];
  const collect = (text: string, nearPrize: boolean) => {
    for (const m of text.matchAll(AMOUNT)) {
      if (nearPrize && !/prize/i.test(text.slice(m.index, m.index + m[0].length + 40))) continue;
      amounts.push(Number(m[1].replace(/,/g, "")) * (SCALE[(m[2] ?? "").toLowerCase()] ?? 1));
    }
  };
  collect(title, false);
  collect(summary ?? "", true);
  const max = Math.max(0, ...amounts.filter(Number.isFinite));
  return max > 0 ? max : null;
}

function normalize(e: CvEvent): RawHackathon {
  const p = e.platformEventData;
  const hosts = (p?.hosts ?? [])
    .filter((h) => !h.hidden)
    .map((h) => [h.userProfile?.firstName, h.userProfile?.lastName].filter(Boolean).join(" ").trim())
    .filter(Boolean);
  // Lead with the company; Cerebral Valley is the host on most of them.
  const named = [...hosts.filter((n) => n !== HOST), ...hosts.filter((n) => n === HOST)];
  const online = e.location === "Remote";
  const start = toIso(p?.startDateTime ?? e.startDateTime);
  return {
    id: `cerebralvalley:${e.id}`,
    source: "cerebralvalley",
    title: e.name.trim(),
    url: e.url,
    image: e.imageUrl || null,
    startDate: start,
    endDate: toIso(p?.endDateTime ?? e.endDateTime),
    deadline: start,
    deadlineLabel: "Starts",
    location: online ? "Online" : e.location && e.location !== "Other" ? e.location : (e.venue ?? "TBA"),
    mode: online ? "online" : "in-person",
    prizeUsd: parsePrize(e.name, e.descriptionSummary),
    themes: ["AI"],
    participants: null,
    organizer: [...new Set(named)].join(", ") || null,
  };
}

async function fetchPage(from: string, offset: number): Promise<CvPage> {
  const qs = new URLSearchParams({ approved: "true", startDateTime: from, limit: String(PAGE_SIZE), offset: String(offset) });
  const res = await fetch(`${API}?${qs}`, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Cerebral Valley responded ${res.status}`);
  const page = (await res.json()) as Partial<CvPage>;
  if (!Array.isArray(page.events)) throw new Error("Cerebral Valley response changed (no events)");
  return { events: page.events, totalCount: page.totalCount ?? 0 };
}

export async function fetchCerebralValley(): Promise<RawHackathon[]> {
  // Start of today (UTC), so the URL, and with it the fetch cache, stays the same all day.
  const from = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const first = await fetchPage(from, 0);
  const pages = Math.min(MAX_PAGES, Math.ceil(first.totalCount / PAGE_SIZE));
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(from, (i + 1) * PAGE_SIZE)));

  const seen = new Set<string>();
  return [first, ...rest]
    .flatMap((p) => p.events)
    .filter((e) => {
      if (e.type !== "HACKATHON" || seen.has(e.id)) return false;
      seen.add(e.id);
      return !NOT_A_HACKATHON.test(e.name) || HACKATHON_NAME.test(e.name);
    })
    .map(normalize);
}
