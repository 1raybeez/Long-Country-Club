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

export const LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID = {
  Ray: "ray-long",
  Bill: "bill-gross",
  KW: "keith-winder",
  EP: "earl-perkins",
  Rob: "rob-jenkins",
  Jeffrey: "jeffrey-hudgins",
  Ben: "ben-isbell",
  Loren: "loren-michaels",
  Amart: "anthony-martinez",
  "Mike M": "mike-mcburnie",
  "Mike E": "mike-estes",
  Tyrone: "tyrone-poist",
  Dan: "dan-lowery",
  "Dave B": "david-beasley",
  "Dave G": "david-gross",
  "Chris H": "chris-hofstede",
  "Chris M": "chris-morgan",
  "Chris B": "chris-boschen",
  Matt: "matt-hinkle",
  DJ: "dj-king",
  "Mike L": "mike-lastfogel",
  Tommy: "tommy-eckert",
  KD: "keith-douglas",
  JD: "jd-wylie",
  Junior: "junior-duke",
  Jay: "jay-g",
  Bernie: "bernie-stewart",
  BJ: "bj",
} as const satisfies Record<string, string>;

// Compatibility only: current lccOwners.ts still uses shorter IDs for these
// two retired owners. The canonical placement map above follows the history
// source alias requirements.
const LCC_OWNER_ID_COMPATIBILITY_ALIASES: Record<string, string> = {
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

function getLccOwnerIdByPlacementAlias(alias: string): string | undefined {
  return LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID[
    alias as keyof typeof LCC_FINAL_PLACEMENT_ALIAS_TO_OWNER_ID
  ];
}

function normalizeLccOwnerId(ownerId: string): string {
  return LCC_OWNER_ID_COMPATIBILITY_ALIASES[ownerId] ?? ownerId;
}

function getSeasonsByPlace(
  seasons: readonly LccOwnerSeasonPlacement[],
  place: number
) {
  return seasons
    .filter((seasonPlacement) => seasonPlacement.place === place)
    .map(({ season }) => season);
}
