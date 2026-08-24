import {
  buildPreseasonSnapshotCandidate,
  getPreseasonTeamStrengthForecasts,
  loadPredictorTeamInputs,
  getRookieMarketAdapter,
  PREDICTOR_ROOKIE_MARKET_PLAYERS,
  PREDICTOR_ROOKIE_MARKET_SOURCE,
  validatePredictorSnapshotCandidate,
  validatePredictorApprovedSnapshot,
  getApprovedPreseasonTeamStrengthForecasts,
  PREDICTOR_APPROVED_SNAPSHOT_PATH,
  type PredictorApprovedSnapshot,
} from "../lib/predictor";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BEFORE = [
  ["ben-isbell", 83.91, 90.91, 63.64, 75.45, "CONTENDER", "MEDIUM", "21/24"],
  ["tyrone-poist", 76.29, 100, 0, 62.88, "CONTENDER", "HIGH", "18/18"],
  ["mike-mcburnie", 69.53, 81.82, 27.27, 68.03, "CONTENDER", "HIGH", "18/20"],
  ["rob-jenkins", 61.97, 54.55, 90.91, 56.06, "STRONG", "HIGH", "18/20"],
  ["anthony-martinez", 59.46, 72.73, 18.18, 49.09, "STRONG", "HIGH", "19/19"],
  ["earl-perkins", 49.26, 63.64, 9.09, 28.94, "STRONG", "HIGH", "18/19"],
  ["ray-long", 45.65, 36.36, 72.73, 56.52, "MIDDLE", "MEDIUM", "22/27"],
  ["jeffrey-hudgins", 44.84, 45.45, 45.45, 39.39, "MIDDLE", "MEDIUM", "18/22"],
  ["bill-gross", 44.48, 27.27, 100, 53.94, "MIDDLE", "MEDIUM", "21/25"],
  ["keith-winder", 33.44, 18.18, 81.82, 43.48, "QUESTION MARK", "MEDIUM", "19/23"],
  ["loren-michaels", 15.91, 9.09, 36.36, 22.73, "QUESTION MARK", "HIGH", "17/19"],
  ["mike-estes", 14.43, 0, 54.55, 35.15, "QUESTION MARK", "HIGH", "16/17"],
] as const;
type BeforeRow = {
  score: number;
  lineup: number;
  depth: number;
  balance: number;
  tier: string;
  confidence: string;
  coverage: string;
};
const beforeByOwner = new Map<string, BeforeRow>(BEFORE.map(([ownerId, score, lineup, depth, balance, tier, confidence, coverage]) => [ownerId, { score, lineup, depth, balance, tier, confidence, coverage }]));

const generatedAt = "2026-08-23T00:00:00.000Z";
const snapshot = buildPreseasonSnapshotCandidate({ generatedAt });
const forecasts = getPreseasonTeamStrengthForecasts();
const rerun = getPreseasonTeamStrengthForecasts();
const failures: string[] = [];

if (forecasts.length !== 12) failures.push("TEAM_COUNT");
if (new Set(forecasts.map((team) => team.ownerId)).size !== 12) failures.push("OWNER_UNIQUENESS");
if (new Set(forecasts.map((team) => team.teamName)).size !== 12) failures.push("FRANCHISE_UNIQUENESS");
if (JSON.stringify(forecasts) !== JSON.stringify(rerun)) failures.push("NON_DETERMINISTIC_OUTPUT");
const snapshotErrors = validatePredictorSnapshotCandidate(snapshot);
if (snapshotErrors.length) failures.push(...snapshotErrors);
if (forecasts.some((team) => !Number.isFinite(team.teamStrengthScore) || team.teamStrengthScore < 0 || team.teamStrengthScore > 100)) failures.push("SCORE_RANGE");
if (forecasts.some((team) => [team.lineupStrengthScore, team.depthStrengthScore, team.balanceScore].some((score) => !Number.isFinite(score) || score < 0 || score > 100))) failures.push("COMPONENT_RANGE");
if (forecasts.some((team) => team.positionStrengths.some((position) => position.relativeIndex !== null && (position.relativeIndex < 0 || position.relativeIndex > 100)))) failures.push("POSITION_RANGE");
if (forecasts.some((team) => team.expectedLineupCoverage.resolvedSlots > team.expectedLineupCoverage.totalSlots)) failures.push("LINEUP_COVERAGE");
if (forecasts.some((team, index) => team.forecastOrder !== index + 1)) failures.push("RANK_ORDER");
if (forecasts.some((team) => team.usableDepthCoverage.usableDepthCount > 6)) failures.push("DEPTH_LIMIT");
if (forecasts.some((team) => String(team.tier) === "MIDDLE")) failures.push("STALE_MIDDLE_TIER");
if (forecasts.some((team) => team.teamStrengthScore !== Math.round((team.lineupStrengthScore * 0.7 + team.depthStrengthScore * 0.2 + team.balanceScore * 0.1) * 100) / 100)) failures.push("FORMULA_DRIFT");

const jeffrey = forecasts.find((team) => team.ownerId === "jeffrey-hudgins");
if (!jeffrey || jeffrey.expectedLineupCoverage.resolvedSlots !== 10 || jeffrey.expectedLineupCoverage.totalSlots !== 11) {
  failures.push("JEFFREY_K_COVERAGE");
}

const rookieUncertaintyTeams = forecasts.filter((team) => team.coverage.rookieUncertaintyCount > 0);
if (rookieUncertaintyTeams.length === 0) failures.push("ROOKIE_UNCERTAINTY_NOT_REPRESENTED");
if (JSON.stringify(snapshot).match(/futurePick|future_picks|draftGrade|draft_grade|projectedWin|projected_win|projectedLoss|projected_loss|projectedRecord|projected_record|playoffOdds|playoff_odds|championshipOdds|championship_odds/i)) failures.push("FORBIDDEN_FIELDS");

const approvedSnapshotPath = join(process.cwd(), PREDICTOR_APPROVED_SNAPSHOT_PATH);
let approvedSnapshotResult = "not present (pre-freeze)";
if (existsSync(approvedSnapshotPath)) {
  try {
    const approved = JSON.parse(readFileSync(approvedSnapshotPath, "utf8")) as PredictorApprovedSnapshot;
    const approvedErrors = validatePredictorApprovedSnapshot(approved);
    if (approvedErrors.length) failures.push(...approvedErrors.map((error) => `APPROVED_${error}`));
    if (JSON.stringify(approved.teams) !== JSON.stringify(forecasts)) failures.push("APPROVED_FORECAST_MISMATCH");
    approvedSnapshotResult = approvedErrors.length ? `FAIL (${approvedErrors.join(", ")})` : "PASS (canonical forecast matches)";
  } catch {
    failures.push("APPROVED_SNAPSHOT_UNREADABLE");
    approvedSnapshotResult = "FAIL (unreadable)";
  }
}

const publicPredictorSource = readFileSync(join(process.cwd(), "app/predictor/page.tsx"), "utf8");
const homeSource = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
if (publicPredictorSource.includes("getPreseasonTeamStrengthForecasts")) failures.push("PUBLIC_LIVE_ADAPTER");
if (homeSource.includes("getPreseasonTeamStrengthForecasts")) failures.push("HOME_LIVE_ADAPTER");
if (!publicPredictorSource.includes("getApprovedPreseasonSnapshot")) failures.push("PUBLIC_APPROVED_READER");
if (!homeSource.includes("getApprovedPreseasonTeamStrengthForecasts")) failures.push("HOME_APPROVED_READER");
if (existsSync(approvedSnapshotPath)) {
  try {
    const approved = JSON.parse(readFileSync(approvedSnapshotPath, "utf8")) as PredictorApprovedSnapshot;
    if (JSON.stringify(getApprovedPreseasonTeamStrengthForecasts().slice(0, 5)) !== JSON.stringify(approved.teams.slice(0, 5))) failures.push("HOME_TOP_FIVE_MISMATCH");
  } catch {
    failures.push("HOME_TOP_FIVE_UNVERIFIABLE");
  }
}

const tierCounts = forecasts.reduce<Record<string, number>>((counts, team) => {
  counts[team.tier] = (counts[team.tier] ?? 0) + 1;
  return counts;
}, {});

const confidenceCounts = forecasts.reduce<Record<string, number>>((counts, team) => {
  counts[team.confidence] = (counts[team.confidence] ?? 0) + 1;
  return counts;
}, {});
const scoreGaps = forecasts.slice(1).map((team, index) => forecasts[index].teamStrengthScore - team.teamStrengthScore);
const median = forecasts.length % 2
  ? forecasts[Math.floor(forecasts.length / 2)].teamStrengthScore
  : (forecasts[forecasts.length / 2 - 1].teamStrengthScore + forecasts[forecasts.length / 2].teamStrengthScore) / 2;
const range = (values: readonly number[]) => `${Math.min(...values).toFixed(2)}–${Math.max(...values).toFixed(2)}`;
const rookieHeavy = [...forecasts].sort(
  (a, b) => (b.coverage.rookieUncertaintyCount + b.coverage.unresolvedPlayerCount) -
    (a.coverage.rookieUncertaintyCount + a.coverage.unresolvedPlayerCount) ||
    a.forecastOrder - b.forecastOrder
)[0];
const rookieAdapter = getRookieMarketAdapter();
const adjustedRookieValues = rookieAdapter.rosteredPlayerIds
  .map((playerId) => rookieAdapter.byPlayerId.get(playerId))
  .filter((value): value is number => value !== undefined);
const medianValue = (values: readonly number[]) => values.length % 2
  ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  : ([...values].sort((a, b) => a - b)[values.length / 2 - 1] + [...values].sort((a, b) => a - b)[values.length / 2]) / 2;
const veteranBaselineValues = loadPredictorTeamInputs().flatMap(({ snapshot, rosterStrength }) => {
  const unavailable = new Set([...(snapshot.taxiIds ?? []), ...(snapshot.reserveIds ?? [])]);
  return rosterStrength.positions.flatMap((group) => group.players
    .filter((player) => !unavailable.has(player.playerId) && player.baselineAverage !== null)
    .map((player) => player.baselineAverage!));
});
const orderBefore = new Map<string, number>(BEFORE.map(([ownerId], index) => [ownerId, index + 1]));
const tierMembers = forecasts.reduce<Record<string, string[]>>((groups, team) => {
  (groups[team.tier] ??= []).push(team.ownerName);
  return groups;
}, {});
const scoreChanges = forecasts.map((team) => ({
  team,
  before: beforeByOwner.get(team.ownerId),
  change: team.teamStrengthScore - (beforeByOwner.get(team.ownerId)?.score ?? team.teamStrengthScore),
  orderChange: (orderBefore.get(team.ownerId) ?? team.forecastOrder) - team.forecastOrder,
}));

console.log("LCC Predictor 2.0 Slice 1B calibration diagnostics");
console.log(`Rookie source: ${PREDICTOR_ROOKIE_MARKET_SOURCE} | records=${PREDICTOR_ROOKIE_MARKET_PLAYERS.length} | fields=playerId,name,position,marketRank,adpOverall,expectedOverallPick,adpRound,adpPick,sampleSize,resolutionConfidence,sourceTeam`);
console.log(`Rookie positions: ${rookieAdapter.supportedPositions.join(", ")} | minimum position sample: 3 | rostered market-covered rookies: ${rookieAdapter.rosteredPlayerIds.length}`);
console.log(`Rookie adjusted baseline: min=${Math.min(...adjustedRookieValues).toFixed(2)} max=${Math.max(...adjustedRookieValues).toFixed(2)} median=${medianValue(adjustedRookieValues).toFixed(2)}`);
console.log(`Veteran baseline comparison: min=${Math.min(...veteranBaselineValues).toFixed(2)} max=${Math.max(...veteranBaselineValues).toFixed(2)} median=${medianValue(veteranBaselineValues).toFixed(2)}`);
console.log(`Teams: ${forecasts.length} | unique owners: ${new Set(forecasts.map((team) => team.ownerId)).size} | unique franchises: ${new Set(forecasts.map((team) => team.teamName)).size}`);
console.log(`Roster coverage: ${snapshot.rosterCoverage.ownerCount} owners / ${snapshot.rosterCoverage.rosterCount} rosters / ${snapshot.rosterCoverage.uniquePlayerCount} unique players`);
console.log(`Expected lineups: ${forecasts.filter((team) => team.expectedLineupCoverage.resolvedSlots === team.expectedLineupCoverage.totalSlots).length}/12 complete`);
console.log(`Strength range: ${Math.min(...forecasts.map((team) => team.teamStrengthScore))}–${Math.max(...forecasts.map((team) => team.teamStrengthScore))}`);
console.log(`Tiers: ${JSON.stringify(tierCounts)}`);
console.log(`Jeffrey Hudgins lineup: ${jeffrey?.expectedLineupCoverage.resolvedSlots ?? 0}/${jeffrey?.expectedLineupCoverage.totalSlots ?? 0}`);
console.log(`Rookie-uncertainty teams: ${rookieUncertaintyTeams.length}`);
console.log(`Forbidden fields: ${failures.includes("FORBIDDEN_FIELDS") ? "FAIL" : "none"}`);
console.log(`Approved snapshot: ${approvedSnapshotResult}`);
console.log(`Public sources: ${failures.includes("PUBLIC_LIVE_ADAPTER") || failures.includes("HOME_LIVE_ADAPTER") ? "FAIL" : "approved snapshot readers"}`);
console.log("Forecast table:");
console.log("ORDER | OWNER | TEAM | SCORE | CHANGE | TIER | PREVIOUS TIER | LINEUP | DEPTH | BALANCE | CONF | LINEUP COV | HISTORICAL COV | ROOKIE MARKET | KEY STRENGTH | KEY CONCERN");
for (const team of forecasts) {
  const before = beforeByOwner.get(team.ownerId);
  console.log(`${team.forecastOrder} | ${team.ownerName} | ${team.teamName} | ${team.teamStrengthScore.toFixed(2)} | ${(team.teamStrengthScore - (before?.score ?? team.teamStrengthScore)).toFixed(2)} | ${team.tier} | ${before?.tier ?? "n/a"} | ${team.lineupStrengthScore.toFixed(2)} | ${team.depthStrengthScore.toFixed(2)} | ${team.balanceScore.toFixed(2)} | ${team.confidence} | ${team.expectedLineupResolved}/${team.expectedLineupRequired} | ${team.historicalBaselineResolved}/${team.historicalBaselineTotal} | ${team.coverage.rookieMarketBaselineCount} | ${team.keyStrength} | ${team.keyConcern}`);
}
console.log(`Score distribution: min=${forecasts.at(-1)?.teamStrengthScore.toFixed(2)} max=${forecasts[0]?.teamStrengthScore.toFixed(2)} mean=${(forecasts.reduce((sum, team) => sum + team.teamStrengthScore, 0) / forecasts.length).toFixed(2)} median=${median.toFixed(2)}`);
console.log(`Adjacent gaps: ${scoreGaps.map((gap) => gap.toFixed(2)).join(", ")} | largest=${Math.max(...scoreGaps).toFixed(2)} smallest=${Math.min(...scoreGaps).toFixed(2)}`);
console.log(`Component ranges: lineup=${range(forecasts.map((team) => team.lineupStrengthScore))} depth=${range(forecasts.map((team) => team.depthStrengthScore))} balance=${range(forecasts.map((team) => team.balanceScore))}`);
console.log(`Confidence: ${JSON.stringify(confidenceCounts)}`);
console.log(`Rookie-heavy: ${rookieHeavy?.ownerName ?? "none"} | rookie=${rookieHeavy?.coverage.rookieUncertaintyCount ?? 0} unresolved=${rookieHeavy?.coverage.unresolvedPlayerCount ?? 0} baseline=${rookieHeavy ? `${rookieHeavy.playerBaselineResolved}/${rookieHeavy.playerBaselineTotal}` : "0/0"} strength=${rookieHeavy?.teamStrengthScore.toFixed(2) ?? "n/a"} confidence=${rookieHeavy?.confidence ?? "n/a"}`);
console.log(`Tier members: ${JSON.stringify(tierMembers)}`);
console.log(`Score changes: ${scoreChanges.map(({ team, change }) => `${team.ownerName}=${change.toFixed(2)}`).join(", ")}`);
console.log(`Order changes: ${scoreChanges.map(({ team, orderChange }) => `${team.ownerName}=${orderChange > 0 ? "+" : ""}${orderChange}`).join(", ")}`);
console.log(`Largest positive score change: ${[...scoreChanges].sort((a, b) => b.change - a.change)[0].team.ownerName} (${Math.max(...scoreChanges.map((item) => item.change)).toFixed(2)})`);
console.log(`Largest negative score change: ${[...scoreChanges].sort((a, b) => a.change - b.change)[0].team.ownerName} (${Math.min(...scoreChanges.map((item) => item.change)).toFixed(2)})`);
console.log(`Largest order movement: ${[...scoreChanges].sort((a, b) => Math.abs(b.orderChange) - Math.abs(a.orderChange))[0].team.ownerName} (${[...scoreChanges].sort((a, b) => Math.abs(b.orderChange) - Math.abs(a.orderChange))[0].orderChange})`);
console.log(`Status: ${failures.length ? "FAIL" : "PASS"}`);

if (failures.length) {
  console.error(`Failures: ${[...new Set(failures)].join(", ")}`);
  process.exitCode = 1;
}
