import { detectCompanies } from "./companies";
import { isMyanmar } from "./myanmar";
import { safeUrl } from "./safeUrl";
import { fetchCerebralValley } from "./sources/cerebralvalley";
import { fetchDevpost } from "./sources/devpost";
import { fetchLablab } from "./sources/lablab";
import { fetchLuma, fetchLumaMyanmar } from "./sources/luma";
import { fetchMlh } from "./sources/mlh";
import type { Hackathon, HackathonsResponse, RawHackathon, Source } from "./types";

// Listed in order of preference when the same hackathon appears on several sites:
// Devpost carries prizes and registrations, Cerebral Valley names the sponsoring company.
const SOURCES: [Source, () => Promise<RawHackathon[]>][] = [
  ["devpost", fetchDevpost],
  ["cerebralvalley", fetchCerebralValley],
  ["mlh", fetchMlh],
  ["lablab", fetchLablab],
  ["luma", fetchLuma],
  ["luma", fetchLumaMyanmar],
];

const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function getHackathons(): Promise<HackathonsResponse> {
  const results = await Promise.allSettled(SOURCES.map(([, fn]) => fn()));
  const errors: HackathonsResponse["errors"] = [];
  const seen = new Map<string, RawHackathon>();

  // Earlier sources win, so each title keeps the listing from the most informative site.
  results.forEach((r, i) => {
    const source = SOURCES[i][0];
    if (r.status === "rejected") {
      errors.push({ source, message: r.reason instanceof Error ? r.reason.message : String(r.reason) });
      return;
    }
    for (const h of r.value) {
      const url = safeUrl(h.url);
      if (!url) continue; // a listing we can't safely link to isn't worth showing
      const key = titleKey(h.title);
      if (!seen.has(key)) seen.set(key, { ...h, url, image: safeUrl(h.image) });
    }
  });

  const now = Date.now();
  const hackathons: Hackathon[] = [...seen.values()]
    // Drop anything that has already ended.
    .filter((h) => !h.endDate || new Date(h.endDate).getTime() >= now)
    .map((h) => ({ ...h, companies: detectCompanies(h), myanmar: isMyanmar(h) }))
    .sort((a, b) => (a.deadline ?? "9").localeCompare(b.deadline ?? "9"));

  return { hackathons, errors, fetchedAt: new Date().toISOString() };
}
