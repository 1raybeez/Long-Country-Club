import assert from "node:assert/strict";
import fs from "node:fs";

const snapshot = JSON.parse(fs.readFileSync("data/current/draft-intelligence/2026.json", "utf8"));
const failures = [];
const checks = {
  season: snapshot.season === 2026,
  draftId: snapshot.draftId === "1312148925104259072",
  expected48: snapshot.canonicalDraft.expectedPicks === 48,
  actual48: snapshot.canonicalDraft.actualPicks === 48,
  uniqueSlots: new Set(snapshot.picks.map((pick) => pick.actualOverallPick)).size === 48,
  uniqueOwners: snapshot.canonicalDraft.uniqueOwners === 12,
  allPlayerIdsResolved: snapshot.picks.every((pick) => pick.playerId !== "unknown-player"),
  marketCutoffBlocked: snapshot.marketReference.usableForDraftDayGrading === false,
  noMarketGrades: snapshot.picks.every((pick) => pick.marketClassification === null && pick.pickDifference === null),
  noOpportunityCostWithoutMarket: snapshot.picks.every((pick) => pick.opportunityCost.status === "BLOCKED"),
  noTierClaims: snapshot.tierRuns.status === "BLOCKED",
  noCurrentRosterSubstitution: snapshot.rosterEvidence.currentRosterExcluded === true,
  noRosterImpactClaims: snapshot.teams.every((team) => team.preDraftRoster === null && team.postDraftRoster === null),
  capitalAccounts: snapshot.teams.every((team) => team.capitalContext.selectionsMade === team.pickCount),
  runIntegrity: snapshot.positionRuns.every((run) => run.playerNames.length >= 3),
  provenancePresent: snapshot.picks.every((pick) => Boolean(pick.sourceReference)) && snapshot.canonicalDraft.sourceReference.length > 0,
  blockedStatusExplained: snapshot.status === "BLOCKED" && snapshot.sourceGaps.length >= 4,
};
for (const [name, passed] of Object.entries(checks)) if (!passed) failures.push(name);
assert.equal(failures.length, 0, failures.join(", "));
console.log(JSON.stringify({
  status: snapshot.status,
  checks,
  draftId: snapshot.draftId,
  draftDate: snapshot.draftDate,
  evaluationCutoff: snapshot.evaluationCutoff,
  picks: snapshot.picks.length,
  owners: snapshot.canonicalDraft.uniqueOwners,
  market: snapshot.marketReference,
  positionRuns: snapshot.positionRuns,
  sourceGaps: snapshot.sourceGaps,
}, null, 2));
