import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'data', 'trade-analyzer', 'valuations', 'fantasycalc');
const backendRoot = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = readJson(path.join(sourceRoot, 'manifest.json'));

if (manifest.snapshotDate !== '2026-08-26') throw new Error('Approved valuation manifest identity is not 2026-08-26');
if (!manifest.normalizedFile || !manifest.rawFile) throw new Error('Approved valuation manifest does not select both runtime snapshot files');
const requiredFiles = ['data/trade-analyzer/valuations/fantasycalc/manifest.json', manifest.normalizedFile, manifest.rawFile];
for (const relative of requiredFiles.slice(1)) {
  if (!path.normalize(relative).startsWith('data/trade-analyzer/valuations/fantasycalc/')) throw new Error(`Manifest file is outside the approved valuation directory: ${relative}`);
  if (!fs.existsSync(path.join(projectRoot, relative))) throw new Error(`Approved valuation file is missing: ${relative}`);
}
if (!fs.existsSync(backendRoot)) throw new Error('Generated Firebase backend directory is unavailable');
fs.rmSync(path.join(backendRoot, 'data', 'trade-analyzer', 'valuations', 'fantasycalc'), { recursive: true, force: true });
for (const relative of requiredFiles) {
  const destination = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions', relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, relative), destination);
}
console.log(`Packaged ${requiredFiles.length} approved Trade Analyzer valuation runtime files for Firebase SSR`);
