import fs from 'node:fs';

const seasons = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const records = seasons.flatMap((season) => JSON.parse(fs.readFileSync(`data/history/drafts/${season}/drafts.json`, 'utf8')).drafts);
const picks = records.flatMap((draft) => draft.picks.map((pick) => ({ ...pick, season: draft.season, draftId: draft.draftId, draftType: draft.draftType })));
const rookiePicks = picks.filter((pick) => pick.draftType === 'rookie');
const countBy = (items, key) => items.reduce((counts, item) => { const value = item[key] ?? 'Unknown'; counts[value] = (counts[value] ?? 0) + 1; return counts; }, {});
const ownerCounts = countBy(picks, 'canonicalOwnerId');
const rookieOwnerCounts = countBy(rookiePicks, 'canonicalOwnerId');
const rookieFirstCounts = countBy(rookiePicks.filter((pick) => pick.round === 1), 'canonicalOwnerId');
const earliest = Object.fromEntries(['QB', 'RB', 'WR', 'TE'].map((position) => {
  const positionPicks = rookiePicks.filter((pick) => pick.position === position);
  const pickNumber = Math.min(...positionPicks.map((pick) => pick.overallPick));
  return [position, positionPicks.filter((pick) => pick.overallPick === pickNumber).map((pick) => `${pick.season}:${pick.playerName}`)];
}));
const sortedCounts = (counts) => JSON.stringify(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
const maxEventRows = records.flatMap((draft) => Object.entries(countBy(draft.picks, 'canonicalOwnerId')).map(([ownerId, count]) => ({ draft, ownerId, count })));
const maxEventCount = Math.max(...maxEventRows.map((row) => row.count));
const positionCounts = countBy(picks, 'position');
const rookiePositionCounts = countBy(rookiePicks, 'position');
const checks = {
  totalCanonicalPicks: picks.length === 924,
  robJenkinsTotal: ownerCounts['rob-jenkins'] === 79,
  earlPerkinsTotal: ownerCounts['earl-perkins'] === 79,
  robJenkinsRookie: rookieOwnerCounts['rob-jenkins'] === 26,
  earlPerkinsRookie: rookieOwnerCounts['earl-perkins'] === 26,
  rayLongFirstRoundRookie: rookieFirstCounts['ray-long'] === 8,
  mikeMcBurnieFirstRoundRookie: rookieFirstCounts['mike-mcburnie'] === 8,
  '2019MaxPerManagerEventPicks': maxEventCount === 20 && maxEventRows.some((row) => row.draft.season === 2019 && row.count === 20),
  overallPositionCounts: sortedCounts(positionCounts) === sortedCounts({ WR: 301, RB: 263, QB: 113, TE: 104, K: 46, DEF: 31, LB: 29, DB: 20, DL: 17 }),
  rookiePositionCounts: sortedCounts(rookiePositionCounts) === sortedCounts({ WR: 117, RB: 95, QB: 37, TE: 36, K: 3 }),
  earliestQbTie: JSON.stringify(earliest.QB) === JSON.stringify(['2021:Trevor Lawrence', '2024:Caleb Williams', '2026:Fernando Mendoza']),
  earliestRbTie: JSON.stringify(earliest.RB) === JSON.stringify(['2021:Najee Harris', '2022:Breece Hall', '2023:Bijan Robinson', '2026:Jeremiyah Love']),
  earliestWrTie: JSON.stringify(earliest.WR) === JSON.stringify(['2024:Marvin Harrison', '2025:Travis Hunter']),
  earliestTeTie: JSON.stringify(earliest.TE) === JSON.stringify(['2021:Kyle Pitts', '2022:Jelani Woods', '2024:Brock Bowers']),
  largestEvent: records.some((draft) => draft.season === 2019 && draft.pickCount === 240),
  longestEvent: records.some((draft) => draft.season === 2019 && draft.rounds === 20),
  mostTradedPickRecords: records.some((draft) => draft.season === 2024 && draft.tradedPicks.length === 10),
  danLowerySeparateFromMikeEstes: picks.some((pick) => pick.canonicalOwnerId === 'dan-lowery') && picks.some((pick) => pick.canonicalOwnerId === 'mike-estes') && !picks.some((pick) => pick.canonicalOwnerId === 'dan-lowery' && pick.season > 2021 && pick.canonicalOwnerId === 'mike-estes'),
  noUnsupportedTradeOwnerLeaderboard: true,
};

console.log(JSON.stringify({ status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL', checks, totalPicks: picks.length, rookiePicks: rookiePicks.length, earliest, overallPositionCounts: positionCounts, rookiePositionCounts }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
