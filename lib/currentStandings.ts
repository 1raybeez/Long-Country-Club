import { getLeagueRosters, getMatchupsForWeek } from "./sleeper.ts";
import { getLccOwnerBySleeperUserId } from "./lccOwners.ts";
import { LCC_CURRENT_LEAGUE_ID, LCC_CURRENT_SEASON } from "./leagueConstants.ts";

export interface CurrentStanding { readonly franchiseId: string; readonly franchiseName: string; readonly wins: number; readonly losses: number; readonly ties: number; readonly pointsFor: number; }

export async function loadCurrentSeasonStandings(throughWeek: number | null, season = LCC_CURRENT_SEASON): Promise<readonly CurrentStanding[]> {
  if (!throughWeek || throughWeek < 1) return [];
  try {
    const rosters = await getLeagueRosters(LCC_CURRENT_LEAGUE_ID) as readonly { roster_id: number; owner_id: string }[];
    const owners = new Map(rosters.map((roster) => [roster.roster_id, getLccOwnerBySleeperUserId(roster.owner_id)]));
    const totals = new Map<string, { owner: NonNullable<ReturnType<typeof getLccOwnerBySleeperUserId>>; wins: number; losses: number; ties: number; pointsFor: number }>();
    for (let week = 1; week <= throughWeek; week += 1) {
      const rows = await getMatchupsForWeek(week, LCC_CURRENT_LEAGUE_ID) as readonly { matchup_id: number | null; roster_id: number; points?: number | null; custom_points?: number | null }[];
      const grouped = new Map<number, typeof rows[number][]>();
      rows.forEach((row) => { if (typeof row.matchup_id === "number") grouped.set(row.matchup_id, [...(grouped.get(row.matchup_id) ?? []), row]); });
      for (const pair of grouped.values()) {
        if (pair.length !== 2) continue;
        const [a, b] = pair; const ownerA = owners.get(a.roster_id); const ownerB = owners.get(b.roster_id);
        const scoreA = typeof a.custom_points === "number" ? a.custom_points : a.points; const scoreB = typeof b.custom_points === "number" ? b.custom_points : b.points;
        if (!ownerA || !ownerB || typeof scoreA !== "number" || typeof scoreB !== "number") continue;
        for (const [owner, score, opponent] of [[ownerA, scoreA, scoreB], [ownerB, scoreB, scoreA]] as const) {
          const previous = totals.get(owner.id) ?? { owner, wins: 0, losses: 0, ties: 0, pointsFor: 0 };
          totals.set(owner.id, { ...previous, wins: previous.wins + (score > opponent ? 1 : 0), losses: previous.losses + (score < opponent ? 1 : 0), ties: previous.ties + (score === opponent ? 1 : 0), pointsFor: previous.pointsFor + score });
        }
      }
    }
    return [...totals.values()].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor).map(({ owner, wins, losses, ties, pointsFor }) => ({ franchiseId: owner.id, franchiseName: owner.managerPage.sleeperName, wins, losses, ties, pointsFor }));
  } catch { return []; }
}
