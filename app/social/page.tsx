import { Suspense } from "react";
import { SocialFeed } from "@/components/SocialFeed";
import { getHackathons } from "@/lib/aggregate";
import { getSocial } from "@/lib/social";

export const revalidate = 1800;

export default async function SocialPage() {
  const { hackathons } = await getHackathons();
  const social = await getSocial(hackathons);
  return (
    <Suspense>
      <SocialFeed data={social} hackathons={hackathons} />
    </Suspense>
  );
}
