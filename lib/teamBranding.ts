export type TeamBrandType = "college" | "nfl";

export type TeamBrandingEntry = {
  readonly id: string;
  readonly displayName: string;
  readonly shortName: string;
  readonly type: TeamBrandType;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly textColor?: string;
  readonly logoPath?: string;
};

export const TEAM_BRANDING: readonly TeamBrandingEntry[] = [
  {
    id: "uga",
    displayName: "Georgia Bulldogs",
    shortName: "Georgia",
    type: "college",
    primaryColor: "#BA0C2F",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
  },
  {
    id: "uva",
    displayName: "Virginia Cavaliers",
    shortName: "Virginia",
    type: "college",
    primaryColor: "#232D4B",
    secondaryColor: "#E57200",
    textColor: "#FFFFFF",
  },
  {
    id: "ten",
    displayName: "Tennessee Volunteers",
    shortName: "Tennessee",
    type: "college",
    primaryColor: "#FF8200",
    secondaryColor: "#58595B",
    textColor: "#101820",
  },
  {
    id: "mich",
    displayName: "Michigan Wolverines",
    shortName: "Michigan",
    type: "college",
    primaryColor: "#00274C",
    secondaryColor: "#FFCB05",
    textColor: "#FFFFFF",
  },
  {
    id: "vt",
    displayName: "Virginia Tech Hokies",
    shortName: "Virginia Tech",
    type: "college",
    primaryColor: "#861F41",
    secondaryColor: "#E5751F",
    textColor: "#FFFFFF",
  },
  {
    id: "atl",
    displayName: "Atlanta Falcons",
    shortName: "Falcons",
    type: "nfl",
    primaryColor: "#A71930",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
  },
  {
    id: "chi",
    displayName: "Chicago Bears",
    shortName: "Bears",
    type: "nfl",
    primaryColor: "#0B162A",
    secondaryColor: "#C83803",
    textColor: "#FFFFFF",
  },
  {
    id: "was",
    displayName: "Washington Commanders",
    shortName: "Commanders",
    type: "nfl",
    primaryColor: "#5A1414",
    secondaryColor: "#FFB612",
    textColor: "#FFFFFF",
  },
  {
    id: "det",
    displayName: "Detroit Lions",
    shortName: "Lions",
    type: "nfl",
    primaryColor: "#0076B6",
    secondaryColor: "#B0B7BC",
    textColor: "#FFFFFF",
  },
  {
    id: "nyg",
    displayName: "New York Giants",
    shortName: "Giants",
    type: "nfl",
    primaryColor: "#0B2265",
    secondaryColor: "#A71930",
    textColor: "#FFFFFF",
  },
  {
    id: "dal",
    displayName: "Dallas Cowboys",
    shortName: "Cowboys",
    type: "nfl",
    primaryColor: "#003594",
    secondaryColor: "#869397",
    textColor: "#FFFFFF",
  },
  {
    id: "pit",
    displayName: "Pittsburgh Steelers",
    shortName: "Steelers",
    type: "nfl",
    primaryColor: "#FFB612",
    secondaryColor: "#101820",
    textColor: "#101820",
  },
] as const;

export const TEAM_BRANDING_ALIASES: Record<string, TeamBrandingEntry["id"]> = {
  UGA: "uga",
  GEORGIA: "uga",
  "GEORGIA BULLDOGS": "uga",
  UVA: "uva",
  VIRGINIA: "uva",
  "VIRGINIA CAVALIERS": "uva",
  "UVA: HOOS YOUR DADDY": "uva",
  TEN: "ten",
  TENNESSEE: "ten",
  VOLUNTEERS: "ten",
  "TENNESSEE VOLUNTEERS": "ten",
  MICH: "mich",
  MICHIGAN: "mich",
  WOLVERINES: "mich",
  "MICHIGAN WOLVERINES": "mich",
  VT: "vt",
  HOKIES: "vt",
  "VIRGINIA TECH": "vt",
  "VIRGINIA TECH HOKIES": "vt",
  ATL: "atl",
  FALCONS: "atl",
  "ATLANTA FALCONS": "atl",
  CHI: "chi",
  BEARS: "chi",
  "CHICAGO BEARS": "chi",
  WAS: "was",
  COMMANDERS: "was",
  "WASHINGTON COMMANDERS": "was",
  DET: "det",
  LIONS: "det",
  "DETROIT LIONS": "det",
  NYG: "nyg",
  GIANTS: "nyg",
  "NEW YORK GIANTS": "nyg",
  DAL: "dal",
  COWBOYS: "dal",
  "DALLAS COWBOYS": "dal",
  PIT: "pit",
  STEELERS: "pit",
  "PITTSBURGH STEELERS": "pit",
};

export function getTeamBranding(value?: string): TeamBrandingEntry | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim().toUpperCase();
  const teamId = TEAM_BRANDING_ALIASES[normalizedValue];

  return TEAM_BRANDING.find((team) => team.id === teamId);
}

export function getUnknownTeamBrandingValues(
  values: readonly (string | null | undefined)[]
) {
  const unknownValues = new Set<string>();

  values.forEach((value) => {
    if (!value || getTeamBranding(value)) {
      return;
    }

    unknownValues.add(value);
  });

  return [...unknownValues];
}
