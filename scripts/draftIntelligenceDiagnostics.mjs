import assert from "node:assert/strict";
import fs from "node:fs";

const snapshot = JSON.parse(fs.readFileSync("data/current/draft-intelligence/2026.json", "utf8"));
const failures = [];
const uniquePicks = new Set(snapshot.picks.map((pick) => pick.actualOverallPick));
const acceptedSources = snapshot.marketReference.acceptedSources;
const acceptedSourceIds = new Set(acceptedSources.map((source) => source.sourceId));
const noSuperflexSources = acceptedSources.every((source) => source.explicitOneQB === true && !/superflex|2qb/i.test(source.format));
const opportunityAvailable = snapshot.picks.every((pick, index) => {
  const earlier = new Set(snapshot.picks.slice(0, index).map((candidate) => candidate.playerName.toLowerCase()));
  return pick.opportunityCost.topThreeAvailable.every((candidate) => !earlier.has(candidate.player.toLowerCase()) && (candidate.laterLccPick === null || candidate.laterLccPick > pick.actualOverallPick));
});
const checks = {
  season: snapshot.season === 2026,
  draftId: snapshot.draftId === "1312148925104259072",
  expected48: snapshot.canonicalDraft.expectedPicks === 48,
  actual48: snapshot.canonicalDraft.actualPicks === 48,
  uniqueSelections: uniquePicks.size === 48 && snapshot.picks.length === 48,
  uniqueOwners: snapshot.canonicalDraft.uniqueOwners === 12,
  allPlayerIdsResolved: snapshot.picks.every((pick) => pick.playerId !== "unknown-player"),
  evaluationDateExplicit: snapshot.evaluationDate === "2026-08-25",
  currentRetrospectiveMode: snapshot.evaluationMode === "CURRENT_MARKET_RETROSPECTIVE",
  noHistoricalDraftMutation: snapshot.canonicalDraft.sourceReference === "data/history/drafts/2026/drafts.json" && snapshot.picks.every((pick) => Boolean(pick.sourceReference)),
  sourceProvenanceComplete: acceptedSources.length >= 2 && acceptedSources.every((source) => source.provider && source.url && source.retrievedAt && source.updatedAt && source.coverage),
  oneQBPrimaryMarket: snapshot.marketReference.primaryFormat === "1QB_DYNASTY_NON_TEP" && acceptedSources.every((source) => source.explicitOneQB === true),
  noSuperflexContamination: snapshot.marketReference.superflexContamination === false && noSuperflexSources,
  noFabricatedRankings: snapshot.picks.every((pick) => pick.currentMarketRank !== null || pick.marketSourceCount === 0),
  unrankedExplicit: snapshot.picks.filter((pick) => pick.currentMarketRank === null).every((pick) => pick.marketConfidence === "UNRANKED" && pick.marketClassification === "MARKET UNCERTAIN"),
  roundCoverageReported: [1, 2, 3, 4].every((round) => snapshot.coverage[`round${round}`]?.total === 12),
  nflCapital48: snapshot.picks.every((pick) => Boolean(pick.nflDraftCapital)) && snapshot.nflDraftCapital.coverage.records === 48,
  currentRosterContext: snapshot.rosterEvidence.current.status === "CURRENT_CONTEXT_ONLY" && snapshot.rosterEvidence.current.ownerCount === 12,
  oldMayExcluded: ![...acceptedSourceIds].some((sourceId) => /rotoballer|sports-illustrated|ffn-2026|the-flex-spot|dynastyodds/i.test(sourceId)) && snapshot.marketMovement.comparisonMode === "CURRENT_VS_MAY_EVIDENCE",
  opportunityCostAvailableAtPick: opportunityAvailable,
  awardCandidatesHaveEvidence: Object.values(snapshot.awardCandidates).every((candidate) => Array.isArray(candidate) ? candidate.every((entry) => entry && (entry.playerName || entry.player || entry.ownerId || entry.ownerName)) : true),
  roastHooksHaveFacts: snapshot.roastHooks.length > 0 && snapshot.roastHooks.every((hook) => hook.ownerId && hook.fact && hook.whyItIsFunny && hook.confidence),
  noFinalGrades: snapshot.blockedFields.includes("FINAL_GRADES") && snapshot.status === "CURRENT_MARKET_INTELLIGENCE_READY_NO_FINAL_GRADES",
};
for (const [name, passed] of Object.entries(checks)) if (!passed) failures.push(name);
assert.equal(failures.length, 0, failures.join(", "));
console.log(JSON.stringify({ status: snapshot.status, checks, draftId: snapshot.draftId, actualDraftDate: snapshot.actualDraftDate, evaluationDate: snapshot.evaluationDate, evaluationMode: snapshot.evaluationMode, picks: snapshot.picks.length, owners: snapshot.canonicalDraft.uniqueOwners, coverage: snapshot.coverage, currentRoster: snapshot.rosterEvidence.current, blockedFields: snapshot.blockedFields }, null, 2));
