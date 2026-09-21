import { NextResponse } from "next/server";
import { loadNflScoreboard } from "@/lib/nflScoreboard";
import { getCurrentMemberSession } from "@/lib/auth/session";
import { getLccOwnerById } from "@/lib/lccOwners";

export const dynamic = "force-dynamic";

export async function GET() {
  // The route intentionally does not cache the combined live scoreboard.
  const session = await getCurrentMemberSession();
  const favoriteTeam = session?.member?.ownerId ? getLccOwnerById(session.member.ownerId)?.almanacProfile?.favoriteNFLTeam?.trim().toUpperCase() ?? null : null;
  return NextResponse.json(await loadNflScoreboard(favoriteTeam), { headers: { "Cache-Control": "no-store, max-age=0" } });
}
