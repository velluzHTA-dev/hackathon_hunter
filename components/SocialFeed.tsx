"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalIcon, SearchIcon, XIcon } from "./icons";
import { useNow } from "@/lib/time";
import type { Hackathon, PostKind, SocialResponse } from "@/lib/types";

const TABS: { key: PostKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "team", label: "Looking for team" },
  { key: "discussion", label: "Discussion" },
];

const KIND_STYLE: Record<PostKind, string> = {
  announcement: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900",
  team: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  discussion: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};
const KIND_LABEL: Record<PostKind, string> = { announcement: "Announcement", team: "Looking for team", discussion: "Discussion" };

function ago(iso: string, now: number | null): string {
  if (now === null) return "";
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

export function SocialFeed({ data, hackathons }: { data: SocialResponse; hackathons: Hackathon[] }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<PostKind | "all">("all");
  const [q, setQ] = useState("");
  const [hackathonId, setHackathonId] = useState(params.get("h"));
  const now = useNow();
  const byId = useMemo(() => new Map(hackathons.map((h) => [h.id, h])), [hackathons]);
  const focused = hackathonId ? byId.get(hackathonId) : undefined;

  const scoped = data.posts.filter((p) => {
    if (hackathonId && !p.mentions.includes(hackathonId)) return false;
    const needle = q.trim().toLowerCase();
    return !needle || `${p.title} ${p.excerpt}`.toLowerCase().includes(needle);
  });
  const visible = tab === "all" ? scoped : scoped.filter((p) => p.kind === tab);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">Social</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          The latest from r/hackathon and r/hackathons: new events, people looking for teammates, and discussion.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <aside className="lg:order-last lg:sticky lg:top-20 lg:self-start">
          <SearchElsewhere />
        </aside>

        <div className="min-w-0 space-y-4">
          {focused && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="min-w-0 flex-1 truncate">
                Posts mentioning <strong className="font-semibold">{focused.title}</strong>
              </p>
              <button
                onClick={() => {
                  setHackathonId(null);
                  window.history.replaceState(null, "", window.location.pathname);
                }}
                className="flex shrink-0 items-center gap-1 text-indigo-700 hover:underline dark:text-indigo-300"
              >
                <XIcon size={14} />
                Show all
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {TABS.map((t) => {
                const count = t.key === "all" ? scoped.length : scoped.filter((p) => p.kind === t.key).length;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
                    }`}
                  >
                    {t.label}
                    <span className={`tabular-nums ${active ? "opacity-70" : "text-zinc-400"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative sm:ml-auto sm:w-56">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                placeholder="Filter posts"
                aria-label="Filter posts"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          {data.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              Couldn&apos;t load Reddit: {data.error}.
            </p>
          )}

          {visible.length === 0 && !data.error ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No posts here.
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:border-zinc-300 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${KIND_STYLE[p.kind]}`}>
                      {KIND_LABEL[p.kind]}
                    </span>
                    <span className="min-w-0 truncate">
                      {p.community} · u/{p.author}
                    </span>
                    <span className="ml-auto shrink-0 tabular-nums">{ago(p.postedAt, now)}</span>
                  </div>
                  <h3 className="mt-2 break-words font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                      {p.title}
                    </a>
                  </h3>
                  {p.excerpt && (
                    <p className="mt-1.5 line-clamp-3 break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.excerpt}</p>
                  )}
                  {(p.links.length > 0 || p.mentions.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      {p.mentions.map((id) => {
                        const h = byId.get(id);
                        return h ? (
                          <Link
                            key={id}
                            href={`/?q=${encodeURIComponent(h.title)}`}
                            className="max-w-full truncate rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900"
                          >
                            {h.title}
                          </Link>
                        ) : null;
                      })}
                      {p.links.slice(0, 3).map((l) => (
                        <a
                          key={l}
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex max-w-[16rem] items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          <ExternalIcon size={12} className="shrink-0" />
                          <span className="truncate">{new URL(l).hostname.replace(/^www\./, "")}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const PLATFORMS = [
  {
    name: "LinkedIn",
    url: (q: string) => `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q)}&sortBy=%22date_posted%22`,
    style: "bg-[#0a66c2] hover:bg-[#004182]",
  },
  {
    name: "Facebook",
    url: (q: string) => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}`,
    style: "bg-[#1877f2] hover:bg-[#0b5fcc]",
  },
  {
    name: "Reddit",
    url: (q: string) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}&sort=new`,
    style: "bg-[#ff4500] hover:bg-[#d93a00]",
  },
];

function SearchElsewhere() {
  const [q, setQ] = useState("hackathon registration open");
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">Search LinkedIn &amp; Facebook</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        They don&apos;t let apps read posts, so this opens their own search. You&apos;ll need to be signed in.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-3 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        aria-label="Search terms"
      />
      <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-1">
        {PLATFORMS.map((p) => (
          <a
            key={p.name}
            href={p.url(q)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-white transition ${p.style}`}
          >
            {p.name}
            <ExternalIcon size={13} />
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Found one?{" "}
        <Link href="/saved#add" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Add it to Saved
        </Link>{" "}
        for countdowns and reminders.
      </p>
    </div>
  );
}
