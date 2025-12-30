import { MANUAL_HISTORY } from './manual-history';

export interface ManagerStats {
  manager: string;
  seasons: number;
  wins: number;      // Championships
  seconds: number;   // Runner-ups
  thirds: number;    // 3rd place finishes
  top3: number;      // Total podiums
  avgRank: number;   // Lower is better
  bestFinish: number;
  worstFinish: number;
  titles: number[];  // Years won
}

export const calculateAllTimeStats = (): ManagerStats[] => {
  const statsMap = new Map<string, ManagerStats>();

  // Iterate over every year in history
  Object.entries(MANUAL_HISTORY).forEach(([yearStr, standings]) => {
    const year = parseInt(yearStr);

    standings.forEach(({ rank, manager }) => {
      // Skip empty placeholders
      if (manager === "-" || !manager) return;

      // Initialize manager record if it doesn't exist yet
      if (!statsMap.has(manager)) {
        statsMap.set(manager, {
          manager,
          seasons: 0,
          wins: 0,
          seconds: 0,
          thirds: 0,
          top3: 0,
          avgRank: 0, // Calculated at the end
          sumRank: 0, // Internal helper for avg
          bestFinish: 99,
          worstFinish: 0,
          titles: []
        } as any); 
      }

      const stats = statsMap.get(manager)!;
      
      // Update basic counts
      stats.seasons += 1;
      (stats as any).sumRank += rank; 
      
      // Update best/worst
      stats.bestFinish = Math.min(stats.bestFinish, rank);
      stats.worstFinish = Math.max(stats.worstFinish, rank);

      // Update placements
      if (rank === 1) {
        stats.wins += 1;
        stats.titles.push(year);
      }
      if (rank === 2) stats.seconds += 1;
      if (rank === 3) stats.thirds += 1;
      if (rank <= 3) stats.top3 += 1;
    });
  });

  // Convert Map to Array and finalize averages
  const allStats = Array.from(statsMap.values()).map(stat => {
    const sumRank = (stat as any).sumRank;
    return {
      ...stat,
      avgRank: parseFloat((sumRank / stat.seasons).toFixed(2))
    };
  });

  // SORTING LOGIC:
  // 1. Most Championships
  // 2. Best Average Rank (Low to High)
  // 3. Most Top 3 Finishes
  return allStats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank;
    return b.top3 - a.top3;
  });
};