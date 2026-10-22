import { NextResponse } from "next/server";
import { getHackathons } from "@/lib/aggregate";

export const revalidate = 1800;

export async function GET() {
  return NextResponse.json(await getHackathons());
}
