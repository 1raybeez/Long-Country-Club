'use client';

import { useEffect, useState } from 'react';
import { 
  getRecentTransactions, 
  getAllPlayers, 
  getLeagueRosters, 
  getLeagueUsers,
  type Transaction 
} from '@/lib/sleeper';
import { RefreshCw, ArrowRightLeft, UserPlus, UserMinus, ChevronDown, ChevronUp, MoveRight } from 'lucide-react';
import Image from 'next/image';

export default function ActivityFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [rosters, setRosters] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [expandWaivers, setExpandWaivers] = useState(false);
  const [expandTrades, setExpandTrades] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txData, playersData, rostersData, usersData] = await Promise.all([
          getRecentTransactions(),
          getAllPlayers(),
          getLeagueRosters(),
          getLeagueUsers()
        ]);

        const usersMap = usersData.reduce((acc: any, user: any) => {
          acc[user.user_id] = user;
          return acc;
        }, {});

        setTransactions(txData);
        setPlayers(playersData);
        setRosters(rostersData);
        setUsers(usersMap);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- HELPERS ---
  const getTeamName = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster || !roster.owner_id) return `Team ${rosterId}`;
    const user = users[roster.owner_id];
    return user?.metadata?.team_name || user?.display_name || `Team ${rosterId}`;
  };

  const getTeamAvatar = (rosterId: number) => {
     const roster = rosters.find(r => r.roster_id === rosterId);
     if (!roster || !roster.owner_id) return null;
     const user = users[roster.owner_id];
     return user?.avatar || null;
  }

  if (loading) return <div className="text-gray-500 text-center py-4">Loading activity...</div>;

  const allWaivers = transactions.filter((t) => t.type !== 'trade');
  const allTrades = transactions.filter((t) => t.type === 'trade');

  const displayedWaivers = expandWaivers ? allWaivers : allWaivers.slice(0, 3);
  const displayedTrades = expandTrades ? allTrades : allTrades.slice(0, 3);

  return (
    <div className="space-y-8">
      
      {/* --- SECTION 1: WAIVERS --- */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Recent Waiver Moves
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {displayedWaivers.length > 0 ? (
            displayedWaivers.map((tx) => (
              <WaiverItem 
                key={tx.transaction_id} 
                tx={tx} 
                players={players} 
                teamName={getTeamName(tx.roster_ids[0])}
                teamAvatar={getTeamAvatar(tx.roster_ids[0])}
              />
            ))
          ) : (
            <p className="p-4 text-gray-500 text-sm italic">No recent waiver activity.</p>
          )}
        </div>
        {allWaivers.length > 3 && (
          <button 
            onClick={() => setExpandWaivers(!expandWaivers)}
            className="w-full p-3 text-sm text-center text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-center items-center gap-1"
          >
            {expandWaivers ? <>Show Less <ChevronUp className="w-4 h-4" /></> : <>View More ({allWaivers.length - 3} hidden) <ChevronDown className="w-4 h-4" /></>}
          </button>
        )}
      </div>

      {/* --- SECTION 2: TRADES (NEW DESIGN) --- */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            Recent Trades
          </h3>
        </div>
        <div className="p-4 space-y-6">
          {displayedTrades.length > 0 ? (
            displayedTrades.map((tx) => (
              <TradeCard 
                key={tx.transaction_id}
                tx={tx}
                players={players}
                getTeamName={getTeamName}
                getTeamAvatar={getTeamAvatar}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No recent trades.</p>
          )}
        </div>
        {allTrades.length > 3 && (
          <button 
            onClick={() => setExpandTrades(!expandTrades)}
            className="w-full p-3 text-sm text-center text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-center items-center gap-1 border-t border-gray-200 dark:border-gray-800"
          >
            {expandTrades ? <>Show Less <ChevronUp className="w-4 h-4" /></> : <>View More ({allTrades.length - 3} hidden) <ChevronDown className="w-4 h-4" /></>}
          </button>
        )}
      </div>

    </div>
  );
}

// --- COMPONENT: WAIVER ITEM ---
function WaiverItem({ tx, players, teamName, teamAvatar }: any) {
  const date = new Date(tx.created).toLocaleDateString() + ' ' + new Date(tx.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avatarUrl = teamAvatar ? `https://sleepercdn.com/avatars/thumbs/${teamAvatar}` : null;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
            {avatarUrl && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                </div>
            )}
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{teamName}</span>
        </div>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
      <div className="flex flex-col gap-2">
        {Object.keys(tx.adds || {}).map((playerId) => (
           <PlayerRow key={playerId} playerId={playerId} player={players[playerId]} type="add" />
        ))}
        {Object.keys(tx.drops || {}).map((playerId) => (
           <PlayerRow key={playerId} playerId={playerId} player={players[playerId]} type="drop" />
        ))}
      </div>
    </div>
  );
}

// --- COMPONENT: TRADE CARD (NEW DESIGN) ---
function TradeCard({ tx, players, getTeamName, getTeamAvatar }: any) {
  const date = new Date(tx.created).toLocaleDateString();
  
  // Identify the two teams involved
  const rosterA = tx.roster_ids[0];
  const rosterB = tx.roster_ids[1];

  // Helper to find what a specific roster RECEIVED
  const getAssetsReceived = (rosterId: number) => {
    const receivedPlayers = Object.keys(tx.adds || {}).filter(pid => tx.adds[pid] === rosterId);
    const receivedPicks = (tx.draft_picks || []).filter((p: any) => p.owner_id === rosterId);
    return { players: receivedPlayers, picks: receivedPicks };
  };

  const assetsA = getAssetsReceived(rosterA);
  const assetsB = getAssetsReceived(rosterB);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] shadow-sm">
      
      {/* HEADER: Team vs Team */}
      <div className="flex relative">
        {/* Team A Header */}
        <div className="flex-1 p-3 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#252525] border-b-2 border-blue-500">
           <TeamHeader rosterId={rosterA} getTeamName={getTeamName} getTeamAvatar={getTeamAvatar} />
        </div>
        
        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded-full border-2 border-white dark:border-gray-900">
          VS
        </div>

        {/* Team B Header */}
        <div className="flex-1 p-3 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#252525] border-b-2 border-orange-500">
           <TeamHeader rosterId={rosterB} getTeamName={getTeamName} getTeamAvatar={getTeamAvatar} />
        </div>
      </div>

      {/* BODY: Assets Exchanged */}
      <div className="flex divide-x divide-gray-200 dark:divide-gray-700">
        
        {/* Team A Gets */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <p className="text-[10px] uppercase font-bold text-gray-400 text-center mb-1">Received</p>
          {assetsA.players.map((pid: string) => (
             <TradeAsset key={pid} playerId={pid} player={players[pid]} />
          ))}
          {assetsA.picks.map((pick: any, i: number) => (
             <PickAsset key={i} pick={pick} />
          ))}
          {assetsA.players.length === 0 && assetsA.picks.length === 0 && <p className="text-xs text-gray-500 text-center">-</p>}
        </div>

        {/* Team B Gets */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <p className="text-[10px] uppercase font-bold text-gray-400 text-center mb-1">Received</p>
          {assetsB.players.map((pid: string) => (
             <TradeAsset key={pid} playerId={pid} player={players[pid]} />
          ))}
           {assetsB.picks.map((pick: any, i: number) => (
             <PickAsset key={i} pick={pick} />
          ))}
          {assetsB.players.length === 0 && assetsB.picks.length === 0 && <p className="text-xs text-gray-500 text-center">-</p>}
        </div>

      </div>

      {/* FOOTER: Date */}
      <div className="text-center py-2 bg-gray-100 dark:bg-[#252525] border-t border-gray-200 dark:border-gray-700">
        <p className="text-[10px] text-gray-400 font-mono">{date}</p>
      </div>

    </div>
  );
}

// --- SUB-COMPONENTS FOR TRADES ---

function TeamHeader({ rosterId, getTeamName, getTeamAvatar }: any) {
    const avatar = getTeamAvatar(rosterId);
    const avatarUrl = avatar ? `https://sleepercdn.com/avatars/thumbs/${avatar}` : null;
    return (
        <>
            <div className="relative w-10 h-10 mb-2 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt="Team" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs">?</div>
                )}
            </div>
            <p className="text-xs font-bold text-center leading-tight truncate w-full px-2">
                {getTeamName(rosterId)}
            </p>
        </>
    )
}

function TradeAsset({ playerId, player }: any) {
    const getImageUrl = (pid: string) => {
        if (!isNaN(Number(pid))) return `https://sleepercdn.com/content/nfl/players/thumb/${pid}.jpg`;
        return `https://sleepercdn.com/images/team_logos/nfl/${pid.toLowerCase()}.png`;
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                 <Image src={getImageUrl(playerId)} alt="Player" fill className="object-cover" />
            </div>
            <div className="text-center">
                <p className="text-xs font-bold">{player ? `${player.first_name} ${player.last_name}` : 'Unknown'}</p>
                <p className="text-[10px] text-gray-500">{player?.position} - {player?.team}</p>
            </div>
        </div>
    )
}

function PickAsset({ pick }: any) {
    return (
        <div className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold">{pick.season} Round {pick.round}</p>
            <p className="text-[10px] text-gray-500">Original: Team {pick.roster_id}</p>
        </div>
    )
}

// --- PLAYER ROW (FOR WAIVERS) ---
function PlayerRow({ playerId, player, type }: any) {
    const getImageUrl = (pid: string) => {
        if (!isNaN(Number(pid))) return `https://sleepercdn.com/content/nfl/players/thumb/${pid}.jpg`;
        return `https://sleepercdn.com/images/team_logos/nfl/${pid.toLowerCase()}.png`;
      };
    
    const isAdd = type === 'add';
    const Icon = isAdd ? UserPlus : UserMinus;
    const colorClass = isAdd ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
    const darkColorClass = isAdd ? 'dark:text-green-400 dark:bg-green-900/20 dark:border-green-900/50' : 'dark:text-red-400 dark:bg-red-900/20 dark:border-red-900/50';

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg border ${colorClass} ${darkColorClass}`}>
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                 <Image src={getImageUrl(playerId)} alt="Player" fill className="object-cover" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold">{player ? `${player.first_name} ${player.last_name}` : playerId}</p>
                <p className="text-[10px] opacity-70">{player?.position} - {player?.team}</p>
            </div>
            <Icon className="w-4 h-4 opacity-70" />
        </div>
    )
}