import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const firebaseRoot = path.join(projectRoot, '.firebase', 'long-country-club-ffl', 'functions');
process.chdir(firebaseRoot);
const { getTradeAnalyzerRuntime } = await import(pathToFileURL(path.join(projectRoot, 'lib/trade-analyzer/tradeAnalyzerRuntime.ts')).href);
const runtime = await getTradeAnalyzerRuntime();
assert.equal(runtime.snapshot.date, '2026-08-26');
assert.ok(runtime.catalog.assets.length > 0);
console.log(JSON.stringify({ status: 'PASS', runtimeRoot: firebaseRoot, snapshotDate: runtime.snapshot.date, loader: 'SUCCESS' }, null, 2));
