"use client";

import { useState } from "react";
import { BuildingIcon, ChevronIcon, ClockIcon, SearchIcon, SlidersIcon, XIcon } from "./icons";
import { DEFAULT_FILTERS, type FilterState, type SortKey } from "@/lib/filters";

const field =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950";
const label = "mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400";

const MODES: { value: FilterState["mode"]; label: string }[] = [
  { value: "all", label: "Any format" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  themes: string[];
  /** Big tech companies in the listings, with how many hackathons each has. */
  companies: [string, number][];
}

/** Number of filters set inside the collapsible panel. */
function advancedCount(f: FilterState): number {
  return [f.loc, f.source !== "all", f.minPrize > 0, f.from, f.to].filter(Boolean).length + f.themes.length;
}

export function Filters({ value: f, onChange, themes, companies }: Props) {
  const advanced = advancedCount(f);
  const [open, setOpen] = useState(advanced > 0);
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...f, [k]: v });
  const toggleTheme = (t: string) =>
    set("themes", f.themes.includes(t) ? f.themes.filter((x) => x !== t) : [...f.themes, t]);
  const toggleCompany = (c: string) =>
    set("companies", f.companies.includes(c) ? f.companies.filter((x) => x !== c) : [...f.companies, c]);
  const isDefault = JSON.stringify(f) === JSON.stringify(DEFAULT_FILTERS);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search name, organizer or theme"
            aria-label="Search hackathons"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            className={`${field} h-11 pl-10 text-[15px]`}
          />
        </div>
        <select
          aria-label="Sort by"
          value={f.sort}
          onChange={(e) => set("sort", e.target.value as SortKey)}
          className={`${field} h-11 flex-1 sm:w-48 sm:flex-none`}
        >
          <option value="deadline">Deadline: soonest</option>
          <option value="prize">Prize: highest</option>
          <option value="participants">Most registered</option>
          <option value="newest">Start date: latest</option>
        </select>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="more-filters"
          className={`flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition ${
            open || advanced
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          <SlidersIcon size={16} />
          Filters
          {advanced > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] text-white">
              {advanced}
            </span>
          )}
          <ChevronIcon size={14} className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Format" className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {MODES.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={f.mode === m.value}
              onClick={() => set("mode", m.value)}
              className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition sm:px-3 ${
                f.mode === m.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => set("closingSoon", !f.closingSoon)}
          aria-pressed={f.closingSoon}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-medium transition ${
            f.closingSoon
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          <ClockIcon size={14} />
          Closing this week
        </button>
        <button
          onClick={() => set("bigTech", !f.bigTech)}
          aria-pressed={f.bigTech}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-medium transition ${
            f.bigTech
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          <BuildingIcon size={14} />
          Big tech
        </button>
        {!isDefault && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <XIcon size={14} />
            Clear all
          </button>
        )}
      </div>

      {companies.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">Companies</span>
          <div className="no-scrollbar -mr-3 flex min-w-0 gap-1.5 overflow-x-auto pr-3 sm:mr-0 sm:flex-wrap sm:pr-0">
            {companies.map(([name, count]) => {
              const on = f.companies.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleCompany(name)}
                  aria-pressed={on}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                    on
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500"
                  }`}
                >
                  {name}
                  <span className={`tabular-nums ${on ? "opacity-70" : "text-zinc-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && (
        <div id="more-filters" className="mt-4 space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <label className={label} htmlFor="f-loc">Location</label>
              <input id="f-loc" className={field} placeholder="City or country" value={f.loc} onChange={(e) => set("loc", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="f-src">Source</label>
              <select id="f-src" className={field} value={f.source} onChange={(e) => set("source", e.target.value as FilterState["source"])}>
                <option value="all">All sources</option>
                <option value="devpost">Devpost</option>
                <option value="mlh">MLH</option>
                <option value="cerebralvalley">Cerebral Valley</option>
                <option value="lablab">lablab.ai</option>
                <option value="luma">Luma</option>
                <option value="spaceapps">NASA Space Apps</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="f-prize">Minimum prize</label>
              <select id="f-prize" className={field} value={f.minPrize} onChange={(e) => set("minPrize", Number(e.target.value))}>
                {[0, 1000, 5000, 10000, 25000, 50000, 100000].map((n) => (
                  <option key={n} value={n}>{n === 0 ? "Any" : `$${n.toLocaleString()}+`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="f-from">Starts after</label>
              <input id="f-from" type="date" className={field} value={f.from} onChange={(e) => set("from", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="f-to">Starts before</label>
              <input id="f-to" type="date" className={field} value={f.to} onChange={(e) => set("to", e.target.value)} />
            </div>
          </div>

          {themes.length > 0 && (
            <div>
              <p className={label}>Themes</p>
              <div className="flex flex-wrap gap-1.5">
                {themes.map((t) => {
                  const on = f.themes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTheme(t)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
