"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./icons";
import { useTracker } from "@/lib/useTracker";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/social", label: "Social" },
  { href: "/saved", label: "Saved" },
];

export function Nav() {
  const path = usePathname();
  const { tracked } = useTracker();
  const count = Object.keys(tracked).length;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 dark:text-white">
          <LogoMark />
          <span className="hidden sm:inline">Hackathon Hunter</span>
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {l.label}
                {l.href === "/saved" && count > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-semibold text-amber-950">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
