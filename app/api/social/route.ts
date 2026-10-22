import { NextResponse } from "next/server";
import { getSocial } from "@/lib/social";

export const revalidate = 1800;

export async function GET() {
  return NextResponse.json(await getSocial());
}
