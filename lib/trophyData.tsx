'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Trophy, Crown, Medal, Award, User, Loader2 } from 'lucide-react';
import { getLeagueHistoryAwards, type Award as LeagueAward } from '@/lib/sleeper';
import { DEFAULT_OWNER_IMAGE, getOwnerImagePath } from '@/lib/ownerImages';

// --- CENTRAL MANAGER MAP (for names/avatars) ---
// In a real application, this would come from a separate imported file.
const MANAGER_MAP = {
    "Jordan Maslyn": { name: "Jordan", avatar: DEFAULT_OWNER_IMAGE },
    "Tommy Moore": { name: "Tommy", avatar: DEFAULT_OWNER_IMAGE },
    "Brian Stevens": { name: "Brian", avatar: DEFAULT_OWNER_IMAGE },
    "Dave Besedich": { name: "Dave", avatar: DEFAULT_OWNER_IMAGE },
    "JD Dowling": { name: "JD", avatar: DEFAULT_OWNER_IMAGE },
    "Wade Cameron": { name: "Wade", avatar: DEFAULT_OWNER_IMAGE },
    "Ray Long": { name: "Ray", avatar: getOwnerImagePath("ray-long") },
    "Doug Fordham": { name: "Doug", avatar: DEFAULT_OWNER_IMAGE },
    "Gordie Gahagan": { name: "Gordie", avatar: DEFAULT_OWNER_IMAGE },
    "Bryan Doane": { name: "Bryan", avatar: DEFAULT_OWNER_IMAGE },
    "Keith Polarek": { name: "Keith", avatar: DEFAULT_OWNER_IMAGE },
    // Fallbacks
    "Minnix": { name: "Minnix", avatar: null },
    "Garet": { name: "Garet", avatar: null },
    "Chris": { name: "Chris", avatar: null },
    "Nicholas": { name: "Nicholas", avatar: null },
    "Zach": { name: "Zach", avatar: null },
    "Landon": { name: "Landon", avatar: null },
};

// Helper to safely get manager details (name/avatar)
const getManagerDetails = (rawName: string | undefined) => {
    if (!rawName) return { name: 'Unknown', avatar: null };

    // Check main names first (by lowercasing to handle minor variations)
    const exactMatch = Object.keys(MANAGER_MAP).find(k => k.toLowerCase() === rawName.toLowerCase());
    if (exactMatch) {
        return MANAGER_MAP[exactMatch as keyof typeof MANAGER_MAP];
    }

    // Attempt to resolve known Sleeper display names to common names (e.g., Sleeper name "The Commish" -> "Ray")
    // NOTE: This logic needs to be robust, but here we just return the name for now.

    return { name: rawName.split(' ')[0] || rawName, avatar: null };
};

interface TrophySeason {
    year: number;
    leagueName: string;
    champion: string;
    runnerUp: string;
    thirdPlace: string;
    notes: string;
    avatar?: string | null;
}

// --- RESTORED MANUAL DATA (2011-2018) ---
const MANUAL_ARCHIVES_OLD: TrophySeason[] = [
    { year: 2018, leagueName: "Area 10 FFL", champion: "Brian Stevens", runnerUp: "Tommy Moore", thirdPlace: "Ray Long", notes: "Final season as Area 10 FFL." },
    { year: 2017, leagueName: "Area 10 FFL", champion: "Tommy Moore", runnerUp: "JD Dowling", thirdPlace: "Minnix", notes: "" },
    { year: 2016, leagueName: "Area 10 FFL", champion: "Tommy Moore", runnerUp: "Minnix", thirdPlace: "Ray Long", notes: "" },
    { year: 2015, leagueName: "Area 10 FFL", champion: "Keith Polarek", runnerUp: "JD Dowling", thirdPlace: "Tommy Moore", notes: "" },
    { year: 2014, leagueName: "Area 10 FFL", champion: "Garet", runnerUp: "Gordie Gahagan", thirdPlace: "Keith Polarek", notes: "" },
    { year: 2013, leagueName: "Area 10 FFL", champion: "Tommy Moore", runnerUp: "Minnix", thirdPlace: "Bryan Doane", notes: "" },
    { year: 2012, leagueName: "Area 10 FFL", champion: "Bryan Doane", runnerUp: "Chris", thirdPlace: "Nicholas", notes: "" },
    { year: 2011, leagueName: "Area 10 FFL", champion: "Gordie Gahagan", runnerUp: "Wade Cameron", thirdPlace: "Zach", notes: "The Original Area 10 FFL Season." },
];

export default function TrophyRoomPage() {
    const [fullHistory, setFullHistory] = useState<TrophySeason[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to get award manager from API results
    const getApiManager = (year: number, type: 'runner_up' | 'third_place', apiAwards: LeagueAward[]) => {
        return apiAwards.find(a => a.year === year && a.type === type)?.manager || 'Unknown';
    };

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                // 1. Fetch modern history (2018-Present) from API
                const apiAwards = await getLeagueHistoryAwards();

                // 2. Format the API results (2018-Present)
                const modernHistory: TrophySeason[] = apiAwards
                    .filter(a => a.type === 'champion')
                    .map(champ => {
                        const champDetails = getManagerDetails(champ.manager);
                        return {
                            year: champ.year,
                            leagueName: "River City FFL",
                            champion: champDetails.name,
                            avatar: champDetails.avatar || champ.avatar, // Use local avatar if available, otherwise API avatar
                            runnerUp: getApiManager(champ.year, 'runner_up', apiAwards),
                            thirdPlace: getApiManager(champ.year, 'third_place', apiAwards),
                            notes: champ.year >= 2019 ? `Season ${champ.year} Champion.` : `Final A10 Season.`,
                        };
                    });

                // 3. Merge API history (newest) with manual history (oldest)
                const mergedHistory = [...modernHistory, ...MANUAL_ARCHIVES_OLD]
                    .sort((a, b) => b.year - a.year); // Sort newest first

                // 4. Deduplicate by year and set the final list
                const finalHistory = Array.from(new Map(mergedHistory.map(item => [item.year, item])).values());

                setFullHistory(finalHistory);

            } catch (e) {
                console.error("Failed to load full history:", e);
                // Fallback rendering is handled by loading state
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white p-6 pb-20 transition-colors duration-300">

      {/* HEADER */}
      <div className="max-w-4xl mx-auto pt-6 mb-12">
        <Link
          href="/league-info"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-white transition mb-6 group"
        >
           <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
           Back to League Info
        </Link>

        <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 dark:bg-orange-600/20 rounded-2xl text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/30">
                <Trophy size={40} />
            </div>
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Trophy Room</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Hall of Champions (2011–Present)</p>
            </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
            <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-600" /><p className="mt-4 text-gray-500">Loading League History...</p></div>
        ) : (
            fullHistory.map((season) => {
              const championDetails = getManagerDetails(season.champion);
              const runnerUpDetails = getManagerDetails(season.runnerUp);
              const thirdPlaceDetails = getManagerDetails(season.thirdPlace);

              // Use local avatar if present in map, otherwise use API/fallback path
              const finalAvatar = championDetails.avatar || season.avatar;

              return (
              <div
                key={season.year}
                className="group relative bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md overflow-hidden"
              >
                {/* Background Year Number */}
                <div className="absolute -right-4 -bottom-8 text-9xl font-black text-gray-100 dark:text-white/[0.03] select-none pointer-events-none group-hover:text-gray-200 dark:group-hover:text-white/[0.05] transition-colors">
                    {season.year}
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">

                    {/* YEAR & LOGO BLOCK */}
                    <div className="flex flex-col items-center justify-center min-w-[100px] text-center">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">{season.year}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full mt-2 ${
                            season.leagueName === "River City FFL"
                            ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10"
                        }`}>
                            {season.leagueName === "River City FFL" ? "RC FFL" : "A10 FFL"}
                        </span>
                    </div>

                    {/* CHAMPION DETAILS */}
                    <div className="flex-grow w-full md:w-auto text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1 text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-xs">
                            <Crown size={14} /> Champion
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{championDetails.name}</h3>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {/* Runner Up */}
                            <div className="flex items-center gap-1">
                                <Medal size={16} className="text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-500">2nd:</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{runnerUpDetails.name}</span>
                            </div>

                            {/* 3rd Place */}
                            <div className="flex items-center gap-1">
                                <Award size={16} className="text-amber-700" />
                                <span className="text-gray-500 dark:text-gray-500">3rd:</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{thirdPlaceDetails.name}</span>
                            </div>
                        </div>

                            {season.notes && (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-white/10 pl-3">
                                &quot;{season.notes}&quot;
                            </p>
                        )}
                    </div>

                    {/* AVATAR */}
                    <div className="hidden sm:block">
                         <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-[#121212] overflow-hidden shadow-xl bg-gray-200 dark:bg-[#121212] relative flex items-center justify-center">
                            {finalAvatar ? (
                                <Image
                                    src={finalAvatar}
                                    alt={championDetails.name}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <User size={40} className="text-gray-400 dark:text-gray-600" />
                            )}
                         </div>
                    </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
