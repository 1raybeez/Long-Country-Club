'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, Trophy, Loader2, Crown, TrendingUp, Zap, ChevronDown, ChevronUp,
  ArrowDown, History
} from 'lucide-react';

const COMMISH_ID = "342828350391230464"; 
const START_YEAR = 2011; 
const END_YEAR = 2025; 

const REAL_NAMES: Record<string, string> = {
  "73400761740312576": "Doug Fordham",
  "341412060426436608": "Jordan Maslyn",
  "469199353672626176": "Landon Elliott",
  "342828350391230464": "Ray Long",
  "356621920969555968": "Jeffrey Hudgins",
  "342831451382841344": "Travis Miller",
  "342838548870762496": "Wade Cameron",
  "342849293037608960": "Tommy Moore",
  "342850391018356736": "JD Dowling",
  "343129212162523136": "Brian Stevens",
  "466663208728391680": "David Besedich",
  "583513420586848256": "Aaron Dogg",
  "864186418971418624": "Rashad Gresham",
  "1260048448384667648": "Stan Schoppe",
  "556676922517524480": "Adam Lind",
  "470428278931320832": "Billy Biddle",
  "345934777502699520": "Chris Barras",
  "98907192333582336": "Ricky Taylor",
  "342831898403377152": "Patrick Leahey"
};

export default function ArchivesPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [seasonRecords, setSeasonRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const aggregated: Record<string, any> = {};
      const allSeasonsList: any[] = [];
      const masterUserMap: Record<string, any> = {};
      
      try {
        for (let year = END_YEAR; year >= START_YEAR; year--) {
          setProgress(`Analyzing ${year} Season...`);
          const leagueRes = await fetch(`https://api.sleeper.app/v1/user/${COMMISH_ID}/leagues/nfl/${year}`);
          const leagues = await leagueRes.json();
          const myLeague = leagues.find((l: any) => l.name.toLowerCase().includes("long country") || l.name.toLowerCase().includes("lcc"));

          if (!myLeague) continue;

          const [rostersRes, usersRes] = await Promise.all([
            fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/rosters`),
            fetch(`https://api.sleeper.app/v1/league/${myLeague.league_id}/users`)
          ]);

          const rosters = await rostersRes.json();
          const users = await usersRes.json();

          users.forEach((u: any) => {
            if (!masterUserMap[u.user_id]) {
              masterUserMap[u.user_id] = { name: u.metadata?.team_name || u.display_name, avatar: u.avatar };
            }
          });

          rosters.forEach((r: any) => {
            const uid = r.owner_id;
            if (!uid) return;
            const profile = masterUserMap[uid] || { name: "Unknown", avatar: null };
            const realName = REAL_NAMES[uid] || profile.name; 

            if (!aggregated[uid]) {
              aggregated[uid] = { id: uid, realName, teamName: profile.name, avatar: profile.avatar, wins: 0, losses: 0, ties: 0, fpts: 0, ppts: 0, seasons: 0 };
            }
            
            aggregated[uid].wins += r.settings.wins || 0;
            aggregated[uid].losses += r.settings.losses || 0;
            aggregated[uid].ties += r.settings.ties || 0;
            aggregated[uid].fpts += (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100;
            aggregated[uid].ppts += (r.settings.ppts || 0) + (r.settings.ppts_decimal || 0) / 100;
            aggregated[uid].seasons += 1;
            
            if (r.settings.fpts > 0) {
              allSeasonsList.push({ id: uid, realName, teamName: profile.name, avatar: profile.avatar, year, fpts: (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100 });
            }
          });
        }
        setStats(Object.values(aggregated));
        setSeasonRecords(allSeasonsList);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A472A] pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="flex items-center justify-between mb-12">
          <Link href="/league-info" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#C5A059] transition-all">
            <ArrowLeft className="w-4 h-4" /> Clubhouse Hub
          </Link>
          <div className="text-right">
             <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">League <span className="text-[#C5A059]">Archives</span></h1>
             <p className="text-[10px] font-bold uppercase opacity-40 mt-1">LCC Statistical History</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1A472A]" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">{progress}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <LeaderCard id="wins" title="All-Time Wins" icon={Trophy} color="bg-yellow-500" data={[...stats].sort((a,b) => b.wins - a.wins)} val={(m: any) => m.wins} label="Wins" exp={expandedCard} setExp={setExpandedCard} />
             <LeaderCard id="points" title="All-Time Points" icon={TrendingUp} color="bg-green-500" data={[...stats].sort((a,b) => b.fpts - a.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
             <LeaderCard id="best_season" title="Best Season" icon={History} color="bg-orange-500" data={[...seasonRecords].sort((a,b) => b.fpts - a.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
             <LeaderCard id="worst_season" title="Lowest Season" icon={ArrowDown} color="bg-red-500" data={[...seasonRecords].filter(m => m.fpts > 500).sort((a,b) => a.fpts - b.fpts)} val={(m: any) => m.fpts.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Points" exp={expandedCard} setExp={setExpandedCard} />
             <LeaderCard id="winpct" title="Best Win %" icon={Crown} color="bg-purple-500" data={[...stats].filter(s => s.seasons >= 2).sort((a,b) => (b.wins/(b.wins+b.losses)) - (a.wins/(a.wins+a.losses)))} val={(m: any) => ((m.wins / (m.wins + m.losses)) * 100).toFixed(1) + "%"} label="Win Pct" exp={expandedCard} setExp={setExpandedCard} />
             <LeaderCard id="efficiency" title="Lineup Efficiency" icon={Zap} color="bg-blue-500" data={[...stats].filter(s => s.ppts > 0).sort((a,b) => (b.fpts/b.ppts) - (a.fpts/a.ppts))} val={(m: any) => ((m.fpts / m.ppts) * 100).toFixed(1) + "%"} label="Start %" exp={expandedCard} setExp={setExpandedCard} />
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderCard({ id, title, icon: Icon, color, data, val, label, exp, setExp }: any) {
  const isExp = exp === id;
  const list = isExp ? data : data.slice(0, 5);
  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`p-6 ${color} text-white flex items-center gap-3`}>
        <div className="p-2 bg-white/20 rounded-lg"><Icon className="w-5 h-5 text-white" /></div>
        <h3 className="font-black uppercase tracking-widest text-xs leading-none">{title}</h3>
      </div>
      <div className="divide-y divide-black/5 flex-grow">
        {list.map((m: any, i: number) => (
          <div key={`${m.id}-${m.year || 'all'}`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-4 overflow-hidden">
               <span className={`font-black text-sm w-4 text-center ${i === 0 ? 'text-[#C5A059]' : 'text-gray-300'}`}>{i + 1}</span>
               <div className="w-10 h-10 rounded-full bg-[#1A472A]/5 overflow-hidden relative border border-black/5 shrink-0">
                  {m.avatar ? <img src={`https://sleepercdn.com/avatars/thumbs/${m.avatar}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-xs">{m.realName.charAt(0)}</div>}
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="font-black text-xs uppercase truncate leading-none mb-1">{m.realName}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase truncate italic leading-none">{m.teamName} {m.year && `• ${m.year}`}</span>
               </div>
            </div>
            <div className="text-right">
               <span className="block font-black text-sm leading-none">{val(m)}</span>
               <span className="text-[7px] font-black uppercase text-gray-400 leading-none">{label}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setExp(isExp ? null : id)} className="w-full py-4 bg-gray-50 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-all flex items-center justify-center gap-1">
        {isExp ? 'Show Less' : 'View Full Ranks'} {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </div>
  );
}