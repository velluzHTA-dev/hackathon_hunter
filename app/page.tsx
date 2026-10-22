import { Suspense } from "react";
import { HackathonBrowser } from "@/components/HackathonBrowser";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { getHackathons } from "@/lib/aggregate";
import { getSocial } from "@/lib/social";

export const revalidate = 1800;

export default async function Home() {
  const data = await getHackathons();
  // Reddit is optional here: if it fails, cards just don't show post counts.
  const social = await getSocial(data.hackathons);
  const postCounts: Record<string, number> = {};
  for (const p of social.posts) for (const id of p.mentions) postCounts[id] = (postCounts[id] ?? 0) + 1;

  return (
    <div className="space-y-5">
      <DeadlineBanner />
      <Suspense>
        <HackathonBrowser data={data} postCounts={postCounts} />
      </Suspense>
    </div>
  );
}
