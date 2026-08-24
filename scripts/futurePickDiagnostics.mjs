import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inventoryPath = path.join(root, 'data/current/drafts/future-picks.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const assets = inventory.assets;
const supportedYears = inventory.supportedFutureSeasons;
const expectedAssetsPerYear = inventory.rosterCount * inventory.rookieDraftRounds;
const expectedIds = new Set();
const duplicateIds = [];
const ownerCounts = new Map();

for (const asset of assets) {
  if (expectedIds.has(asset.id)) duplicateIds.push(asset.id);
  expectedIds.add(asset.id);
  const ownerKey = `${asset.season}:${asset.currentOwnerId}`;
  ownerCounts.set(ownerKey, (ownerCounts.get(ownerKey) ?? 0) + 1);
}

const assetsByYear = Object.fromEntries(supportedYears.map((season) => [season, assets.filter((asset) => asset.season === season)]));
const roundCounts = Object.fromEntries(supportedYears.map((season) => [season, Object.fromEntries(Array.from({ length: inventory.rookieDraftRounds }, (_, index) => {
  const round = index + 1;
  return [round, assetsByYear[season].filter((asset) => asset.round === round).length];
}))]));
const tradedByYear = Object.fromEntries(supportedYears.map((season) => [season, assetsByYear[season].filter((asset) => asset.isTraded).length]));
const ownerResolutionComplete = assets.every((asset) => asset.originalOwnerId && asset.currentOwnerId);
const oneCurrentOwnerPerAsset = assets.every((asset) => Number.isInteger(asset.currentRosterId) && asset.currentOwnerId);
const noHistoricalDraftMutation = !assets.some((asset) => Object.prototype.hasOwnProperty.call(asset, 'playerId') || Object.prototype.hasOwnProperty.call(asset, 'overallPick'));
const assets2027 = assetsByYear[2027] ?? [];
const assets2028 = assetsByYear[2028] ?? [];
const anthony2027Held = assets2027.filter((asset) => asset.currentOwnerId === 'anthony-martinez');
const mike2027Held = assets2027.filter((asset) => asset.currentOwnerId === 'mike-mcburnie');
const anthony2027Round2 = assets2027.find((asset) => asset.originalOwnerId === 'anthony-martinez' && asset.round === 2);
const ownerCounts2028 = new Map(assets2028.map((asset) => [asset.currentOwnerId, (assets2028.filter((candidate) => candidate.currentOwnerId === asset.currentOwnerId).length)]));
const checks = {
  supportedFutureSeasonsFound: supportedYears.length > 0,
  expectedAssetsPerYear: supportedYears.every((season) => assetsByYear[season].length === expectedAssetsPerYear),
  twelveAssetsPerRound: supportedYears.every((season) => Object.values(roundCounts[season]).every((count) => count === inventory.rosterCount)),
  uniqueDeterministicIds: duplicateIds.length === 0 && assets.every((asset) => asset.id === `${asset.season}-r${asset.round}-roster-${asset.originalRosterId}`),
  oneCurrentOwnerPerAsset,
  ownerResolutionComplete,
  noDuplicateAssets: duplicateIds.length === 0,
  noOrphanAssets: assets.every((asset) => asset.originalRosterId >= 1 && asset.originalRosterId <= inventory.rosterCount && asset.currentRosterId >= 1 && asset.currentRosterId <= inventory.rosterCount),
  noHistoricalDraftMutation,
  '2027AnthonyHoldsThree': anthony2027Held.length === 3 && anthony2027Held.every((asset) => [1, 3, 4].includes(asset.round)),
  '2027MikeHoldsFive': mike2027Held.length === 5,
  '2027AnthonyRound2CurrentOwnerMike': anthony2027Round2?.currentOwnerId === 'mike-mcburnie',
  '2028TwelveOwnersFourAssetsEach': assets2028.length === 48 && ownerCounts2028.size === 12 && [...ownerCounts2028.values()].every((count) => count === 4),
};

console.log(JSON.stringify({
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  checks,
  leagueId: inventory.leagueId,
  supportedFutureSeasons: supportedYears,
  totalsByYear: Object.fromEntries(supportedYears.map((season) => [season, { total: assetsByYear[season].length, traded: tradedByYear[season], retained: assetsByYear[season].filter((asset) => !asset.isTraded).length }])),
  roundCounts,
  duplicateIds,
  ownerHoldings: Object.fromEntries([...ownerCounts.entries()].sort()),
  requiredQa: {
    anthony2027Held: anthony2027Held.map((asset) => `R${asset.round}`),
    mike2027Held: mike2027Held.map((asset) => ({ round: asset.round, acquired: asset.isTraded, originalOwnerId: asset.originalOwnerId })),
    anthony2027Round2CurrentOwner: anthony2027Round2?.currentOwnerId ?? null,
    owners2028: ownerCounts2028.size,
  },
}, null, 2));

if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
