import type { Mode, RawHackathon } from "../types";

// NASA's International Space Apps Challenge: one worldwide weekend with hundreds of local
// events. Its site is backed by a public GraphQL API. We list the challenge itself once, plus
// its local events in Myanmar so they show up in the Myanmar section.
const API = "https://api.spaceappschallenge.org/graphql";
const SITE = "https://www.spaceappschallenge.org";
const LOCAL_COUNTRIES = /^(myanmar|burma)$/i;
const MAX_PAGES = 20;

interface SaEvent {
  id: string;
  name: string; // "2026 NASA Space Apps Challenge"
  startDate: string; // "2026-11-13T19:00:00", UTC
  endDate: string;
}

interface SaLocation {
  id: string;
  title: string; // city, or "Universal Event"
  country: string;
  eventType: string; // "In-Person" | "Virtual" | "Virtual & In-Person"
  cachedRegistrations: number | null;
  meta: { htmlUrl: string } | null;
}

interface LocationsPage {
  locations: { pageInfo: { hasNextPage: boolean; endCursor: string }; edges: { node: SaLocation }[] };
}

const EVENTS =`query Events($first: Int!) { events(first: $first) { edges { node { id name startDate endDate } } } }`;
const LOCATIONS = `query Locations($first: Int!, $after: String, $filtering: [Filter!]) {
  locations(first: $first, after: $after, filtering: $filtering) {
    pageInfo { hasNextPage endCursor }
    edges { node { id title country eventType cachedRegistrations meta { htmlUrl } } }
  }
}`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (HackathonHunter)" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`NASA Space Apps responded ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!body.data) throw new Error(`NASA Space Apps API changed (${body.errors?.[0]?.message ?? "no data"})`);
  return body.data;
}

async function fetchLocations(eventId: string): Promise<SaLocation[]> {
  const filtering = [
    { field: "event", value: eventId, compare: "id" },
    { field: "live", value: "true", compare: "eq" },
  ];
  const out: SaLocation[] = [];
  let after: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { locations }: LocationsPage = await gql<LocationsPage>(LOCATIONS, { first: 100, after, filtering });
    out.push(...locations.edges.map((e) => e.node));
    if (!locations.pageInfo.hasNextPage) break;
    after = locations.pageInfo.endCursor;
  }
  return out;
}

const toIso = (s: string) => new Date(`${s}Z`).toISOString();

function modeOf(eventType: string): Mode {
  if (/virtual & in-person/i.test(eventType)) return "hybrid";
  return /virtual/i.test(eventType) ? "online" : "in-person";
}

export async function fetchSpaceApps(): Promise<RawHackathon[]> {
  const { events } = await gql<{ events: { edges: { node: SaEvent }[] } }>(EVENTS, { first: 5 });
  const now = Date.now();
  const upcoming = events.edges.map((e) => e.node).filter((e) => Date.parse(toIso(e.endDate)) > now);

  const lists = await Promise.all(
    upcoming.map(async (ev) => {
      const year = ev.name.match(/\d{4}/)?.[0] ?? "";
      const locations = await fetchLocations(ev.id);
      const countries = new Set(locations.map((l) => l.country)).size;
      const base = {
        source: "spaceapps" as const,
        image: null,
        startDate: toIso(ev.startDate),
        endDate: toIso(ev.endDate),
        deadline: toIso(ev.startDate),
        deadlineLabel: "Starts",
        prizeUsd: null,
        themes: ["Space", "Earth science", "Open data"],
        organizer: "NASA",
      };
      const global: RawHackathon = {
        ...base,
        id: `spaceapps:${ev.id}`,
        title: ev.name,
        url: `${SITE}/${year}/`,
        location: `Worldwide · ${locations.length} local events in ${countries} countries`,
        mode: "hybrid",
        participants: locations.reduce((n, l) => n + (l.cachedRegistrations ?? 0), 0) || null,
      };
      const local: RawHackathon[] = locations
        .filter((l) => LOCAL_COUNTRIES.test(l.country) && l.meta?.htmlUrl)
        .map((l) => ({
          ...base,
          id: `spaceapps:${l.id}`,
          title: `${ev.name}: ${l.title}`,
          url: l.meta!.htmlUrl,
          location: `${l.title}, Myanmar`,
          mode: modeOf(l.eventType),
          participants: l.cachedRegistrations || null,
        }));
      return [global, ...local];
    }),
  );
  return lists.flat();
}
