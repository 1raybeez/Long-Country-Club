import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'data', 'history', 'matchups', 'sleeper');
const backendRoot = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions');
const destinationRoot = path.join(
  projectRoot,
  '.firebase',
  'long-country-club-ffl',
  'functions',
  'data',
  'history',
  'matchups',
  'sleeper',
);

function filesUnder(root, relative = '') {
  const current = path.join(root, relative);
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? filesUnder(root, child) : [child];
  });
}

const sourceFiles = filesUnder(sourceRoot).sort();
if (sourceFiles.length !== 169) {
  throw new Error(`Expected 169 canonical matchup files, found ${sourceFiles.length}`);
}

if (!fs.existsSync(backendRoot)) {
  throw new Error('Generated Firebase backend directory is unavailable');
}

fs.rmSync(destinationRoot, { recursive: true, force: true });
for (const relative of sourceFiles) {
  const destination = path.join(destinationRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, relative), destination);
}

console.log(`Packaged ${sourceFiles.length} canonical matchup files for Firebase server runtime`);
