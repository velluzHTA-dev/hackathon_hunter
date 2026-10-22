"use client";

import Link from "next/link";
import { Countdown } from "./Countdown";
import { BuildingIcon, CalendarIcon, CalendarPlusIcon, ChatIcon, GlobeIcon, PinIcon, StarIcon, TrophyIcon, UsersIcon } from "./icons";
import { downloadIcs } from "@/lib/ics";
import { formatDateRange } from "@/lib/time";
import { STATUSES, type Hackathon, type TrackedItem, type TrackStatus } from "@/lib/types";

const SOURCE_NAMES: Partial<Record<Hackathon["source"], string>> = {
  devpost: "Devpost",
  mlh: "MLH",
  cerebralvalley: "Cerebral Valley",
  lablab: "lablab.ai",
  luma: "Luma",
};

// Sources whose organizer field is a readable list of names worth showing.
const SHOWS_ORGANIZER = new Set<Hackathon["source"]>(["devpost", "cerebralvalley", "luma"]);

function sourceLabel(h: Hackathon): string {
  const named = SOURCE_NAMES[h.source];
  if (named) return named;
  if (/linkedin\.com/i.test(h.url)) return "From LinkedIn";
  if (/facebook\.com|fb\.(com|me)/i.test(h.url)) return "From Facebook";
  if (/reddit\.com/i.test(h.url)) return "From Reddit";
  return "Added by you";
}

function formatPrize(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k` : `$${n}`;
}

const MAX_THEMES = 3;

interface Props {
  h: Hackathon;
  tracked?: TrackedItem;
  now: number | null;
  postCount?: number;
  /** Tighter layout for narrow board columns: no themes or registrations. */
  compact?: boolean;
  onSave: (h: Hackathon) => void;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: TrackStatus) => void;
}

export function HackathonCard({ h, tracked, now, postCount, compact, onSave, onRemove, onStatus }: Props) {
  const location = h.mode === "hybrid" ? `Hybrid · ${h.location}` : h.location;
  const extraThemes = h.themes.length - MAX_THEMES;
  const companies = h.companies ?? []; // snapshots saved before company tagging have none
  const showOrganizer = h.organizer && SHOWS_ORGANIZER.has(h.source) && h.organizer !== sourceLabel(h);

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className={`flex gap-3 ${compact ? "p-3" : "p-4"}`}>
        {h.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote thumbnails from many hosts
          <img
            src={h.image}
            alt=""
            loading="lazy"
            className={`${compact ? "h-10 w-10" : "h-12 w-12"} shrink-0 rounded-xl bg-zinc-100 object-cover ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/10`}
          />
        ) : (
          <div
            className={`${compact ? "h-10 w-10" : "h-12 w-12"} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white`}
          >
            {h.title[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500" title={h.organizer ?? undefined}>
            {sourceLabel(h)}
            {showOrganizer && <span className="normal-case tracking-normal"> · {h.organizer}</span>}
          </p>
          <h3 className={`mt-0.5 line-clamp-2 font-semibold leading-snug text-zinc-900 dark:text-zinc-50 ${compact ? "text-sm" : "text-[15px]"}`}>
            <a href={h.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {h.title}
            </a>
          </h3>
        </div>
        <button
          onClick={() => (tracked ? onRemove(h.id) : onSave(h))}
          aria-label={tracked ? `Remove ${h.title} from saved` : `Save ${h.title}`}
          aria-pressed={!!tracked}
          title={tracked ? "Remove from saved" : "Save"}
          className={`-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
            tracked
              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50"
              : "text-zinc-300 hover:bg-zinc-100 hover:text-amber-500 dark:text-zinc-600 dark:hover:bg-zinc-800"
          }`}
        >
          <StarIcon size={18} filled={!!tracked} />
        </button>
      </div>

      <div className={`space-y-1 text-sm text-zinc-600 dark:text-zinc-400 ${compact ? "px-3" : "px-4"}`}>
        <p className="flex items-center gap-2">
          <CalendarIcon size={14} className="shrink-0 text-zinc-400" />
          {formatDateRange(h.startDate, h.endDate)}
        </p>
        <p className="flex items-center gap-2" title={location}>
          {h.mode === "online" ? (
            <GlobeIcon size={14} className="shrink-0 text-zinc-400" />
          ) : (
            <PinIcon size={14} className="shrink-0 text-zinc-400" />
          )}
          <span className="truncate">{location}</span>
        </p>
      </div>

      <div className={`mt-3 flex flex-wrap items-center gap-1.5 ${compact ? "px-3" : "px-4"}`}>
        <Countdown deadline={h.deadline} label={h.deadlineLabel} now={now} />
        {companies.slice(0, 2).map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            title={`Run or sponsored by ${c}`}
          >
            <BuildingIcon size={12} />
            {c}
          </span>
        ))}
        {h.prizeUsd !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900"
            title={`$${h.prizeUsd.toLocaleString()} in prizes`}
          >
            <TrophyIcon size={12} />
            {formatPrize(h.prizeUsd)}
          </span>
        )}
      </div>

      {!compact && h.themes.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1 px-4">
          {h.themes.slice(0, MAX_THEMES).map((t) => (
            <span key={t} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {t}
            </span>
          ))}
          {extraThemes > 0 && (
            <span className="px-1 py-0.5 text-[11px] text-zinc-400" title={h.themes.slice(MAX_THEMES).join(", ")}>
              +{extraThemes}
            </span>
          )}
        </div>
      )}

      {/* Pushes the footer to the bottom so footers line up across a row. */}
      <div className={`flex-1 ${compact ? "min-h-3" : "min-h-4"}`} />
      <div
        className={`flex items-center gap-3 border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 ${
          compact ? "mx-3 py-2" : "mx-4 py-2.5"
        }`}
      >
        {!compact && h.participants !== null && (
          <span className="flex items-center gap-1" title="Registered participants">
            <UsersIcon size={13} />
            {h.participants.toLocaleString()}
          </span>
        )}
        {!!postCount && (
          <Link
            href={`/social?h=${encodeURIComponent(h.id)}`}
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            title={`${postCount} Reddit post${postCount > 1 ? "s" : ""} about this hackathon`}
          >
            <ChatIcon size={13} />
            {postCount}
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1">
          {h.deadline && (
            <button
              onClick={() => downloadIcs(h)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Add deadline to calendar"
              aria-label={`Add ${h.title} deadline to calendar`}
            >
              <CalendarPlusIcon size={15} />
            </button>
          )}
          {tracked && (
            <select
              value={tracked.status}
              onChange={(e) => onStatus(h.id, e.target.value as TrackStatus)}
              className="h-7 rounded-md border border-zinc-200 bg-white pl-2 pr-1 text-xs capitalize text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              aria-label={`Status for ${h.title}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </article>
  );
}
