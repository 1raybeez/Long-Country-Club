export interface RivalrySummary {
  ownerA: string;
  ownerB: string;

  meetings: number;

  winsA: number;
  winsB: number;
  ties: number;

  pointsA: number;
  pointsB: number;

  playoffMeetings: number;

  firstSeason?: number;
  lastSeason?: number;
}

export function loadAllRivalries(): RivalrySummary[] {
  return [];
}