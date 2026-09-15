import { NextResponse } from "next/server";
import { loadCurrentWeekSnapshot } from "@/lib/currentWeekSnapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await loadCurrentWeekSnapshot();
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
