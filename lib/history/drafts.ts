import drafts2019 from '../../data/history/drafts/2019/drafts.json';
import drafts2020 from '../../data/history/drafts/2020/drafts.json';
import drafts2021 from '../../data/history/drafts/2021/drafts.json';
import drafts2022 from '../../data/history/drafts/2022/drafts.json';
import drafts2023 from '../../data/history/drafts/2023/drafts.json';
import drafts2024 from '../../data/history/drafts/2024/drafts.json';
import drafts2025 from '../../data/history/drafts/2025/drafts.json';
import drafts2026 from '../../data/history/drafts/2026/drafts.json';
import type { DraftEventData, DraftPickRecord, SeasonDraftData } from '../types/draft';

const DRAFTS = [
  drafts2019,
  drafts2020,
  drafts2021,
  drafts2022,
  drafts2023,
  drafts2024,
  drafts2025,
  drafts2026,
] as readonly SeasonDraftData[];

export function loadAllDrafts(): readonly SeasonDraftData[] {
  return DRAFTS;
}

export function loadDraftBySeason(season: number): SeasonDraftData | null {
  return DRAFTS.find((draft) => draft.season === season) ?? null;
}

export function loadAllDraftEvents(): readonly DraftEventData[] {
  return DRAFTS.flatMap((season) => season.drafts);
}

export function loadDraftEventsBySeason(season: number): readonly DraftEventData[] {
  return loadDraftBySeason(season)?.drafts ?? [];
}

export function getDraftEventById(draftId: string): DraftEventData | null {
  return loadAllDraftEvents().find((draft) => draft.draftId === draftId) ?? null;
}

export function getDraftPicksByOwner(ownerId: string): readonly DraftPickRecord[] {
  return loadAllDraftEvents().flatMap((draft) =>
    draft.picks.filter(
      (pick) =>
        pick.canonicalOwnerId === ownerId ||
        pick.ownerId === ownerId ||
        pick.originalOwnerId === ownerId
    )
  );
}
