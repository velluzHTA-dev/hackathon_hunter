import * as cheerio from "cheerio";
import { safeUrl } from "../safeUrl";
import type { PostKind, SocialPost } from "../types";

const SUBREDDITS = ["hackathon", "hackathons"];
// Reddit blocks anonymous JSON requests but still serves Atom feeds. It rate-limits hard,
// so this is fetched as one combined request and cached for 30 minutes.
const FEED = `https://www.reddit.com/r/${SUBREDDITS.join("+")}/new/.rss?limit=100`;

// Profile and chat links say nothing about the hackathon itself.
const IGNORED_LINK = /reddit\.com|redd\.it|linkedin\.com\/in\/|github\.com\/[^/]+\/?$|discord\.(gg|com)|instagram\.com|wa\.me|t\.me/i;

const ROLE = String.raw`(team|team ?mates?|members?|partners?|devs?|developers?|devlopers?|designers?|engineers?|hackers?|\d+ (person|people))\b`;
const TEAM = new RegExp(
  String.raw`(looking|searching) for\b[^.!?\n]{0,30}?\b${ROLE}|(need(ed)?|seeking)\b[^.!?\n]{0,25}?\b${ROLE}|\blft\b|join (my|our) team|(building|forming|making) a team|recruiting`,
  "i",
);
const ANNOUNCE =
  /announc|registrations? (is |are )?(now )?open|register (now|here|at|today)|presents|apply (now|here|today)|applications? (are )?open|wants you|is (now )?live|calling all|join us/i;
const EVENTISH = /hack|challenge|competition|jam|event|summit/i;
// Organizers asking for sponsors, or people asking for help, aren't announcing an event.
const NOT_ANNOUNCEMENT = /sponsor|looking for (free )?help|\bhelp\b.*\?/i;

export function classify(title: string, body: string, links: string[]): PostKind {
  if (NOT_ANNOUNCEMENT.test(title)) return "discussion";
  if (TEAM.test(title) || TEAM.test(body.slice(0, 300))) return "team";
  if (title.trim().endsWith("?")) return "discussion";
  if (ANNOUNCE.test(`${title}\n${body}`)) return "announcement";
  if (links.length > 0 && EVENTISH.test(`${title}\n${body}`)) return "announcement";
  return "discussion";
}

export async function fetchReddit(): Promise<SocialPost[]> {
  const res = await fetch(FEED, {
    headers: { "User-Agent": "Mozilla/5.0 (HackathonHunter; personal project)" },
    next: { revalidate: 1800 },
  });
  if (res.status === 429) throw new Error("Reddit is rate-limiting requests; try again in a few minutes");
  if (!res.ok) throw new Error(`Reddit responded ${res.status}`);

  const $ = cheerio.load(await res.text(), { xml: true });
  return $("entry")
    .toArray()
    .map((el) => {
      const entry = $(el);
      const html = cheerio.load(entry.find("content").text());
      const body = html(".md")
        .text()
        .replace(/https?:\/\/(preview|i)\.redd\.it\/\S+/g, "") // inline image URLs
        .replace(/\s+/g, " ")
        .trim();
      // Body links, plus the "[link]" anchor that link posts point at an external URL.
      const hrefs = [
        ...html(".md a").toArray().map((a) => html(a).attr("href") ?? ""),
        ...html("a").toArray().filter((a) => html(a).text() === "[link]").map((a) => html(a).attr("href") ?? ""),
      ];
      const links = [...new Set(hrefs.filter((h) => /^https?:\/\//.test(h) && !IGNORED_LINK.test(h)))];
      const title = entry.find("title").text().trim();
      return {
        id: `reddit:${entry.find("id").text()}`,
        platform: "reddit" as const,
        title,
        url: safeUrl(entry.find("link").attr("href")) ?? "https://www.reddit.com",
        author: entry.find("author > name").text().replace(/^\/u\//, ""),
        community: entry.find("category").attr("label") ?? "",
        postedAt: new Date(entry.find("published").text() || entry.find("updated").text()).toISOString(),
        excerpt: body.length > 280 ? `${body.slice(0, 277)}…` : body,
        links,
        kind: classify(title, body, links),
        mentions: [],
      };
    });
}
