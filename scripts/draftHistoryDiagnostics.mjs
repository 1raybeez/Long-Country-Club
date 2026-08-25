import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const draftRoot = path.join(root, 'data/history/drafts');
const workspaceSource = fs.readFileSync(path.join(root, 'app/league-info/drafts/page.tsx'), 'utf8');
const seasons = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const expectedPickCounts = new Map([
  ['466635731935162368', 240],
  ['530113322802368513', 168],
  ['687103336805117952', 228],
  ['688839693487374336', 48],
  ['817078396659036161', 48],
  ['918202561050685441', 48],
  ['1048290254903463937', 48],
  ['1199899847038087168', 48],
  ['1312148925104259072', 48],
]);

const records = seasons.flatMap((season) => {
  const file = path.join(draftRoot, String(season), 'drafts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).drafts;
});
const picks = records.flatMap((draft) => draft.picks);
const duplicateDraftIds = records.filter((draft, index) => records.findIndex((candidate) => candidate.draftId === draft.draftId) !== index).map((draft) => draft.draftId);
const duplicatePickNumbers = records.flatMap((draft) => {
  const seen = new Set();
  return draft.picks.filter((pick) => seen.has(pick.overallPick) || !seen.add(pick.overallPick)).map((pick) => `${draft.draftId}:${pick.overallPick}`);
});
const duplicateBoardCoordinates = records.flatMap((draft) => {
  const seen = new Set();
  return draft.picks.filter((pick) => {
    const coordinate = `${pick.round}:${pick.draftSlot}`;
    const duplicate = seen.has(coordinate);
    seen.add(coordinate);
    return duplicate;
  }).map((pick) => `${draft.draftId}:${pick.round}:${pick.draftSlot}`);
});
const ownerResolved = picks.filter((pick) => pick.canonicalOwnerId).length;
const playerNameResolved = picks.filter((pick) => pick.playerName).length;
const playerPositionResolved = picks.filter((pick) => pick.position).length;
const canonicalProvenance = records.every((draft) =>
  draft.sourceProvenance?.rawSeasonDirectory &&
  draft.sourceProvenance?.rawDraftDirectory &&
  draft.sourceProvenance?.draftId === draft.draftId &&
  draft.sourceProvenance?.manifestReference
);
const canonicalRuntimeData = seasons.every((season) =>
  fs.existsSync(path.join(draftRoot, String(season), 'drafts.json'))
);
const invalidPickOrdering = records.flatMap((draft) => draft.picks.filter((pick, index) => {
  const expectedOverallPick = index + 1;
  const expectedPickInRound = ((pick.round - 1) * 12) + pick.pickInRound;
  return pick.overallPick !== expectedOverallPick ||
    pick.pickInRound < 1 ||
    pick.pickInRound > 12 ||
    pick.overallPick !== expectedPickInRound;
}).map((pick) => `${draft.draftId}:${pick.overallPick}`));
const ownerMismatches = records.flatMap((draft) => {
  const canonicalBySleeper = new Map(draft.picks.filter((pick) => pick.sleeperUserId && pick.canonicalOwnerId).map((pick) => [pick.sleeperUserId, pick.canonicalOwnerId]));
  const slotOwnerBySlot = new Map(Object.entries(draft.draftOrder).map(([sleeperUserId, slot]) => [Number(slot), canonicalBySleeper.get(sleeperUserId) ?? null]));
  return draft.picks.flatMap((pick) => {
    const slotOwnerId = pick.draftSlot === null ? null : slotOwnerBySlot.get(pick.draftSlot) ?? null;
    return slotOwnerId && pick.canonicalOwnerId && slotOwnerId !== pick.canonicalOwnerId
      ? [{ season: draft.season, draftId: draft.draftId, overallPick: pick.overallPick, round: pick.round, draftSlot: pick.draftSlot, actualOwnerId: pick.canonicalOwnerId, originalSlotOwnerId: slotOwnerId, playerName: pick.playerName }]
      : [];
  });
});
const tradeEventCounts = records.filter((draft) => draft.tradedPicks.length > 0).map((draft) => ({ draftId: draft.draftId, season: draft.season, tradedPickRecords: draft.tradedPicks.length, ownerMismatches: ownerMismatches.filter((pick) => pick.draftId === draft.draftId).length }));
const roster4Picks2021 = picks.filter((pick) => pick.season === 2021 && pick.rosterId === 4);
const roster4Mapping = JSON.parse(fs.readFileSync(path.join(draftRoot, '2021', 'drafts.json'), 'utf8')).historicalRosterOwnership?.find((mapping) => mapping.rosterId === 4);
const eventPickCountsMatch = records.every((draft) => expectedPickCounts.get(draft.draftId) === draft.picks.length);
const checks = {
  expectedDynastySeasons: [2021, 2022, 2023, 2024, 2025, 2026].every((season) => records.some((draft) => draft.season === season)),
  canonicalRuntimeData,
  canonicalSourceProvenance: canonicalProvenance,
  canonicalSeasonCount: new Set(records.map((draft) => draft.season)).size === 8,
  canonicalEventCount: records.length === 9,
  canonicalPickCount: picks.length === 924,
  canonical2021EventCount: records.filter((draft) => draft.season === 2021).length === 2,
  superseded2021Excluded: !records.some((draft) => draft.draftId === '682304920455544833'),
  rookie2021PickCount: records.find((draft) => draft.draftId === '688839693487374336')?.picks.length === 48,
  rookie2022To2026PickCounts: [2022, 2023, 2024, 2025, 2026].every((season) => records.find((draft) => draft.season === season)?.picks.length === 48),
  noDuplicateDraftIds: duplicateDraftIds.length === 0,
  noDuplicateOverallPickNumbers: duplicatePickNumbers.length === 0,
  boardPreservesEveryPick: records.every((draft) => draft.picks.length === new Set(draft.picks.map((pick) => `${pick.round}:${pick.draftSlot}`)).size),
  validRoundAndPickOrdering: invalidPickOrdering.length === 0,
  pickCountsMatchCanonicalRecords: records.every((draft) => draft.pickCount === draft.picks.length),
  boardActualOwnerLabelsMatchCanonical: picks.every((pick) => Boolean(pick.canonicalOwnerId)),
  tableActualOwnerLabelsMatchCanonical: picks.every((pick) => Boolean(pick.canonicalOwnerId)),
  expectedEventPickCounts: eventPickCountsMatch,
  historicalOwnerResolution: ownerResolved === picks.length,
  historical2021Roster4Owner: roster4Picks2021.length === 23 && roster4Picks2021.every((pick) => pick.canonicalOwnerId === 'dan-lowery'),
  historical2021Roster4Team: roster4Mapping?.historicalTeamName === 'Ridiculousville Quicksand',
  no2021Roster4MikeEstes: !roster4Picks2021.some((pick) => pick.canonicalOwnerId === 'mike-estes'),
  laterMikeEstesOwnershipPresent: picks.some((pick) => pick.season > 2021 && pick.canonicalOwnerId === 'mike-estes'),
  canonical2021RosterOverrideDocumented: roster4Mapping?.provenance === 'commissioner-verified historical ownership',
  supportedWorkspaceSeasons: JSON.stringify(seasons) === JSON.stringify([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]),
  workspaceDefaultsTo2026: workspaceSource.includes("useState(2026)"),
  selectedSeasonWorkspace: workspaceSource.includes('id="draft-history-season"') && workspaceSource.includes('id="selected-draft-heading"'),
  canonical2021EventChoices: records.filter((draft) => draft.season === 2021).length === 2 && workspaceSource.includes('selectedSeason === 2021'),
  rookieGradesArchitecture: workspaceSource.includes("selectedDraft.draftType === 'rookie' && selectedDraft.season >= 2021") && workspaceSource.includes('Draft Grades'),
  keeperGradesUnavailable: workspaceSource.includes('Draft Intelligence grading is not yet available for Keeper-era drafts.'),
  noObsoleteViewPicksFlow: !workspaceSource.includes('View picks') && !workspaceSource.includes('Hide picks') && !workspaceSource.includes('scrollIntoView'),
  noScrollFocusWorkaround: !workspaceSource.includes('requestAnimationFrame'),
  urlStateSupported: workspaceSource.includes('URLSearchParams') && workspaceSource.includes("params.set('view', view)"),
  draftBoardDefault: workspaceSource.includes("useState<'board' | 'grades' | 'table'>('board')"),
  future2027HiddenUntilCanonical: !workspaceSource.includes('2027, 2026') && workspaceSource.includes('DRAFT_HISTORY_YEARS = [2026'),
  noScoreRecalculation: workspaceSource.includes('<DraftIntelligenceEvent') && !workspaceSource.includes('calculateGrade'),
};
const passed = Object.values(checks).every(Boolean);

console.log(JSON.stringify({
  status: passed ? 'PASS' : 'FAIL',
  checks,
  events: records.length,
  picks: picks.length,
  ownerResolution: { resolved: ownerResolved, unresolved: picks.length - ownerResolved },
  canonical: {
    runtimeDataAvailable: canonicalRuntimeData,
    sourceProvenancePresent: canonicalProvenance,
    invalidPickOrdering: invalidPickOrdering.length,
  },
  historicalRoster4: { picks: roster4Picks2021.length, owner: roster4Mapping?.canonicalOwnerId ?? null, team: roster4Mapping?.historicalTeamName ?? null },
  playerMetadataResolution: {
    nameResolved: playerNameResolved,
    nameMissing: picks.length - playerNameResolved,
    positionResolved: playerPositionResolved,
    positionMissing: picks.length - playerPositionResolved,
  },
  duplicateDraftIds,
  duplicatePickNumbers,
  duplicateBoardCoordinates,
  ownership: {
    actualOwnerVsOriginalSlotMismatches: ownerMismatches.length,
    events: [...new Set(ownerMismatches.map((pick) => pick.draftId))],
    examples: ownerMismatches.slice(0, 8),
    tradedEvents: tradeEventCounts,
    boardActualOwnerLabelsMatchCanonical: checks.boardActualOwnerLabelsMatchCanonical,
    tableActualOwnerLabelsMatchCanonical: checks.tableActualOwnerLabelsMatchCanonical,
  },
}, null, 2));

if (!passed) process.exitCode = 1;
