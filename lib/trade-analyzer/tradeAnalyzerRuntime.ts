import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildCurrentAssetCatalog, validateApprovedSnapshot } from "./currentValuationAdapter.ts";
import type { CurrentAssetCatalog } from "./types";
import type { ApprovedSnapshotReference } from "./serviceTypes";

const APPROVED_DATE = "2026-08-26";
const root = process.cwd();
const file = (relative: string) => path.join(root, relative);
const readJson = async (relative: string) => JSON.parse(await readFile(file(relative), "utf8"));

export interface TradeAnalyzerRuntime {
  catalog: CurrentAssetCatalog;
  snapshot: ApprovedSnapshotReference;
}

let runtimePromise: Promise<TradeAnalyzerRuntime> | undefined;

async function loadRuntime(): Promise<TradeAnalyzerRuntime> {
  const manifest = await readJson("data/trade-analyzer/valuations/fantasycalc/manifest.json");
  if (manifest.snapshotDate !== APPROVED_DATE || !manifest.normalizedFile || !manifest.rawFile) throw new Error("SNAPSHOT_MANIFEST_INVALID");
  const normalizedPath = path.resolve(root, manifest.normalizedFile);
  const normalizedText = await readFile(normalizedPath, "utf8");
  const snapshot = JSON.parse(normalizedText);
  const raw = await readJson(manifest.rawFile);
  const [roster, playerCatalog, futurePicks] = await Promise.all([readJson("data/current/rosters/2026.json"), readJson("data/history/matchups/sleeper/players.json"), readJson("data/current/drafts/future-picks.json")]);
  const integrityErrors = [
    createHash("sha256").update(raw.rawResponseBody).digest("hex") !== manifest.rawResponseHash && "RAW_HASH_MISMATCH",
    createHash("sha256").update(normalizedText).digest("hex") !== manifest.normalizedFileHash && "NORMALIZED_HASH_MISMATCH",
    JSON.stringify(JSON.parse(raw.rawResponseBody)) !== JSON.stringify(raw.response) && "RAW_BODY_MISMATCH",
  ].filter(Boolean) as string[];
  const adapterInput = { snapshot, manifest, roster, playerCatalog, futurePicks, integrityVerified: integrityErrors.length === 0, integrityErrors };
  const manifestErrors = validateApprovedSnapshot(adapterInput);
  if (manifestErrors.length) throw new Error("SNAPSHOT_INTEGRITY_FAILED");
  const catalog = buildCurrentAssetCatalog(adapterInput);
  if (!catalog.integrity.valid) throw new Error("SNAPSHOT_INTEGRITY_FAILED");
  return { catalog, snapshot: { date: APPROVED_DATE, sourceName: snapshot.source, sourceUrl: snapshot.sourceUrl, retrievedAt: snapshot.retrievalTimestamp, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", integrityValid: true } };
}

export function getTradeAnalyzerRuntime(): Promise<TradeAnalyzerRuntime> {
  runtimePromise ??= loadRuntime();
  return runtimePromise;
}

export function resetTradeAnalyzerRuntimeForTests(): void { runtimePromise = undefined; }
