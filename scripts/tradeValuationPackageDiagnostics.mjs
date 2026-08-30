import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const projectRoot = process.cwd();
const manifestRelative = 'data/trade-analyzer/valuations/fantasycalc/manifest.json';
const backendRoot = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions');
const fail = (message) => { throw new Error(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceManifestPath = path.join(projectRoot, manifestRelative);
if (!fs.existsSync(sourceManifestPath)) fail('Source valuation manifest is missing');
if (!fs.existsSync(backendRoot)) fail('Generated Firebase backend directory is missing');
const sourceManifest = readJson(sourceManifestPath);
if (sourceManifest.snapshotDate !== '2026-08-26') fail('Approved valuation identity is not 2026-08-26');
if (!sourceManifest.normalizedFile || !sourceManifest.rawFile) fail('Manifest does not select the complete runtime asset set');
const requiredFiles = [
  manifestRelative,
  sourceManifest.normalizedFile,
  sourceManifest.rawFile,
  'data/current/rosters/2026.json',
  'data/current/drafts/future-picks.json',
  'data/history/matchups/sleeper/players.json',
];
for (const relative of requiredFiles) {
  const source = path.join(projectRoot, relative);
  const generated = path.join(backendRoot, relative);
  if (!fs.existsSync(source)) fail(`Source runtime asset is missing: ${relative}`);
  if (!fs.existsSync(generated)) fail(`Generated SSR runtime asset is missing: ${relative}`);
  if (hash(source) !== hash(generated)) fail(`Generated SSR checksum mismatch: ${relative}`);
}
const generatedManifest = readJson(path.join(backendRoot, manifestRelative));
if (generatedManifest.snapshotDate !== '2026-08-26') fail('Generated valuation identity is not 2026-08-26');
if (generatedManifest.normalizedFile !== sourceManifest.normalizedFile || generatedManifest.rawFile !== sourceManifest.rawFile) fail('Generated manifest authority differs from source manifest');
const generatedRoster = readJson(path.join(backendRoot, 'data/current/rosters/2026.json'));
if (generatedRoster.season !== 2026) fail('Generated roster identity is not 2026');
const generatedFuturePicks = readJson(path.join(backendRoot, 'data/current/drafts/future-picks.json'));
if (!Array.isArray(generatedFuturePicks.assets) || !Array.isArray(generatedFuturePicks.supportedFutureSeasons)) fail('Generated future-pick inventory is invalid');
const generatedPlayers = readJson(path.join(backendRoot, 'data/history/matchups/sleeper/players.json'));
if (!generatedPlayers || typeof generatedPlayers !== 'object' || Array.isArray(generatedPlayers)) fail('Generated player catalog is invalid');
const generatedRoot = path.join(backendRoot, 'data', 'trade-analyzer', 'valuations', 'fantasycalc');
const generatedFiles = fs.readdirSync(generatedRoot, { recursive: true }).filter((entry) => fs.statSync(path.join(generatedRoot, entry)).isFile()).sort().map((entry) => path.join('data', 'trade-analyzer', 'valuations', 'fantasycalc', entry));
if (generatedFiles.length !== 3 || !generatedFiles.includes(manifestRelative) || !generatedFiles.includes(sourceManifest.normalizedFile) || !generatedFiles.includes(sourceManifest.rawFile)) fail('Generated valuation directory contains an unexpected or missing asset');
console.log(JSON.stringify({ status: 'PASS', approvedSnapshotDate: generatedManifest.snapshotDate, runtimeAssetCount: requiredFiles.length, checksums: 'PASS', contextIdentity: 'PASS', serverOnlyDestination: 'PASS' }, null, 2));
