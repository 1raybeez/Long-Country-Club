import { resolveOwnerId } from "./ownerRegistry";

export type LccFinalPlacementEra = "two-keeper" | "dynasty";

export interface LccFinalPlacementSeason {
  readonly season: number;
  readonly era: LccFinalPlacementEra;
  readonly placements: readonly string[];
}

export interface LccOwnerSeasonPlacement {
  readonly season: number;
  readonly era: LccFinalPlacementEra;
  readonly place: number;
  readonly alias: string;
  readonly ownerId: string;
}

export interface LccFinalPlacementTenureSpan {
  readonly startSeason: number;
  readonly endSeason: number;
}

export interface LccOwnerPlacementSummary {
  readonly ownerId: string;
  readonly activeSeasonCount: number;
  readonly seasons: readonly LccOwnerSeasonPlacement[];
  readonly tenureSpans: readonly LccFinalPlacementTenureSpan[];
  readonly championships: readonly number[];
  readonly runnerUpFinishes: readonly number[];
  readonly thirdPlaceFinishes: readonly number[];
  readonly podiumFinishes: readonly number[];
  readonly playoffAppearances: readonly number[];
  readonly bestFinish?: number;
  readonly worstFinish?: number;
  readonly averageFinish?: number;
}

export interface LccOwnerCareerSummary extends LccOwnerPlacementSummary {
  readonly titleCount: number;
  readonly podiumCount: number;
  readonly toiletBowlCount: number;
}

export interface LccSeasonChampion {
  readonly season: number;
  readonly era: LccFinalPlacementEra;
  readonly alias: string;
  readonly ownerId?: string;
}

export interface LccChampionshipGalleryEntry {
  readonly season: number;
  readonly era: LccFinalPlacementEra;
  readonly championAlias: string;
  readonly championOwnerId?: string;
  readonly runnerUpAlias?: string;
  readonly runnerUpOwnerId?: string;
  readonly thirdPlaceAlias?: string;
  readonly thirdPlaceOwnerId?: string;
  readonly toiletBowlAlias?: string;
  readonly toiletBowlOwnerId?: string;
  readonly placementCount: number;
}

export interface LccOwnerPodiumTotals {
  readonly ownerId?: string;
  readonly primaryAlias: string;
  readonly gold: number;
  readonly silver: number;
  readonly bronze: number;
  readonly total: number;
  readonly seasons: {
    readonly gold: readonly number[];
    readonly silver: readonly number[];
    readonly bronze: readonly number[];
  };
}

export interface LccOwnerToiletBowlTotals {
  readonly ownerId?: string;
  readonly primaryAlias: string;
  readonly total: number;
  readonly seasons: readonly number[];
}

// Compatibility only: current lccOwners.ts still uses shorter IDs for these
// two retired owners. Final-placement outputs keep the historical IDs used
// before the shared registry existed.
const LCC_FINAL_PLACEMENT_OWNER_ID_COMPATIBILITY_ALIASES: Record<
  string,
  string
> = {
  junior: "junior-duke",
  jay: "jay-g",
};

export const LCC_FINAL_PLACEMENTS = [
  {
    season: 2003,
    era: "two-keeper",
    placements: [
      "Bill",
      "Ray",
      "KW",
      "JD",
      "KD",
      "Chris B",
      "Jay",
      "Bernie",
      "BJ",
      "Junior",
    ],
  },
  {
    season: 2004,
    era: "two-keeper",
    placements: [
      "Rob",
      "KW",
      "Tyrone",
      "EP",
      "JD",
      "Tommy",
      "KD",
      "Ray",
      "Bill",
      "Chris H",
    ],
  },
  {
    season: 2005,
    era: "two-keeper",
    placements: [
      "Bill",
      "Rob",
      "Chris H",
      "Tyrone",
      "Tommy",
      "JD",
      "KD",
      "EP",
      "KW",
      "Ray",
    ],
  },
  {
    season: 2006,
    era: "two-keeper",
    placements: [
      "Bill",
      "KD",
      "EP",
      "Tommy",
      "JD",
      "Ray",
      "KW",
      "Chris H",
      "Mike L",
      "Rob",
    ],
  },
  {
    season: 2007,
    era: "two-keeper",
    placements: [
      "Ray",
      "Chris H",
      "JD",
      "EP",
      "Jeffrey",
      "Rob",
      "Bill",
      "KD",
      "KW",
      "Dave G",
    ],
  },
  {
    season: 2008,
    era: "two-keeper",
    placements: [
      "Chris H",
      "Ray",
      "Dave G",
      "EP",
      "Jeffrey",
      "KD",
      "Ben",
      "Bill",
      "KW",
      "Rob",
    ],
  },
  {
    season: 2009,
    era: "two-keeper",
    placements: [
      "Ben",
      "Rob",
      "Ray",
      "DJ",
      "Jeffrey",
      "KW",
      "EP",
      "Bill",
      "Dave G",
      "Chris H",
    ],
  },
  {
    season: 2010,
    era: "two-keeper",
    placements: [
      "DJ",
      "Ben",
      "Rob",
      "Bill",
      "Ray",
      "Dave G",
      "Chris H",
      "EP",
      "Jeffrey",
      "KW",
    ],
  },
  {
    season: 2011,
    era: "two-keeper",
    placements: [
      "Ben",
      "Loren",
      "Matt",
      "Ray",
      "Dave G",
      "Bill",
      "Jeffrey",
      "EP",
      "Dan",
      "KW",
    ],
  },
  {
    season: 2012,
    era: "two-keeper",
    placements: [
      "Dan",
      "Matt",
      "Dave B",
      "EP",
      "Loren",
      "Ray",
      "Dave G",
      "Jeffrey",
      "KW",
      "Ben",
      "Chris M",
      "Bill",
    ],
  },
  {
    season: 2013,
    era: "two-keeper",
    placements: [
      "Dan",
      "Jeffrey",
      "Bill",
      "KW",
      "Dave B",
      "Ray",
      "EP",
      "Loren",
      "Rob",
      "Matt",
      "Ben",
      "Dave G",
    ],
  },
  {
    season: 2014,
    era: "two-keeper",
    placements: [
      "Rob",
      "Ray",
      "Matt",
      "Jeffrey",
      "Tyrone",
      "Loren",
      "EP",
      "Bill",
      "Ben",
      "Dave B",
      "KW",
      "Dan",
    ],
  },
  {
    season: 2015,
    era: "two-keeper",
    placements: [
      "Tyrone",
      "Ben",
      "Rob",
      "Bill",
      "Loren",
      "EP",
      "KW",
      "Ray",
      "Matt",
      "Dan",
      "Dave B",
      "Jeffrey",
    ],
  },
  {
    season: 2016,
    era: "two-keeper",
    placements: [
      "Ben",
      "Tyrone",
      "Matt",
      "Rob",
      "Loren",
      "Bill",
      "Dave B",
      "Ray",
      "Dan",
      "KW",
      "Jeffrey",
      "EP",
    ],
  },
  {
    season: 2017,
    era: "two-keeper",
    placements: [
      "Dan",
      "Rob",
      "KW",
      "Tyrone",
      "Ben",
      "Jeffrey",
      "Chris H",
      "EP",
      "Matt",
      "Ray",
      "Loren",
      "Bill",
    ],
  },
  {
    season: 2018,
    era: "two-keeper",
    placements: [
      "Bill",
      "Jeffrey",
      "EP",
      "Ben",
      "Mike M",
      "Tyrone",
      "Ray",
      "Matt",
      "Rob",
      "Dan",
      "Loren",
      "KW",
    ],
  },
  {
    season: 2019,
    era: "two-keeper",
    placements: [
      "Mike M",
      "Jeffrey",
      "Rob",
      "Ben",
      "Tyrone",
      "Dan",
      "Ray",
      "EP",
      "Bill",
      "KW",
      "Matt",
      "Loren",
    ],
  },
  {
    season: 2020,
    era: "two-keeper",
    placements: [
      "KW",
      "EP",
      "Rob",
      "Amart",
      "Jeffrey",
      "Dan",
      "Ray",
      "Tyrone",
      "Mike M",
      "Bill",
      "Ben",
      "Loren",
    ],
  },
  {
    season: 2021,
    era: "dynasty",
    placements: [
      "Loren",
      "Rob",
      "Amart",
      "EP",
      "Jeffrey",
      "Ben",
      "Bill",
      "KW",
      "Ray",
      "Dan",
      "Tyrone",
      "Mike M",
    ],
  },
  {
    season: 2022,
    era: "dynasty",
    placements: [
      "EP",
      "Ben",
      "KW",
      "Amart",
      "Rob",
      "Bill",
      "Jeffrey",
      "Loren",
      "Mike E",
      "Mike M",
      "Ray",
      "Tyrone",
    ],
  },
  {
    season: 2023,
    era: "dynasty",
    placements: [
      "Mike M",
      "Loren",
      "Jeffrey",
      "Ben",
      "KW",
      "EP",
      "Tyrone",
      "Rob",
      "Bill",
      "Amart",
      "Mike E",
      "Ray",
    ],
  },
  {
    season: 2024,
    era: "dynasty",
    placements: [
      "Jeffrey",
      "Ben",
      "Mike E",
      "Amart",
      "Loren",
      "Tyrone",
      "Bill",
      "Ray",
      "KW",
      "EP",
      "Mike M",
      "Rob",
    ],
  },
  {
    season: 2025,
    era: "dynasty",
    placements: [
      "Tyrone",
      "Mike M",
      "Ben",
      "Ray",
      "Rob",
      "Jeffrey",
      "Amart",
      "Bill",
      "EP",
      "KW",
      "Loren",
      "Mike E",
    ],
  },
] as const satisfies readonly LccFinalPlacementSeason[];

export const LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID =
  createFinalPlacementAliasMap();

export const LCC_FINAL_PLACEMENT_SEASONS = LCC_FINAL_PLACEMENTS.map(
  ({ season }) => season
);

export const LCC_LATEST_COMPLETED_FINAL_PLACEMENT_SEASON =
  LCC_FINAL_PLACEMENT_SEASONS.at(-1);

export const LCC_SLEEPER_MIGRATION_SEASON = 2019;

export const LCC_UNRESOLVED_FINAL_PLACEMENT_ALIASES = Array.from(
  new Set(
    LCC_FINAL_PLACEMENTS.flatMap(({ placements }) =>
      placements.filter((alias) => !getLccOwnerIdByPlacementAlias(alias))
    )
  )
);

export function getLccPlacementsBySeason(
  season: number
): LccFinalPlacementSeason | undefined {
  return LCC_FINAL_PLACEMENTS.find((entry) => entry.season === season);
}

export function getLccOwnerSeasons(
  ownerId: string
): readonly LccOwnerSeasonPlacement[] {
  const normalizedOwnerId = normalizeLccOwnerId(ownerId);

  return LCC_FINAL_PLACEMENTS.flatMap((entry) =>
    entry.placements.flatMap((alias, index) => {
      const placementOwnerId = getLccOwnerIdByPlacementAlias(alias);

      if (placementOwnerId !== normalizedOwnerId) {
        return [];
      }

      return [
        {
          season: entry.season,
          era: entry.era,
          place: index + 1,
          alias,
          ownerId: placementOwnerId,
        },
      ];
    })
  );
}

export function getLccOwnerTenureSpans(
  ownerId: string
): readonly LccFinalPlacementTenureSpan[] {
  const seasons = getLccOwnerSeasons(ownerId).map(({ season }) => season);

  return seasons.reduce<LccFinalPlacementTenureSpan[]>((spans, season) => {
    const previousSpan = spans.at(-1);

    if (!previousSpan || previousSpan.endSeason + 1 !== season) {
      spans.push({ startSeason: season, endSeason: season });
      return spans;
    }

    spans[spans.length - 1] = {
      ...previousSpan,
      endSeason: season,
    };

    return spans;
  }, []);
}

export function getLccOwnerPlacementSummary(
  ownerId: string
): LccOwnerPlacementSummary {
  const normalizedOwnerId = normalizeLccOwnerId(ownerId);
  const seasons = getLccOwnerSeasons(normalizedOwnerId);
  const places = seasons.map(({ place }) => place);
  const championships = getSeasonsByPlace(seasons, 1);
  const runnerUpFinishes = getSeasonsByPlace(seasons, 2);
  const thirdPlaceFinishes = getSeasonsByPlace(seasons, 3);
  const podiumFinishes = seasons
    .filter(({ place }) => place <= 3)
    .map(({ season }) => season);
  const playoffAppearances = seasons
    .filter(({ place }) => place <= 6)
    .map(({ season }) => season);

  return {
    ownerId: normalizedOwnerId,
    activeSeasonCount: seasons.length,
    seasons,
    tenureSpans: getLccOwnerTenureSpans(normalizedOwnerId),
    championships,
    runnerUpFinishes,
    thirdPlaceFinishes,
    podiumFinishes,
    playoffAppearances,
    bestFinish: places.length ? Math.min(...places) : undefined,
    worstFinish: places.length ? Math.max(...places) : undefined,
    averageFinish: places.length
      ? Number(
          (places.reduce((total, place) => total + place, 0) / places.length).toFixed(2)
        )
      : undefined,
  };
}

export function getLccOwnerTitleCount(ownerId: string) {
  return getLccOwnerPlacementSummary(ownerId).championships.length;
}

export function getLccOwnerPodiumCount(ownerId: string) {
  return getLccOwnerPlacementSummary(ownerId).podiumFinishes.length;
}

export function getLccOwnerToiletBowlCount(ownerId: string) {
  const normalizedOwnerId = normalizeLccOwnerId(ownerId);

  return LCC_FINAL_PLACEMENTS.filter((entry) => {
    const finalAlias = entry.placements.at(-1);

    if (!finalAlias) {
      return false;
    }

    return getLccOwnerIdByPlacementAlias(finalAlias) === normalizedOwnerId;
  }).length;
}

export function getLccOwnerBestFinish(ownerId: string) {
  return getLccOwnerPlacementSummary(ownerId).bestFinish;
}

export function getLccOwnerCareerSummary(
  ownerId: string
): LccOwnerCareerSummary {
  const placementSummary = getLccOwnerPlacementSummary(ownerId);

  return {
    ...placementSummary,
    titleCount: placementSummary.championships.length,
    podiumCount: placementSummary.podiumFinishes.length,
    toiletBowlCount: getLccOwnerToiletBowlCount(ownerId),
  };
}

export function getLccChampionBySeason(
  season: number
): LccSeasonChampion | undefined {
  const seasonPlacements = getLccPlacementsBySeason(season);
  const championAlias = seasonPlacements?.placements[0];

  if (!seasonPlacements || !championAlias) {
    return undefined;
  }

  return {
    season,
    era: seasonPlacements.era,
    alias: championAlias,
    ownerId: getLccOwnerIdByPlacementAlias(championAlias),
  };
}

export function getLccChampionsBySeason(): readonly LccSeasonChampion[] {
  return LCC_FINAL_PLACEMENTS.flatMap(({ season }) => {
    const champion = getLccChampionBySeason(season);

    return champion ? [champion] : [];
  });
}

export function getLccChampionshipGalleryBySeason(): readonly LccChampionshipGalleryEntry[] {
  return LCC_FINAL_PLACEMENTS.flatMap((entry) => {
    const [championAlias, runnerUpAlias, thirdPlaceAlias] = entry.placements;

    if (!championAlias) {
      return [];
    }

    const toiletBowlAlias = entry.placements.at(-1);

    return [
      {
        season: entry.season,
        era: entry.era,
        championAlias,
        championOwnerId: getLccOwnerIdByPlacementAlias(championAlias),
        runnerUpAlias,
        runnerUpOwnerId: runnerUpAlias
          ? getLccOwnerIdByPlacementAlias(runnerUpAlias)
          : undefined,
        thirdPlaceAlias,
        thirdPlaceOwnerId: thirdPlaceAlias
          ? getLccOwnerIdByPlacementAlias(thirdPlaceAlias)
          : undefined,
        toiletBowlAlias,
        toiletBowlOwnerId: toiletBowlAlias
          ? getLccOwnerIdByPlacementAlias(toiletBowlAlias)
          : undefined,
        placementCount: entry.placements.length,
      },
    ];
  });
}

export function getLccPodiumTotalsByOwner(): readonly LccOwnerPodiumTotals[] {
  const totals = new Map<string, MutableLccOwnerPodiumTotals>();

  LCC_FINAL_PLACEMENTS.forEach((entry) => {
    entry.placements.slice(0, 3).forEach((alias, index) => {
      const medal = LCC_PODIUM_MEDALS[index];

      if (!medal) {
        return;
      }

      const ownerId = getLccOwnerIdByPlacementAlias(alias);
      const key = ownerId ?? alias;
      const current =
        totals.get(key) ??
        ({
          ownerId,
          primaryAlias: alias,
          gold: 0,
          silver: 0,
          bronze: 0,
          seasons: {
            gold: [],
            silver: [],
            bronze: [],
          },
        } satisfies MutableLccOwnerPodiumTotals);

      current[medal] += 1;
      current.seasons[medal].push(entry.season);
      totals.set(key, current);
    });
  });

  return Array.from(totals.values())
    .map((entry) => ({
      ownerId: entry.ownerId,
      primaryAlias: entry.primaryAlias,
      gold: entry.gold,
      silver: entry.silver,
      bronze: entry.bronze,
      total: entry.gold + entry.silver + entry.bronze,
      seasons: {
        gold: sortSeasonsDescending(entry.seasons.gold),
        silver: sortSeasonsDescending(entry.seasons.silver),
        bronze: sortSeasonsDescending(entry.seasons.bronze),
      },
    }))
    .sort(sortPodiumTotals);
}

export function getLccToiletBowlTotalsByOwner(): readonly LccOwnerToiletBowlTotals[] {
  const totals = new Map<string, MutableLccOwnerToiletBowlTotals>();

  LCC_FINAL_PLACEMENTS.forEach((entry) => {
    const alias = entry.placements.at(-1);

    if (!alias) {
      return;
    }

    const ownerId = getLccOwnerIdByPlacementAlias(alias);
    const key = ownerId ?? alias;
    const current =
      totals.get(key) ??
      ({
        ownerId,
        primaryAlias: alias,
        total: 0,
        seasons: [],
      } satisfies MutableLccOwnerToiletBowlTotals);

    current.total += 1;
    current.seasons.push(entry.season);
    totals.set(key, current);
  });

  return Array.from(totals.values())
    .map((entry) => ({
      ownerId: entry.ownerId,
      primaryAlias: entry.primaryAlias,
      total: entry.total,
      seasons: sortSeasonsDescending(entry.seasons),
    }))
    .sort(sortToiletBowlTotals);
}

const LCC_PODIUM_MEDALS = ["gold", "silver", "bronze"] as const;

type LccPodiumMedal = (typeof LCC_PODIUM_MEDALS)[number];

type MutableLccOwnerPodiumTotals = {
  ownerId?: string;
  primaryAlias: string;
  gold: number;
  silver: number;
  bronze: number;
  seasons: Record<LccPodiumMedal, number[]>;
};

type MutableLccOwnerToiletBowlTotals = {
  ownerId?: string;
  primaryAlias: string;
  total: number;
  seasons: number[];
};

function getLccOwnerIdByPlacementAlias(alias: string): string | undefined {
  const ownerId = resolveOwnerId(alias);

  return ownerId ? normalizeLccOwnerId(ownerId) : undefined;
}

function normalizeLccOwnerId(ownerId: string): string {
  return LCC_FINAL_PLACEMENT_OWNER_ID_COMPATIBILITY_ALIASES[ownerId] ?? ownerId;
}

function createFinalPlacementAliasMap(): Record<string, string> {
  return Object.fromEntries(
    Array.from(
      new Set(LCC_FINAL_PLACEMENTS.flatMap(({ placements }) => placements))
    ).flatMap((alias) => {
      const ownerId = getLccOwnerIdByPlacementAlias(alias);

      return ownerId ? [[alias, ownerId]] : [];
    })
  );
}

function getSeasonsByPlace(
  seasons: readonly LccOwnerSeasonPlacement[],
  place: number
) {
  return seasons
    .filter((seasonPlacement) => seasonPlacement.place === place)
    .map(({ season }) => season);
}

function sortSeasonsDescending(seasons: readonly number[]) {
  return [...seasons].sort((a, b) => b - a);
}

function sortPodiumTotals(
  left: LccOwnerPodiumTotals,
  right: LccOwnerPodiumTotals
) {
  return (
    right.gold - left.gold ||
    right.silver - left.silver ||
    right.bronze - left.bronze ||
    right.total - left.total ||
    left.primaryAlias.localeCompare(right.primaryAlias)
  );
}

function sortToiletBowlTotals(
  left: LccOwnerToiletBowlTotals,
  right: LccOwnerToiletBowlTotals
) {
  return (
    right.total - left.total ||
    (right.seasons[0] ?? 0) - (left.seasons[0] ?? 0) ||
    left.primaryAlias.localeCompare(right.primaryAlias)
  );
}
