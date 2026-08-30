import "node:fs";
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
const telemetry = (stage: string, details: Record<string, unknown> = {}) => {
  console.info("[trade-analyzer-runtime]", JSON.stringify({ timestamp: new Date().toISOString(), stage, cwd: process.cwd(), ...details }));
};
const safeError = (error: unknown) => {
  if (!(error instanceof Error)) return { errorName: "UnknownError", errorCode: undefined, safeMessage: "Non-Error exception" };
  const candidate = error as Error & { code?: string };
  return { errorName: candidate.name, errorCode: candidate.code, safeMessage: candidate.message };
};

export interface TradeAnalyzerRuntime {
  catalog: CurrentAssetCatalog;
  snapshot: ApprovedSnapshotReference;
}

let runtimePromise: Promise<TradeAnalyzerRuntime> | undefined;

async function loadRuntime(): Promise<TradeAnalyzerRuntime> {
  const valuationRoot = path.resolve(root, "data/trade-analyzer/valuations/fantasycalc");
  const manifestPath = path.join(valuationRoot, "manifest.json");
  let stage = "START";
  telemetry(stage, { valuationRoot, manifestPath, manifestExists: await fsExists(manifestPath) });
  try {
    stage = "MANIFEST_READ";
    const manifestText = await readFile(manifestPath, "utf8");
    telemetry(stage, { manifestPath });
    stage = "MANIFEST_PARSED";
    const manifest = JSON.parse(manifestText);
    const normalizedPath = path.resolve(root, manifest.normalizedFile);
    const rawPath = path.resolve(root, manifest.rawFile);
    telemetry(stage, { manifestPath, normalizedPath, rawPath, normalizedExists: await fsExists(normalizedPath), rawExists: await fsExists(rawPath) });
    stage = "MANIFEST_VALIDATED";
    if (manifest.snapshotDate !== APPROVED_DATE || !manifest.normalizedFile || !manifest.rawFile) throw new Error("SNAPSHOT_MANIFEST_INVALID");
    telemetry(stage, { manifestPath, normalizedPath, rawPath });
    stage = "NORMALIZED_READ";
    const normalizedText = await readFile(normalizedPath, "utf8");
    telemetry(stage, { normalizedPath });
    stage = "NORMALIZED_PARSED";
    const snapshot = JSON.parse(normalizedText);
    telemetry(stage, { normalizedPath });
    stage = "RAW_READ";
    const rawText = await readFile(rawPath, "utf8");
    telemetry(stage, { rawPath });
    stage = "RAW_PARSED";
    const raw = JSON.parse(rawText);
    telemetry(stage, { rawPath });
    const [roster, playerCatalog, futurePicks] = await Promise.all([readJson("data/current/rosters/2026.json"), readJson("data/history/matchups/sleeper/players.json"), readJson("data/current/drafts/future-picks.json")]);
    const integrityErrors = [
      createHash("sha256").update(raw.rawResponseBody).digest("hex") !== manifest.rawResponseHash && "RAW_HASH_MISMATCH",
      createHash("sha256").update(normalizedText).digest("hex") !== manifest.normalizedFileHash && "NORMALIZED_HASH_MISMATCH",
      JSON.stringify(JSON.parse(raw.rawResponseBody)) !== JSON.stringify(raw.response) && "RAW_BODY_MISMATCH",
    ].filter(Boolean) as string[];
    stage = "INTEGRITY_VALIDATED";
    telemetry(stage, { manifestPath, normalizedPath, rawPath, integrityErrorCount: integrityErrors.length });
    const adapterInput = { snapshot, manifest, roster, playerCatalog, futurePicks, integrityVerified: integrityErrors.length === 0, integrityErrors };
    const manifestErrors = validateApprovedSnapshot(adapterInput);
    if (manifestErrors.length) throw new Error("SNAPSHOT_INTEGRITY_FAILED");
    const catalog = buildCurrentAssetCatalog(adapterInput);
    if (!catalog.integrity.valid) throw new Error("SNAPSHOT_INTEGRITY_FAILED");
    stage = "SNAPSHOT_BUILT";
    telemetry(stage, { snapshotDate: manifest.snapshotDate, assetCount: catalog.assets.length });
    stage = "SUCCESS";
    telemetry(stage, { snapshotDate: manifest.snapshotDate, assetCount: catalog.assets.length });
    return { catalog, snapshot: { date: APPROVED_DATE, sourceName: snapshot.source, sourceUrl: snapshot.sourceUrl, retrievedAt: snapshot.retrievalTimestamp, sourceLicenseStatus: "COMMISSIONER_REVIEW_REQUIRED", integrityValid: true } };
  } catch (error) {
    telemetry(stage, safeError(error));
    throw error;
  }
}

async function fsExists(target: string): Promise<boolean> {
  try { await readFile(target); return true; } catch { return false; }
}

export function getTradeAnalyzerRuntime(): Promise<TradeAnalyzerRuntime> {
  runtimePromise ??= loadRuntime();
  return runtimePromise;
}

export function resetTradeAnalyzerRuntimeForTests(): void { runtimePromise = undefined; }
