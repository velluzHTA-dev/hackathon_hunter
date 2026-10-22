import type { RawHackathon } from "../types";

// Luma hosts many company-run and community hackathons. Its discover search is public JSON.
// Results are weighted toward events near wherever the app is running.
const SEARCH = "https://api.lu.ma/discover/get-paginated-events?pagination_limit=50&query=hackathon";

// The search also matches meetups that only mention hackathons, so keep events named like one.
const HACKATHON_NAME = /hack|buildathon|ideathon|game ?jam|codefest/i;

interface LumaEntry {
  event: {
    api_id: string;
    name: string;
    url: string;
    start_at: string;
    end_at: string | null;
    cover_url: string | null;
    location_type: string; // "offline" | "online" | ...
    geo_address_info?: { city?: string; city_state?: string; country?: string } | null;
  };
  calendar?: { name?: string; is_personal?: boolean } | null;
  hosts?: { name: string }[];
  guest_count?: number;
}

function normalize({ event: e, calendar, hosts, guest_count }: LumaEntry): RawHackathon {
  const online = e.location_type === "online";
  const geo = e.geo_address_info;
  const place = [geo?.city_state ?? geo?.city, geo?.country].filter(Boolean);
  const organizers = [
    ...(calendar && !calendar.is_personal && calendar.name ? [calendar.name] : []),
    ...(hosts ?? []).map((h) => h.name),
  ];
  return {
    id: `luma:${e.api_id}`,
    source: "luma",
    title: e.name.trim(),
    url: `https://lu.ma/${e.url}`,
    image: e.cover_url,
    startDate: e.start_at,
    endDate: e.end_at,
    deadline: e.start_at,
    deadlineLabel: "Starts",
    location: online ? "Online" : [...new Set(place)].join(", ") || "TBA",
    mode: online ? "online" : "in-person",
    prizeUsd: null,
    themes: [],
    participants: guest_count || null,
    organizer: [...new Set(organizers)].join(", ") || null,
  };
}

export async function fetchLuma(): Promise<RawHackathon[]> {
  const res = await fetch(SEARCH, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter)", Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Luma responded ${res.status}`);
  const data = (await res.json()) as { entries?: LumaEntry[] };
  if (!Array.isArray(data.entries)) throw new Error("Luma response changed (no entries)");
  return data.entries.filter((x) => HACKATHON_NAME.test(x.event.name)).map(normalize);
}
