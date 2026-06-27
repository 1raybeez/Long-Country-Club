import draftsIndex from '../../data/history/drafts/index.json';
import type { DraftPickRecord, SeasonDraftData } from '../types/draft';

// TODO: Migrate draft history from Sleeper exports and any preserved draft sheets.
const DRAFTS = draftsIndex as readonly SeasonDraftData[];

export function loadAllDrafts(): readonly SeasonDraftData[] {
  return DRAFTS;
}

export function loadDraftBySeason(season: number): SeasonDraftData | null {
  return DRAFTS.find((draft) => draft.season === season) ?? null;
}

export function getDraftPicksByOwner(
  ownerId: string
): readonly DraftPickRecord[] {
  return DRAFTS.flatMap((draft) =>
    draft.picks.filter(
      (pick) => pick.ownerId === ownerId || pick.originalOwnerId === ownerId
    )
  );
}
