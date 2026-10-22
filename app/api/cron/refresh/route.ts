import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Vercel Cron calls this once a day (see vercel.json), so listings are re-scraped even when
// nobody has visited. Vercel sends the CRON_SECRET env var as a bearer token; anyone else
// gets a 401, so the route can't be used to hammer the sources.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PAGES = ["/", "/social", "/api/social"];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Drop every cached page and scrape, then visit the pages so the fresh scrape happens now
  // instead of on the next visitor's request.
  revalidatePath("/", "layout");
  const origin = new URL(req.url).origin;
  const hackathons = await fetch(`${origin}/api/hackathons`, { cache: "no-store" })
    .then((r) => r.json() as Promise<{ hackathons: unknown[]; errors: unknown[]; fetchedAt: string }>)
    .catch(() => null);
  const pages = await Promise.all(
    PAGES.map((p) =>
      fetch(`${origin}${p}`, { cache: "no-store" })
        .then((r) => [p, r.status] as const)
        .catch(() => [p, "failed"] as const),
    ),
  );

  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    hackathons: hackathons && {
      count: hackathons.hackathons.length,
      errors: hackathons.errors,
      fetchedAt: hackathons.fetchedAt,
    },
    pages: Object.fromEntries(pages),
  });
}
