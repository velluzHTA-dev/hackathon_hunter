/** "manual" = added by the user from a link (e.g. a LinkedIn or Facebook post). */
export type Source = "devpost" | "mlh" | "cerebralvalley" | "lablab" | "luma" | "spaceapps" | "manual";
export type Mode = "online" | "in-person" | "hybrid";

export interface Hackathon {
  id: string; // "<source>:<native id>"
  source: Source;
  title: string;
  url: string;
  image: string | null;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
  /** The date that matters for acting on it: submission close (Devpost) or event start (MLH). */
  deadline: string | null; // ISO
  deadlineLabel: string; // e.g. "Submissions close", "Starts"
  location: string;
  mode: Mode;
  prizeUsd: number | null;
  themes: string[];
  participants: number | null;
  organizer: string | null;
  /** Big tech companies running or sponsoring it, e.g. ["Google", "Meta"]. Filled in by the aggregator. */
  companies: string[];
  /** Takes place in Myanmar. Filled in by the aggregator. */
  myanmar: boolean;
}

/** What each source returns, before the aggregator detects companies and Myanmar. */
export type RawHackathon = Omit<Hackathon, "companies" | "myanmar">;

export interface HackathonsResponse {
  hackathons: Hackathon[];
  errors: { source: Source; message: string }[];
  fetchedAt: string;
}

export type PostKind = "announcement" | "team" | "discussion";

export interface SocialPost {
  id: string; // "reddit:<t3 id>"
  platform: "reddit";
  title: string;
  url: string; // the post itself
  author: string;
  community: string; // e.g. "r/hackathon"
  postedAt: string; // ISO
  excerpt: string;
  links: string[]; // external links found in the post
  kind: PostKind;
  /** Ids of live hackathons this post mentions by name. */
  mentions: string[];
}

export interface SocialResponse {
  posts: SocialPost[];
  error: string | null;
  fetchedAt: string;
}

export const STATUSES = ["interested", "registered", "building", "submitted"] as const;
export type TrackStatus = (typeof STATUSES)[number];

export interface TrackedItem {
  status: TrackStatus;
  savedAt: string;
  snapshot: Hackathon;
}
