# Hackathon Hunter

Find upcoming hackathons, track the ones you care about, and don't miss deadlines.
Listings come live from **Devpost**, **MLH**, **Cerebral Valley**, **lablab.ai** and **Luma** and are refreshed every 30 minutes.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

For production: `npm run build && npm start`.

## Features

- **Browse & filter**: search by name, organizer or theme; filter by format (online / in person / hybrid), location, source, minimum prize, start-date range, theme chips, and "closing within 7 days". Sort by deadline, prize, registrations or start date. Filters are kept in the URL, so you can bookmark or share a view.
- **Big tech**: hackathons run or sponsored by companies like Google, Meta, Microsoft, Amazon, NVIDIA, OpenAI and Anthropic get a company badge. Use the **Big tech** toggle for all of them, or the company chips for specific ones (e.g. `/?co=Meta`). Detection is name-based (`lib/companies.ts`) and also recognizes products, so a Gemini hackathon counts as Google's. Local chapters like Google Developer Groups or AWS student clubs don't count.
- **Bookmarks & tracking**: star any hackathon, then move it through *interested → registered → building → submitted* on the **Saved** page. Export or import your list as JSON.
- **Deadline reminders**: countdown badges on every card (amber under 7 days, red under 48h), a banner for saved hackathons closing within 72 hours, optional browser notifications under 24 hours, and a **+ Calendar** button that downloads an `.ics` event with a reminder the day before.

- **Social**: the latest posts from r/hackathon and r/hackathons, sorted into *Announcements*, *Looking for team* and *Discussion*. Posts that name a listed hackathon are linked to it, and its card shows a 💬 count, which is handy for finding teammates.
- **LinkedIn & Facebook**: neither offers a public way to read posts, so the Social page has buttons that open their own search. If you find a hackathon there, use **+ Add a hackathon from a link** on the Saved page to track it with countdowns and reminders.

Bookmarks are stored in your browser's `localStorage`. They aren't synced between browsers, so use Export/Import to move them.

## How the data works

| Source  | How it's fetched | "Deadline" means |
|---------|------------------|------------------|
| Devpost | Public JSON API (`devpost.com/api/hackathons`) | End of the submission period (Devpost gives no time, so it's taken as 23:59 UTC) |
| MLH     | Event data embedded in the season page (`mlh.com/seasons/<year>/events`) | Event start time |
| Cerebral Valley | Public API behind `cerebralvalley.ai/events` (`api.cerebralvalley.ai/v1/public/event/pull`), paged through for every upcoming event typed as a hackathon. Hosts become the organizer, so the sponsoring company (Google DeepMind, Meta, OpenAI, Anthropic…) is named; prizes are read from the summary ("$1 million in prizes") | Event start time |
| lablab.ai | Event list embedded in `lablab.ai/ai-hackathons` (sponsor-run AI hackathons, e.g. AMD) | Event start time |
| Luma    | Public discover search for "hackathon". Results favor events near wherever the app runs | Event start time |

| Reddit  | Atom feed of r/hackathon + r/hackathons (Reddit blocks anonymous JSON). Posts are classified by keyword rules in `lib/sources/reddit.ts` | — |

Reddit rate-limits hard, so it's fetched in a single request and cached for 30 minutes. If it fails, the Social page shows the error and the rest of the app is unaffected.

`GET /api/hackathons` returns the merged list; `GET /api/social` returns the classified Reddit posts. If one source fails, the other still loads and the UI says which one is down.
Duplicates (same title on both sites) keep the Devpost version because it carries prize and registration data.

## Code map

- `lib/sources/` — one fetcher per site, each normalizing into the `Hackathon` type in `lib/types.ts`
- `lib/aggregate.ts` — merges, dedupes, drops ended events, sorts
- `lib/social.ts` — loads Reddit posts and links them to hackathons they mention
- `lib/filters.ts` — filter/sort logic and URL (de)serialization
- `lib/useTracker.ts` — bookmark storage hook
- `components/` — UI
