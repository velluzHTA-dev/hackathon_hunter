"use client";

import { useState } from "react";
import { detectCompanies } from "@/lib/companies";
import { isMyanmar } from "@/lib/myanmar";
import { safeUrl } from "@/lib/safeUrl";
import type { Hackathon, Mode } from "@/lib/types";

const input =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950";
const label = "mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400";

const DEADLINE_TYPES = ["Registration closes", "Submissions close", "Starts"];
const EMPTY = { url: "", title: "", deadline: "", deadlineLabel: DEADLINE_TYPES[0], location: "Online", mode: "online" as Mode };

/** Lets the user track a hackathon they found elsewhere (LinkedIn, Facebook, a friend's message…). */
export function AddFromLink({ onAdd, onClose }: { onAdd: (h: Hackathon) => void; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = safeUrl(form.url);
    if (!url) return setError("Enter a link starting with https://");
    const deadline = form.deadline ? new Date(form.deadline).toISOString() : null;
    const title = form.title.trim();
    onAdd({
      id: `manual:${crypto.randomUUID()}`,
      source: "manual",
      title,
      url,
      image: null,
      startDate: null,
      endDate: null,
      deadline,
      deadlineLabel: form.deadlineLabel,
      location: form.location.trim() || "Online",
      mode: form.mode,
      prizeUsd: null,
      themes: [],
      participants: null,
      organizer: null,
      companies: detectCompanies({ title, organizer: null }),
      myanmar: isMyanmar({ title, location: form.location }),
    });
    setForm(EMPTY);
    onClose();
  };

  return (
    <form
      id="add"
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm sm:p-5 dark:border-indigo-900/70 dark:bg-zinc-900"
    >
      <div>
        <h2 className="font-semibold">Add a hackathon from a link</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Found one on LinkedIn, Facebook or anywhere else? Save it here to get the same countdown and reminders.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="a-url">Link to the post or event page</label>
          <input
            id="a-url"
            type="url"
            required
            autoFocus
            placeholder="https://www.linkedin.com/posts/…"
            className={input}
            value={form.url}
            onChange={(e) => {
              set("url", e.target.value);
              setError(null);
            }}
          />
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="a-title">Name</label>
          <input id="a-title" required className={input} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="a-dl">Deadline</label>
          <input id="a-dl" type="datetime-local" className={input} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="a-dlt">The deadline is when…</label>
          <select id="a-dlt" className={input} value={form.deadlineLabel} onChange={(e) => set("deadlineLabel", e.target.value)}>
            {DEADLINE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="a-mode">Format</label>
          <select id="a-mode" className={input} value={form.mode} onChange={(e) => set("mode", e.target.value as Mode)}>
            <option value="online">Online</option>
            <option value="in-person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="a-loc">Location</label>
          <input id="a-loc" className={input} value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 text-sm">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
          Save
        </button>
      </div>
    </form>
  );
}
