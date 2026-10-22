import { extractJsonArray, readRscPayload } from "./nextPayload";
import type { Mode, RawHackathon } from "../types";

// lablab.ai runs AI hackathons sponsored by companies like AMD, IBM and Vultr.
const PAGE = "https://lablab.ai/ai-hackathons";

interface LablabEvent {
  id: string;
  name: string;
  slug: string;
  type: string; // "HACKATHON", ...
  eventType: "ONLINE" | "HYBRID" | "ONSITE" | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  thumbnailLink: string | null;
  imageLink: string | null;
  toBeAnnounced: boolean;
}

const MODES: Record<string, Mode> = { ONLINE: "online", HYBRID: "hybrid", ONSITE: "in-person" };

function normalize(e: LablabEvent): RawHackathon {
  const mode = MODES[e.eventType ?? "ONLINE"] ?? "online";
  return {
    id: `lablab:${e.id}`,
    source: "lablab",
    title: e.name.trim(),
    url: `https://lablab.ai/event/${e.slug}`,
    image: e.thumbnailLink || e.imageLink,
    startDate: e.startAt,
    endDate: e.endAt,
    deadline: e.startAt,
    deadlineLabel: "Starts",
    location: mode === "online" ? "Online" : mode === "hybrid" ? "Online + on-site" : "On-site",
    mode,
    prizeUsd: null,
    themes: ["AI"],
    participants: null,
    // The first line of the description usually names the sponsor ("Build on AMD...").
    organizer: (e.description ?? "").split("\n")[0].slice(0, 200) || null,
  };
}

export async function fetchLablab(): Promise<RawHackathon[]> {
  const res = await fetch(PAGE, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`lablab.ai responded ${res.status}`);
  const events = extractJsonArray<LablabEvent>(readRscPayload(await res.text()), "sortedEvents");
  if (!events) throw new Error("lablab.ai page layout changed (no event data)");
  const now = Date.now();
  return events
    .filter((e) => e.type === "HACKATHON" && !e.toBeAnnounced && e.endAt && Date.parse(e.endAt) > now)
    .map(normalize);
}
