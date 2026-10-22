"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AddFromLink } from "@/components/AddFromLink";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { HackathonCard } from "@/components/HackathonCard";
import { PlusIcon, StarIcon } from "@/components/icons";
import { useNow } from "@/lib/time";
import { useTracker } from "@/lib/useTracker";
import { STATUSES } from "@/lib/types";

const STATUS_META = {
  interested: { dot: "bg-sky-500", hint: "Worth a look" },
  registered: { dot: "bg-indigo-500", hint: "Signed up" },
  building: { dot: "bg-amber-500", hint: "Hacking on it" },
  submitted: { dot: "bg-emerald-500", hint: "Done!" },
} as const;

const ghostButton =
  "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function SavedPage() {
  const { tracked, save, remove, setStatus, importData } = useTracker();
  const now = useNow();
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const items = Object.values(tracked).sort((a, b) =>
    (a.snapshot.deadline ?? "9").localeCompare(b.snapshot.deadline ?? "9"),
  );

  // The Social page links here with #add to open the form directly.
  useEffect(() => {
    if (window.location.hash === "#add") setAdding(true);
  }, []);

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(tracked, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "hackathon-hunter-saved.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw new Error();
      const data = JSON.parse(await file.text());
      if (importData(data) === 0) throw new Error();
    } catch {
      alert("That file doesn't look like a Hackathon Hunter export.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">Your hackathons</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {items.length
              ? `${items.length} saved · change a card's status to move it across the board`
              : "Track what you're interested in, from first look to submission."}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJson} disabled={!items.length} className={ghostButton}>
            Export
          </button>
          <button onClick={() => fileRef.current?.click()} className={ghostButton}>
            Import
          </button>
          <button
            onClick={() => setAdding((a) => !a)}
            aria-expanded={adding}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <PlusIcon size={16} />
            Add from link
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {adding && <AddFromLink onAdd={(h) => save(h)} onClose={() => setAdding(false)} />}

      <DeadlineBanner />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/50">
            <StarIcon size={22} />
          </div>
          <p className="mt-4 font-medium text-zinc-800 dark:text-zinc-100">Nothing saved yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            Tap the star on any hackathon to track it here, or add one you found on LinkedIn or Facebook.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              href="/"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Browse hackathons
            </Link>
            <button onClick={() => setAdding(true)} className={`${ghostButton} h-auto py-2`}>
              Add from link
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const group = items.filter((t) => t.status === status);
            return (
              <section key={status} className="flex flex-col rounded-2xl bg-zinc-100/70 p-2 dark:bg-zinc-900/50">
                <h2 className="flex items-center gap-2 px-2 pb-2.5 pt-1.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
                  <span className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100">{status}</span>
                  <span className="rounded-full bg-zinc-200/80 px-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {group.length}
                  </span>
                  <span className="ml-auto text-xs text-zinc-400">{STATUS_META[status].hint}</span>
                </h2>
                <div className="space-y-2">
                  {group.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                      Nothing here yet
                    </p>
                  ) : (
                    group.map((t) => (
                      <HackathonCard
                        key={t.snapshot.id}
                        h={t.snapshot}
                        tracked={t}
                        now={now}
                        compact
                        onSave={save}
                        onRemove={remove}
                        onStatus={setStatus}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
