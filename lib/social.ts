import { getHackathons } from "./aggregate";
import { fetchReddit } from "./sources/reddit";
import type { Hackathon, SocialPost, SocialResponse } from "./types";

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

// Words people leave out when naming a hackathon: years, edition numbers, seasons.
const DROPPED = /^(\d+|v\d+|\d+(st|nd|rd|th)|fall|spring|summer|winter|autumn)$/;
const GENERIC = new Set(
  "hackathon hackathons hack hacks the a of for and ai ml global online challenge edition season build summit week day".split(" "),
);
// Names at least this long are also matched with spaces ignored ("Hack Princeton" = "HackPrinceton").
const SPACELESS_MIN = 10;

/**
 * The name used to spot a hackathon in post text, minus years, editions and seasons:
 * "HackPrinceton Fall 2026" -> "hackprinceton", "Cal Hacks 13.0" -> "cal hacks".
 * Returns null for names too generic to match safely, like "AI Hackathon 2026".
 */
export function nameKey(title: string): string | null {
  const words = normalize(title).trim().split(" ").filter((w) => !DROPPED.test(w));
  const distinctive = words.filter((w) => !GENERIC.has(w)).join("");
  return distinctive.length >= 5 ? ` ${words.join(" ")} ` : null;
}

export function linkMentions(posts: SocialPost[], hackathons: Hackathon[]): SocialPost[] {
  const keys = hackathons.flatMap((h) => {
    const key = nameKey(h.title);
    return key ? [{ id: h.id, key, spaceless: key.replace(/ /g, "") }] : [];
  });
  return posts.map((p) => {
    const text = normalize(`${p.title} ${p.excerpt}`);
    const spaceless = text.replace(/ /g, "");
    const mentions = keys
      .filter((k) => text.includes(k.key) || (k.spaceless.length >= SPACELESS_MIN && spaceless.includes(k.spaceless)))
      .map((k) => k.id);
    return { ...p, mentions };
  });
}

export async function getSocial(hackathons?: Hackathon[]): Promise<SocialResponse> {
  const fetchedAt = new Date().toISOString();
  try {
    const [posts, live] = await Promise.all([
      fetchReddit(),
      hackathons ? Promise.resolve(hackathons) : getHackathons().then((d) => d.hackathons),
    ]);
    return { posts: linkMentions(posts, live), error: null, fetchedAt };
  } catch (e) {
    return { posts: [], error: e instanceof Error ? e.message : String(e), fetchedAt };
  }
}
