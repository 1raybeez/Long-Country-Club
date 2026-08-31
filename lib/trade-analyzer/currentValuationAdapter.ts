import { calculateFairnessV1 } from "./fairnessEngine.ts";
import type { CurrentAssetCatalog, CurrentCatalogAsset, CurrentTradeRequest, CurrentTradeResult, SnapshotContext } from "./types";

interface SourcePlayerRow { sleeperId: string; fantasyCalcId: number; playerName: string; position: "QB" | "RB" | "WR" | "TE"; rawValue: number; sourceSnapshotDate: string; }
interface SourcePickRow { pickLabel: string; season: number; round: number | null; slot: number | null; tier: string | null; rawValue: number; sourceSnapshotDate: string; roundLevel?: boolean; }
interface RosterRow { ownerId: string; players?: string[]; }
interface PlayerMeta { full_name?: string; position?: string; }
interface FuturePickAsset { id: string; season: number; round: number; slot?: number; tier?: "EARLY" | "MID" | "LATE"; currentOwnerId?: string; currentOwner?: string; currentManagerName?: string; currentTeamName?: string; }
interface SnapshotInput { snapshotDate: string; retrievalTimestamp: string; source: string; sourceUrl: string; attribution: string; configuration: Record<string, unknown>; players: SourcePlayerRow[]; picks: SourcePickRow[]; }
interface ManifestInput { snapshotDate: string; source: string; sourceUrl: string; retrievalTimestamp: string; requestConfiguration: Record<string, unknown>; rawResponseHash: string; normalizedFileHash: string; rowCount: number; playerCount: number; pickCount: number; validationResult: string; reviewStatus: string; }
export interface AdapterInput { snapshot: SnapshotInput; manifest: ManifestInput; roster: { rosters: RosterRow[] }; playerCatalog: Record<string, PlayerMeta>; futurePicks: { assets: FuturePickAsset[] }; integrityVerified: boolean; integrityErrors?: string[]; }

const ordinal = (round: number): string => ({ 1: "st", 2: "nd", 3: "rd" }[round] ?? "th");
const isSkillPosition = (position: string | undefined): position is "QB" | "RB" | "WR" | "TE" => ["QB", "RB", "WR", "TE"].includes(position ?? "");
const unique = <T>(items: T[]): T[] => [...new Set(items)];

const directPlayerAsset = (row: SourcePlayerRow): CurrentCatalogAsset => ({ assetId: row.sleeperId, assetType: "PLAYER", displayName: row.playerName, position: row.position, baseValue: row.rawValue, valueStatus: "VALUED", valueMethod: "FANTASYCALC_DIRECT", sourceName: "FantasyCalc", sourceRowId: String(row.fantasyCalcId), snapshotDate: row.sourceSnapshotDate, evidence: "HIGH" });
const fallbackAsset = (id: string, meta: PlayerMeta, ownerId: string): CurrentCatalogAsset => { const isDst = meta.position === "DEF"; const type = isDst ? "DST" : "K"; return { assetId: id, assetType: type, displayName: meta.full_name ?? id, position: type, baseValue: 25, valueStatus: "FALLBACK", valueMethod: "LCC_FALLBACK", sourceName: "LCC_POLICY", snapshotDate: undefined, evidence: "MEDIUM", ownerId }; };

export function validateApprovedSnapshot(input: AdapterInput): string[] {
  const errors: string[] = [];
  const expectedConfiguration = { dynasty: true, teams: 12, qb: 1, scoring: "half-PPR", tePremium: false };
  if (!input.integrityVerified) errors.push(...(input.integrityErrors?.length ? input.integrityErrors : ["SNAPSHOT_INTEGRITY_UNVERIFIED"]));
  if (input.manifest.snapshotDate !== input.snapshot.snapshotDate || input.manifest.source !== input.snapshot.source || input.manifest.sourceUrl !== input.snapshot.sourceUrl || input.manifest.retrievalTimestamp !== input.snapshot.retrievalTimestamp) errors.push("SNAPSHOT_MANIFEST_MISMATCH");
  if (JSON.stringify(input.snapshot.configuration) !== JSON.stringify(expectedConfiguration) || JSON.stringify(input.manifest.requestConfiguration) !== JSON.stringify(expectedConfiguration)) errors.push("SOURCE_CONFIGURATION_MISMATCH");
  if (input.manifest.validationResult !== "PASS" || input.manifest.reviewStatus !== "COMMISSIONER_REVIEW") errors.push("SNAPSHOT_NOT_APPROVED");
  if (input.manifest.rowCount !== input.snapshot.players.length + input.snapshot.picks.length || input.manifest.playerCount !== input.snapshot.players.length || input.manifest.pickCount !== input.snapshot.picks.length) errors.push("SNAPSHOT_ROW_COUNT_MISMATCH");
  if (input.snapshot.players.some((row) => !row.sleeperId || !row.playerName || !isSkillPosition(row.position) || !Number.isFinite(row.rawValue) || row.rawValue < 0)) errors.push("MALFORMED_SNAPSHOT_PLAYER");
  if (input.snapshot.picks.some((row) => !row.pickLabel || !Number.isFinite(row.rawValue) || row.rawValue < 0)) errors.push("MALFORMED_SNAPSHOT_PICK");
  return unique(errors);
}

export function buildCurrentAssetCatalog(input: AdapterInput): CurrentAssetCatalog {
  const integrityErrors = validateApprovedSnapshot(input);
  const sourcePlayers = new Map(input.snapshot.players.map((row) => [row.sleeperId, row]));
  const rosterOwners = new Map<string, string>();
  for (const roster of input.roster.rosters) for (const id of unique(roster.players ?? [])) {
    if (rosterOwners.has(id) && rosterOwners.get(id) !== roster.ownerId) integrityErrors.push("DUPLICATE_OWNER_ASSIGNMENT");
    else rosterOwners.set(id, roster.ownerId);
  }
  const assets: CurrentCatalogAsset[] = [];
  for (const id of rosterOwners.keys()) {
    const source = sourcePlayers.get(id);
    const meta = input.playerCatalog[id];
    if (source) assets.push({ ...directPlayerAsset(source), ownerId: rosterOwners.get(id) });
    else if (meta?.position === "K" || meta?.position === "DEF") assets.push(fallbackAsset(id, meta, rosterOwners.get(id)!));
    else assets.push({ assetId: id, assetType: "PLAYER", displayName: meta?.full_name ?? id, position: isSkillPosition(meta?.position) ? meta.position : undefined, valueStatus: "UNVALUED", valueMethod: "UNVALUED", sourceName: "FantasyCalc", snapshotDate: input.snapshot.snapshotDate, evidence: "INCOMPLETE", ownerId: rosterOwners.get(id), warnings: ["SOURCE_COVERAGE_GAP"] });
  }
  const sourcePicks = new Map(input.snapshot.picks.map((row) => [row.pickLabel, row]));
  for (const pick of input.futurePicks.assets) {
    const label = pick.slot ? `${pick.season} Pick ${pick.round}.${String(pick.slot).padStart(2, "0")}` : pick.tier ? `${pick.season} ${pick.round}${ordinal(pick.round)} (${pick.tier[0] + pick.tier.slice(1).toLowerCase()})` : `${pick.season} ${pick.round}${ordinal(pick.round)}`;
    const source = sourcePicks.get(label);
    const pickKind = pick.slot ? "EXACT_SLOT" : pick.tier ? "TIERED" : "GENERIC_ROUND";
    if (source) assets.push({ assetId: pick.id, assetType: "PICK", displayName: source.pickLabel, season: pick.season, round: pick.round, slot: pick.slot, pickTier: pick.tier, pickKind, baseValue: source.rawValue, valueStatus: "VALUED", valueMethod: "FANTASYCALC_PICK_SOURCE", sourceName: "FantasyCalc", sourceRowId: source.pickLabel, snapshotDate: source.sourceSnapshotDate, evidence: "HIGH", ownerId: pick.currentOwnerId });
    else assets.push({ assetId: pick.id, assetType: "PICK", displayName: label, season: pick.season, round: pick.round, slot: pick.slot, pickTier: pick.tier, pickKind, valueStatus: "UNVALUED", valueMethod: "UNVALUED", sourceName: "FantasyCalc", snapshotDate: input.snapshot.snapshotDate, evidence: "INCOMPLETE", ownerId: pick.currentOwnerId, warnings: ["SOURCE_COVERAGE_GAP"] });
  }
  const assetIds = assets.map((asset) => asset.assetId);
  const playerIds = assets.filter((asset) => asset.assetType === "PLAYER" || asset.assetType === "K" || asset.assetType === "DST").map((asset) => asset.assetId);
  const pickIds = assets.filter((asset) => asset.assetType === "PICK").map((asset) => asset.assetId);
  if (unique(assetIds).length !== assetIds.length) integrityErrors.push("DUPLICATE_ASSET_ID");
  if (unique(playerIds).length !== playerIds.length) integrityErrors.push("DUPLICATE_PLAYER_ID");
  if (unique(pickIds).length !== pickIds.length) integrityErrors.push("DUPLICATE_PICK_ID");
  if (assets.some((asset) => !["PLAYER", "PICK", "K", "DST"].includes(asset.assetType))) integrityErrors.push("UNSUPPORTED_CURRENT_ASSET");
  const byAssetId = Object.fromEntries(assets.map((asset) => [asset.assetId, asset]));
  return { snapshotDate: input.snapshot.snapshotDate, assets, byAssetId, integrity: { valid: unique(integrityErrors).length === 0, errors: unique(integrityErrors) } };
}

export function buildApprovedSandboxCatalog(input: AdapterInput): CurrentAssetCatalog {
  const assets: CurrentCatalogAsset[] = input.snapshot.players.map(directPlayerAsset);
  const genericPicks = input.snapshot.picks.filter((row) => row.roundLevel && /^(2027|2028|2029) (1st|2nd|3rd|4th)$/.test(row.pickLabel)).sort((left, right) => left.season - right.season || Number(left.tier) - Number(right.tier));
  for (const row of genericPicks) {
    const round = row.round ?? Number(row.tier);
    assets.push({ assetId: `sandbox-pick-${row.season}-${round}`, assetType: "PICK", displayName: row.pickLabel, season: row.season, round, pickKind: "GENERIC_ROUND", baseValue: row.rawValue, valueStatus: "VALUED", valueMethod: "FANTASYCALC_PICK_SOURCE", sourceName: "FantasyCalc", sourceRowId: row.pickLabel, snapshotDate: row.sourceSnapshotDate, evidence: "HIGH" });
  }
  const assetIds = assets.map((asset) => asset.assetId);
  const errors = unique(assetIds).length === assetIds.length ? [] : ["DUPLICATE_SANDBOX_ASSET_ID"];
  return { snapshotDate: input.snapshot.snapshotDate, assets, byAssetId: Object.fromEntries(assets.map((asset) => [asset.assetId, asset])), integrity: { valid: errors.length === 0, errors } };
}

const ownershipFor = (assets: CurrentCatalogAsset[], ownerId: string | undefined): "CURRENTLY_OWNED" | "NOT_CURRENTLY_OWNED" | "OWNERSHIP_UNKNOWN" => ownerId === undefined ? "OWNERSHIP_UNKNOWN" : assets.every((asset) => asset.ownerId === ownerId) ? "CURRENTLY_OWNED" : "NOT_CURRENTLY_OWNED";

export function calculateCurrentTrade(catalog: CurrentAssetCatalog, request: CurrentTradeRequest): CurrentTradeResult {
  const validationErrors: string[] = [];
  const a = request?.sideA;
  const b = request?.sideB;
  if (!Array.isArray(a) || !Array.isArray(b)) validationErrors.push("INVALID_TRADE_REQUEST");
  if (!a?.length) validationErrors.push("EMPTY_SIDE_A");
  if (!b?.length) validationErrors.push("EMPTY_SIDE_B");
  const all = [...(a ?? []), ...(b ?? [])];
  if (unique(a ?? []).length !== (a ?? []).length) validationErrors.push("DUPLICATE_SIDE_A_ASSET");
  if (unique(b ?? []).length !== (b ?? []).length) validationErrors.push("DUPLICATE_SIDE_B_ASSET");
  if (unique(all).length !== all.length) validationErrors.push("CROSS_SIDE_DUPLICATE_ASSET");
  if (all.some((id) => !catalog.byAssetId[id])) validationErrors.push("UNKNOWN_ASSET_ID");
  if (!catalog.integrity.valid) validationErrors.push("CATALOG_INTEGRITY_INVALID");
  const sideAAssets = (a ?? []).map((id) => catalog.byAssetId[id]).filter(Boolean);
  const sideBAssets = (b ?? []).map((id) => catalog.byAssetId[id]).filter(Boolean);
  const ownership = { sideA: ownershipFor(sideAAssets, request?.ownership?.sideAOwnerId), sideB: ownershipFor(sideBAssets, request?.ownership?.sideBOwnerId) };
  if (validationErrors.length) return { adapterStatus: "INVALID", validationErrors: unique(validationErrors), ownership, engineResult: null };
  const snapshot: SnapshotContext = { sourceName: "FantasyCalc", sourceUrl: "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=1&numTeams=12&ppr=0.5&includeAdp=false", sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", sourceAttribution: "Player and pick market values sourced from FantasyCalc.", snapshotDate: catalog.snapshotDate, snapshotRetrievedAt: "2026-08-26T21:48:36.707Z", evaluatedAt: request.evaluatedAt, leaguePhase: request.leaguePhase, leagueConfiguration: { dynasty: true, teams: 12, qb: 1, scoring: "half-PPR", tePremium: false } };
  const engineResult = calculateFairnessV1({ sideA: { sideId: "SIDE_A", assets: sideAAssets }, sideB: { sideId: "SIDE_B", assets: sideBAssets }, snapshot, outputContext: request.publicOutput ? "PUBLIC" : "PRIVATE" });
  return { adapterStatus: "VALID", validationErrors: [], ownership, engineResult };
}
