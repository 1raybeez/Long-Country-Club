import { ACTIVE_LCC_OWNERS } from "../lccOwners";
import { getFuturePickInventory, getFuturePickYears } from "../history/futurePicks";
import type { FuturePickAsset } from "../types/futurePick";

export type WarRoomDraftCapital = {
  readonly ownerId: string;
  readonly supportedSeasons: readonly number[];
  readonly draftRounds: number;
  readonly standardAnnualAllocation: number;
  readonly picks: readonly FuturePickAsset[];
  readonly acquiredPicks: readonly FuturePickAsset[];
  readonly originalPicksTradedAway: readonly FuturePickAsset[];
  readonly picksBySeason: Readonly<Record<string, number>>;
  readonly picksByRound: Readonly<Record<number, number>>;
};

export function getWarRoomDraftCapital(
  ownerId: string,
): WarRoomDraftCapital | null {
  const inventory = getFuturePickInventory();

  if (!inventory.assets.length || !getFuturePickYears().length) {
    return null;
  }

  const picks = inventory.assets
    .filter((asset) => asset.currentOwnerId === ownerId)
    .sort(comparePicks);
  const originalPicksTradedAway = inventory.assets
    .filter(
      (asset) =>
        asset.originalOwnerId === ownerId && asset.currentOwnerId !== ownerId,
    )
    .sort(comparePicks);

  return {
    ownerId,
    supportedSeasons: getFuturePickYears(),
    draftRounds: inventory.rookieDraftRounds,
    standardAnnualAllocation: inventory.rookieDraftRounds,
    picks,
    acquiredPicks: picks.filter(
      (asset) => asset.originalOwnerId !== asset.currentOwnerId,
    ),
    originalPicksTradedAway,
    picksBySeason: Object.fromEntries(
      getFuturePickYears().map((season) => [
        String(season),
        picks.filter((asset) => asset.season === season).length,
      ]),
    ),
    picksByRound: Object.fromEntries(
      Array.from({ length: inventory.rookieDraftRounds }, (_, index) => {
        const round = index + 1;
        return [round, picks.filter((asset) => asset.round === round).length];
      }),
    ),
  };
}

export function getWarRoomDraftCapitalCoverage() {
  const inventory = getFuturePickInventory();
  const activeOwnerIds = ACTIVE_LCC_OWNERS.map((owner) => owner.id);
  const results = activeOwnerIds.map((ownerId) => ({
    ownerId,
    capital: getWarRoomDraftCapital(ownerId),
  }));

  return {
    inventory,
    activeOwnerIds,
    results,
    ownersWithResults: results
      .filter(({ capital }) => capital !== null)
      .map(({ ownerId }) => ownerId),
    missingOwnerResults: results
      .filter(({ capital }) => capital === null)
      .map(({ ownerId }) => ownerId),
  };
}

function comparePicks(a: FuturePickAsset, b: FuturePickAsset) {
  return (
    a.season - b.season ||
    a.round - b.round ||
    a.originalTeamName.localeCompare(b.originalTeamName) ||
    a.id.localeCompare(b.id)
  );
}
