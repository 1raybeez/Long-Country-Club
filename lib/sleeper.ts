// lib/sleeper.ts

import { LCC_CURRENT_LEAGUE_ID } from './leagueConstants';
import { DEFAULT_OWNER_IMAGE } from './ownerImages';

export const LEAGUE_ID = LCC_CURRENT_LEAGUE_ID;

// --- TYPES ---
export interface Transaction {
  transaction_id: string;
  created: number;
  type: string;
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  draft_picks: unknown[];
  creator: string;
}

export interface Player {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string | null;
}

export interface RecordEntry {
  manager: string;
  avatar: string;
  score: number;
  year: number;
  week: number;
}

export interface CareerEntry {
  manager: string;
  userId?: string; 
  avatar: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  potentialPoints: number;
  seasons: number;
}

export interface Award {
  year: number;
  type: 'champion' | 'runner_up' | 'third_place' | 'toilet_bowl';
  manager: string; 
  avatar?: string | null; 
}

export interface Matchup {
  matchup_id: number;
  roster_id: number;
  points: number;
  starters?: string[];
  players_points?: Record<string, number>;
}

export interface BracketMatch {
  r: number;
  p?: number;
  t1?: number;
  t2?: number;
  w?: number;
  l?: number;
}

interface SleeperUser {
  user_id: string;
  display_name?: string;
  avatar?: string | null;
  metadata?: {
    team_name?: string;
  };
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
}

interface SleeperLeague {
  season: string;
  previous_league_id?: string | null;
}

interface SleeperDraft {
  draft_id: string;
  status?: string;
  settings?: {
    rounds?: number;
  };
  draft_order?: Record<string, number>;
}

interface ManagerSummary {
  name: string;
  avatar: string | null;
}

interface DraftHistorySeason {
  year: string;
  draft_id: string;
  settings?: SleeperDraft['settings'];
  picks: unknown[];
  teams: Record<number, ManagerSummary>;
  slot_to_roster: Record<number, number>;
}

// --- CACHE BUSTING CONSTANT ---
const CACHE_OPTIONS = { cache: 'no-store' } as const;

// --- API FUNCTIONS ---

export async function getNFLState() {
  try {
    // UPDATED: Use CACHE_OPTIONS
    const response = await fetch('https://api.sleeper.app/v1/state/nfl', CACHE_OPTIONS);
    if (!response.ok) return { week: 1, season: '2025' };
    return response.json();
  } catch (error) {
    console.error("Error fetching NFL state:", error);
    return { week: 1, season: '2025' };
  }
}

export async function getRecentTransactions(): Promise<Transaction[]> {
  try {
    const state = await getNFLState();
    const currentWeek = state.week > 0 ? state.week : 1; 

    const promises = [];
    for (let i = 1; i <= currentWeek; i++) {
      promises.push(
        // UPDATED: Use CACHE_OPTIONS
        fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/transactions/${i}`, CACHE_OPTIONS)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      );
    }

    const results = await Promise.all(promises);
    const allTransactions = results.flat();
    return allTransactions.sort((a, b) => b.created - a.created);

  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

export async function getAllPlayers() {
  try {
    // UPDATED: Use CACHE_OPTIONS
    const response = await fetch('https://api.sleeper.app/v1/players/nfl', CACHE_OPTIONS);
    if (!response.ok) return {};
    return response.json();
  } catch (error) {
    console.error("Error fetching players:", error);
    return {};
  }
}

export async function getLeagueRosters(leagueId: string = LEAGUE_ID) {
  try {
    // UPDATED: Use CACHE_OPTIONS
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`, CACHE_OPTIONS);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Error fetching rosters:", error);
    return [];
  }
}

export async function getLeagueUsers(leagueId: string = LEAGUE_ID) {
  try {
    // UPDATED: Use CACHE_OPTIONS
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`, CACHE_OPTIONS);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export const getRosters = getLeagueRosters;
export const getUsers = getLeagueUsers;

export async function getLeagueInfo(leagueId: string = LEAGUE_ID) {
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`, CACHE_OPTIONS);
  if (!response.ok) throw new Error('Failed to fetch league info');
  return response.json();
}

export async function getLeagueManagers(leagueId: string = LEAGUE_ID) {
  const users = await getLeagueUsers(leagueId) as SleeperUser[];

  return users.reduce((acc: Record<string, ManagerSummary>, user) => {
    acc[user.user_id] = {
      name: user.metadata?.team_name || user.display_name || 'Unknown',
      avatar: user.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null,
    };
    return acc;
  }, {});
}

export const getWinnersBracket = async (leagueId: string = LEAGUE_ID) => {
  // UPDATED: Use CACHE_OPTIONS
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`, CACHE_OPTIONS);
  if (!res.ok) throw new Error('Failed to fetch winners bracket');
  return res.json();
};

export const getLosersBracket = async (leagueId: string = LEAGUE_ID) => {
  // UPDATED: Use CACHE_OPTIONS
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`, CACHE_OPTIONS);
  if (!res.ok) throw new Error('Failed to fetch losers bracket');
  return res.json();
};

export const getMatchups = async (week: number, leagueId: string = LEAGUE_ID) => {
  // UPDATED: Use CACHE_OPTIONS
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`, CACHE_OPTIONS);
  if (!res.ok) throw new Error(`Failed to fetch matchups for week ${week}`);
  return res.json();
};

export const getMatchupsForWeek = getMatchups;

export async function getPlayoffBrackets(leagueId: string = LEAGUE_ID) {
  const [winners, losers] = await Promise.all([
    getWinnersBracket(leagueId),
    getLosersBracket(leagueId),
  ]);

  return { winners, losers };
}

export const getTransactions = async (week: number, leagueId: string = LEAGUE_ID) => {
  // UPDATED: Use CACHE_OPTIONS
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`, CACHE_OPTIONS);
  if (!res.ok) throw new Error(`Failed to fetch transactions for week ${week}`);
  return res.json();
};

async function fetchUserAvatar(userId: string) {
    if (!userId) return "";
    try {
	        // UPDATED: Use CACHE_OPTIONS
	        const response = await fetch(`https://api.sleeper.app/v1/user/${userId}`, CACHE_OPTIONS);
	        if (!response.ok) return "";
	        const data = await response.json() as { avatar?: string | null };
	        return data.avatar ? `https://sleepercdn.com/avatars/thumbs/${data.avatar}` : "";
    } catch (error) {
        console.error(`Error fetching avatar for ${userId}:`, error);
        return "";
    }
}

export async function getChampionDetails(leagueId: string = LEAGUE_ID) {
  const { winnersBracket, rosters, users } = await fetchLeagueYear(leagueId) || {};
  const champMatch = winnersBracket?.find((m) => m.p === 1);
  const champRoster = rosters?.find((r) => r.roster_id === champMatch?.w);
  const champUser = users?.find((u) => u.user_id === champRoster?.owner_id);

  return {
    name: champUser?.display_name || 'Unknown Champion',
    teamName: champUser?.metadata?.team_name || champUser?.display_name || 'Unknown Team',
    avatar: champUser?.avatar
      ? `https://sleepercdn.com/avatars/thumbs/${champUser.avatar}`
      : DEFAULT_OWNER_IMAGE,
  };
}

// --- HARDCODED STATS ---
export async function fetchAllTimeStats() {
  // These arrays rely on manual data but ensure all managers have avatars fetched via the now-uncached fetchUserAvatar
  const highScores: RecordEntry[] = [
    { manager: "Jordan Maslyn", avatar: "", score: 184.44, year: 2024, week: 7 },
    { manager: "Jordan Maslyn", avatar: "", score: 168.08, year: 2024, week: 12 },
    { manager: "MadPanda", avatar: "", score: 162.80, year: 2022, week: 9 },
    { manager: "Tommy Moore", avatar: "", score: 161.42, year: 2021, week: 14 },
    { manager: "drschoppejr", avatar: "", score: 158.20, year: 2023, week: 5 },
    { manager: "Thugnificent", avatar: "", score: 155.10, year: 2019, week: 10 },
  ];

  const lowScores: RecordEntry[] = [
    { manager: "Jordan Maslyn", avatar: "", score: 65.08, year: 2024, week: 8 },
    { manager: "MadPanda", avatar: "", score: 65.10, year: 2022, week: 3 },
    { manager: "stevens247", avatar: "", score: 62.40, year: 2021, week: 6 },
    { manager: "Tommy Moore", avatar: "", score: 58.90, year: 2020, week: 2 },
  ];

  const careerStatsRaw: CareerEntry[] = [
    { manager: "Tommy Moore", userId: "342849293037608960", avatar: "", wins: 68, losses: 35, ties: 0, pointsFor: 11450.50, pointsAgainst: 10200.10, potentialPoints: 12500, seasons: 7 },
    { manager: "Jordan Maslyn", userId: "341412060426436608", avatar: "", wins: 62, losses: 40, ties: 1, pointsFor: 11100.20, pointsAgainst: 10500.40, potentialPoints: 12100, seasons: 7 },
    { manager: "Brian Stevens", userId: "343129212162523136", avatar: "", wins: 59, losses: 44, ties: 0, pointsFor: 10987.65, pointsAgainst: 10100.20, potentialPoints: 11800, seasons: 7 },
    { manager: "Rashad Gresham", userId: "864186418971418624", avatar: "", wins: 55, losses: 48, ties: 0, pointsFor: 10648.78, pointsAgainst: 10400.12, potentialPoints: 11500, seasons: 6 },
    { manager: "Aaron Dogg", userId: "583513420586848256", avatar: "", wins: 53, losses: 50, ties: 0, pointsFor: 10500.10, pointsAgainst: 10600.50, potentialPoints: 11200, seasons: 7 },
    { manager: "Travis Miller", userId: "342831451382841344", avatar: "", wins: 50, losses: 53, ties: 0, pointsFor: 10200.45, pointsAgainst: 10300.22, potentialPoints: 10900, seasons: 7 },
    { manager: "Stan Schoppe", userId: "1260048448384667648", avatar: "", wins: 48, losses: 55, ties: 0, pointsFor: 10150.30, pointsAgainst: 10250.80, potentialPoints: 10850, seasons: 7 },
    { manager: "Doug Fordham", userId: "73400761740312576", avatar: "", wins: 45, losses: 58, ties: 0, pointsFor: 9900.20, pointsAgainst: 10800.10, potentialPoints: 10600, seasons: 7 },
    { manager: "Wade Cameron", userId: "342838548870762496", avatar: "", wins: 42, losses: 61, ties: 0, pointsFor: 9850.10, pointsAgainst: 10950.40, potentialPoints: 10500, seasons: 7 },
    { manager: "JD Dowling", userId: "342850391018356736", avatar: "", wins: 40, losses: 63, ties: 0, pointsFor: 9700.50, pointsAgainst: 11100.60, potentialPoints: 10400, seasons: 7 },
    { manager: "David Besedich", userId: "466663208728391680", avatar: "", wins: 38, losses: 65, ties: 0, pointsFor: 9600.80, pointsAgainst: 11200.90, potentialPoints: 10300, seasons: 7 },
    { manager: "Ray Long", userId: "342828350391230464", avatar: "", wins: 35, losses: 68, ties: 0, pointsFor: 9400.20, pointsAgainst: 11350.50, potentialPoints: 10100, seasons: 7 },
  ];

  const careerStats = await Promise.all(careerStatsRaw.map(async (entry) => {
    if (entry.userId) {
        const realAvatar = await fetchUserAvatar(entry.userId);
        return { ...entry, avatar: realAvatar };
    }
    return entry;
  }));

  return { highScores, lowScores, careerStats };
}

// --- HISTORICAL WINNERS ENGINE ---

async function fetchLeagueYear(leagueId: string) {
  // UPDATED: Use CACHE_OPTIONS
  const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`, CACHE_OPTIONS);
  if (!leagueRes.ok) return null;
  const leagueData = await leagueRes.json() as SleeperLeague;

  const [winnersRes, losersRes, rostersRes, usersRes] = await Promise.all([
    // UPDATED: Use CACHE_OPTIONS for all sub-fetches
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`, CACHE_OPTIONS),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`, CACHE_OPTIONS),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`, CACHE_OPTIONS),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`, CACHE_OPTIONS)
  ]);

  const winnersBracket = winnersRes.ok ? await winnersRes.json() as BracketMatch[] : [];
  const losersBracket = losersRes.ok ? await losersRes.json() as BracketMatch[] : [];
  const rosters = rostersRes.ok ? await rostersRes.json() as SleeperRoster[] : [];
  const users = usersRes.ok ? await usersRes.json() as SleeperUser[] : [];

  return { leagueData, winnersBracket, losersBracket, rosters, users };
}

export async function getLeagueHistoryAwards() {
  let currentId: string = LEAGUE_ID;
  const awards: Award[] = [];

  while (currentId) {
    try {
      const data = await fetchLeagueYear(currentId);
      if (!data) break;

      const { leagueData, winnersBracket, losersBracket, rosters, users } = data;
      const year = parseInt(leagueData.season);

      const ownerMap: Record<number, ManagerSummary> = {};
      rosters.forEach((r) => {
        const user = users.find((u) => u.user_id === r.owner_id);
        ownerMap[r.roster_id] = {
            name: user ? (user.display_name || "Unknown") : "Unknown",
            avatar: user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null
        };
      });

      const champMatch = winnersBracket.find((m) => m.p === 1); 
      if (champMatch) {
         const winner = typeof champMatch.w === 'number' ? ownerMap[champMatch.w] || { name: "Unknown", avatar: null } : { name: "Unknown", avatar: null };
         const runner = typeof champMatch.l === 'number' ? ownerMap[champMatch.l] || { name: "Unknown", avatar: null } : { name: "Unknown", avatar: null };
         awards.push({ year, type: 'champion', manager: winner.name, avatar: winner.avatar });
         awards.push({ year, type: 'runner_up', manager: runner.name, avatar: runner.avatar });
      }

      const thirdMatch = winnersBracket.find((m) => m.p === 3);
      if (thirdMatch) {
         const third = typeof thirdMatch.w === 'number' ? ownerMap[thirdMatch.w] || { name: "Unknown", avatar: null } : { name: "Unknown", avatar: null };
         awards.push({ year, type: 'third_place', manager: third.name, avatar: third.avatar });
      }

      const toiletMatch = losersBracket.find((m) => m.p === 1);
      if (toiletMatch) {
        const toilet = typeof toiletMatch.w === 'number' ? ownerMap[toiletMatch.w] || { name: "Unknown", avatar: null } : { name: "Unknown", avatar: null };
        awards.push({ year, type: 'toilet_bowl', manager: toilet.name, avatar: toilet.avatar });
      }

      currentId = leagueData.previous_league_id || '';
      if (year < 2018) break; 

    } catch (e) {
      console.error("Error fetching history for league " + currentId, e);
      break;
    }
  }

  return awards;
}

// --- DRAFT HISTORY FETCHING (UPDATED FOR BOARD) ---

export async function getAllDrafts() {
  let currentLeagueId: string = LEAGUE_ID;
  const draftsData: DraftHistorySeason[] = [];

  // Loop back until 2018
  while (currentLeagueId) {
    try {
      // UPDATED: Use CACHE_OPTIONS
      const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`, CACHE_OPTIONS);
      if (!leagueRes.ok) break;
	      const league = await leagueRes.json() as SleeperLeague;
      
      const year = league.season; 

      // UPDATED: Use CACHE_OPTIONS
      const draftsRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/drafts`, CACHE_OPTIONS);
	      const drafts = await draftsRes.json() as SleeperDraft[];
	      
	      const mainDraft = drafts.find((d) => d.status === 'complete' && (d.settings?.rounds || 0) > 3) || drafts[0];

      if (mainDraft) {
        // UPDATED: Use CACHE_OPTIONS
        const picksRes = await fetch(`https://api.sleeper.app/v1/draft/${mainDraft.draft_id}/picks`, CACHE_OPTIONS);
	        const picks = await picksRes.json() as unknown[];

        // UPDATED: Use CACHE_OPTIONS
        const usersRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/users`, CACHE_OPTIONS);
	        const users = await usersRes.json() as SleeperUser[];
        
        // UPDATED: Use CACHE_OPTIONS
        const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/rosters`, CACHE_OPTIONS);
	        const rosters = await rostersRes.json() as SleeperRoster[];

	        // 1. Map Owner IDs to User Data
	        const userMap: Record<string, SleeperUser> = {};
	        users.forEach((u) => {
	            userMap[u.user_id] = u;
	        });

	        // 2. Map Roster IDs to Team Data
	        const ownerMap: Record<number, ManagerSummary> = {};
	        rosters.forEach((r) => {
	            const user = userMap[r.owner_id];
	            ownerMap[r.roster_id] = {
                name: user?.metadata?.team_name || user?.display_name || `Team ${r.roster_id}`,
                avatar: user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null
            };
        });

        // 3. Map Draft Slots to Roster IDs
        const slotToRoster: Record<number, number> = {};
        if (mainDraft.draft_order) {
            Object.entries(mainDraft.draft_order).forEach(([rosterIdStr, slot]) => {
                const rId = parseInt(rosterIdStr);
                const s = slot as number;
                slotToRoster[s] = rId;
            });
        }

        draftsData.push({
          year,
          draft_id: mainDraft.draft_id,
          settings: mainDraft.settings,
          picks: picks,
          teams: ownerMap, 
          slot_to_roster: slotToRoster 
        });
      }

      if (year === '2018' || !league.previous_league_id) break;
      currentLeagueId = league.previous_league_id;

    } catch (error) {
      console.error(`Error fetching draft for league ${currentLeagueId}:`, error);
      break;
    }
  }

  return draftsData.sort((a, b) => b.year.localeCompare(a.year)); 
}
