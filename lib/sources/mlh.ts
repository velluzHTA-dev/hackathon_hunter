import * as cheerio from "cheerio";
import type { Mode, RawHackathon } from "../types";

interface MlhEvent {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  url: string;
  location: string;
  formatType: string;
  backgroundUrl: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  customFields?: { hackathon_focus?: string[] };
}

/** MLH seasons run roughly August to July and are named after the year they end in. */
export function currentSeason(now = new Date()): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

function toMode(formatType: string): Mode {
  if (formatType === "hybrid") return "hybrid";
  if (formatType === "physical") return "in-person";
  return "online"; // "digital"
}

function normalize(e: MlhEvent): RawHackathon {
  const mode = toMode(e.formatType);
  return {
    id: `mlh:${e.id}`,
    source: "mlh",
    title: e.name.trim(),
    url: e.websiteUrl || new URL(e.url, "https://www.mlh.com").toString(),
    image: e.logoUrl || e.backgroundUrl,
    startDate: e.startsAt,
    endDate: e.endsAt,
    deadline: e.startsAt,
    deadlineLabel: "Starts",
    location: mode === "online" ? "Online" : e.location,
    mode,
    prizeUsd: null,
    themes: e.customFields?.hackathon_focus ?? [],
    participants: null,
    organizer: "MLH",
  };
}

export async function fetchMlh(): Promise<RawHackathon[]> {
  const url = `https://www.mlh.com/seasons/${currentSeason()}/events`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`MLH responded ${res.status}`);
  const $ = cheerio.load(await res.text());
  // The page is an Inertia app; its props are embedded as JSON in this script tag.
  const raw = $("script[data-page]").first().text();
  if (!raw) throw new Error("MLH page layout changed (no embedded event data)");
  const page = JSON.parse(raw) as { props: { upcomingEvents?: MlhEvent[] } };
  const events = page.props.upcomingEvents;
  if (!Array.isArray(events)) throw new Error("MLH page layout changed (no upcomingEvents)");
  return events.map(normalize);
}
