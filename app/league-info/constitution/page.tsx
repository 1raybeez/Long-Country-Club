'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Scale, ChevronDown, ChevronUp, Search, 
  ClipboardList, Settings, Zap, CheckCircle2, 
  AlertCircle, Handshake, Trophy, Siren, History,
  Diamond
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

export default function ConstitutionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<number[]>([]);

  const toggleSection = (id: number) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const sections = [
    {
      title: "1. League Governance & Membership",
      icon: <Scale className="text-blue-500" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 shadow-sm">
            <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <span className="font-black text-gray-900 dark:text-white">Commissioner Authority:</span> The Commissioner (The Commish) retains final authority over all disputes, rule interpretations, and disciplinary actions not explicitly covered here. The Commish will always act to preserve the league's longevity and competitive fairness.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-black text-sm sm:text-base">1.1 Entry Fees & Deadlines</h4>
              <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li>• <span className="font-bold text-gray-900 dark:text-white">Entry Fee:</span> $50.00 per team.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Auctioneer Fee:</span> $5.00 per team (Cash/Venmo to Commish for draft day food/drinks).</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Deadline:</span> All fees are due <span className="text-red-600 font-black italic underline decoration-red-600 underline-offset-2">one week prior to the draft</span>.</li>
                <li className="pl-4 border-l-2 border-gray-200 dark:border-white/10 italic">
                  <span className="font-bold text-gray-900 dark:text-white not-italic">Loophole Closure:</span> Failure to pay by the deadline will result in a <span className="font-bold text-gray-900 dark:text-white">locked roster</span> (no moves allowed). If fees remain unpaid by kickoff of Week 1, the team forfeits all games until payment is received. Retroactive wins will <span className="italic">not</span> be awarded.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">1.2 Spring Owners Meeting</h4>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Held annually in late March/Early April (In-person/Zoom). A minimum of 8 owners is required for a quorum. Rule changes proposed here are voted on immediately via Google Form.
              </p>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">1.3 Leaving the League</h4>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Owners must provide 30 days' notice prior to the draft if leaving. Abandoning a team mid-season results in a permanent ban and forfeiture of all fees.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. The Draft & Keepers",
      icon: <ClipboardList className="text-orange-500" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white">
          <div className="space-y-4">
            <div>
              <h4 className="font-black text-sm sm:text-base">2.1 Draft Logistics</h4>
              <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li>• <span className="font-bold text-gray-900 dark:text-white">Date:</span> Labor Day Weekend (Friday @ 5:00 PM est typically).</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Location:</span> The Answer Brewpub (or designated venue).</li>
                <li>
                  • <span className="font-bold text-gray-900 dark:text-white">Format:</span> Snake Draft. 2 minutes per pick. 
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                    <CheckCircle2 size={10} /> Sleeper Setting
                  </span>
                </li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Attendance:</span> Mandatory. If you cannot attend, you must find a proxy drafter or you forfeit your spot in the league.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">2.2 Draft Order</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-white">Non-Playoff Teams (1-6):</span> Determined by the inverse of Regular Season standings (Toilet Bowl winner gets 1.01).
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-white">Playoff Teams (7-12):</span> Determined by Playoff finish (Champion picks 1.12).
              </p>
            </div>

            <hr className="border-gray-100 dark:border-white/5" />

            <div>
              <h4 className="font-black text-sm sm:text-base">2.3 Keeper Rules (Dynasty Hybrid)</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Teams may keep a maximum of <span className="font-bold text-gray-900 dark:text-white">2 players</span> (1 per position maximum). Keepers lock at the start of the draft.
              </p>

              <div className="mt-4 p-4 sm:p-5 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30 shadow-sm text-xs sm:text-sm">
                <h5 className="font-black text-xs sm:text-sm text-yellow-800 dark:text-yellow-500 uppercase tracking-tight mb-3">Eligibility "Loophole Closure": <span className="text-[10px] font-normal capitalize">To be eligible as a keeper, a player MUST:</span></h5>
                <ol className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex gap-2">1. <span>Have been in your <span className="font-bold text-gray-900 dark:text-white uppercase">starting lineup</span> at least once during the Regular Season.</span></li>
                  <li className="flex gap-2">2. <span><span className="font-bold text-gray-900 dark:text-white uppercase">NOT</span> be on IR when started.</span></li>
                  <li className="flex gap-2">3. <span><span className="font-bold text-gray-900 dark:text-white uppercase">NOT</span> have been dropped to waivers by another owner due to season-ending injury.</span></li>
                </ol>
              </div>

              <p className="mt-4 font-bold text-xs sm:text-sm">
                Cost: <span className="font-normal text-gray-600 dark:text-gray-400">A keeper's draft cost increases by <span className="font-black text-gray-900 dark:text-white">$10</span> (Auction value equivalent) from the prior year.</span>
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "3. Roster & Scoring Settings",
      icon: <Settings className="text-gray-500" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white">
          <div className="space-y-6">
            <div>
              <h4 className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                3.1 Roster Composition
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                  <CheckCircle2 size={10} /> Sleeper Setting
                </span>
              </h4>
              <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-white">16 Total Players + 2 IR Slots</p>
              
              <div className="mt-3 p-3 sm:p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between px-2"><span>1 QB</span><span>2 RB</span></div>
                  <div className="flex justify-between px-2"><span>2 WR</span><span>1 TE</span></div>
                  <div className="flex justify-between px-2"><span>2 FLEX</span><span>1 K</span></div>
                  <div className="flex justify-between px-2"><span>1 DEF</span><span>6 BN</span></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">3.2 IR Slot Usage</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                Only players designated as IR, OUT, or PUP by the NFL are eligible.
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white">Loophole Closure:</span> If a player loses their IR status, you must remove them from the slot by <span className="font-bold text-orange-600 underline decoration-orange-500 underline-offset-2 italic">Tuesday morning</span>. Failure to do so will result in a <span className="font-bold text-gray-900 dark:text-white">locked roster</span>.
              </p>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                3.3 Scoring (Half-PPR)
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                  <CheckCircle2 size={10} /> Sleeper Setting
                </span>
              </h4>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li>• <span className="font-bold text-gray-900 dark:text-white">Passing:</span> 4pts per TD, 1pt per 25 yards, -2pts per INT.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Rushing/Receiving:</span> 6pts per TD, 1pt per 10 yards.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Receptions:</span> 0.5 points.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Kicking:</span> Fractional scoring. Missed kicks under 30 yards = -2pts.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Defense:</span> Standard scoring (Points Allowed + Sacks/Turnovers).</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. In-Season Operations",
      icon: <Zap className="text-yellow-600" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white text-xs sm:text-sm">
          <div className="space-y-6">
            <div>
              <h4 className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                4.1 Waivers (FAAB)
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                  <CheckCircle2 size={10} /> Sleeper Setting
                </span>
              </h4>
              <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                <li>• <span className="font-bold text-gray-900 dark:text-white">Budget:</span> $200 for the season (Regular + Playoffs).</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Process:</span> Daily at 12:00 PM EST (except Tuesday).</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">$0 Bids:</span> Allowed.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Tiebreaker:</span> Rolling waiver priority.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">4.2 Trading</h4>
              <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                <li className="flex items-center gap-2 flex-wrap">
                  • <span className="font-bold text-gray-900 dark:text-white">Deadline:</span> Week 10.
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                    <CheckCircle2 size={10} /> Sleeper Setting
                  </span>
                </li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Vetoes:</span> Trades process <span className="font-bold text-gray-900 dark:text-white">immediately</span>. The Commissioner will only reverse a trade in cases of clear collusion. Owners have 1 "Veto Flag" per season to trigger a league vote (Simple majority required to overturn).</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">FAAB Trading:</span> Allowed.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Loophole Closure:</span> You cannot trade FAAB for players during the offseason.</li>
              </ul>
            </div>

            <div className="mt-6 p-4 sm:p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
               <h5 className="font-black text-xs sm:text-sm text-red-600 dark:text-red-500 uppercase tracking-tight mb-2 flex items-center gap-2">
                 <AlertCircle size={16} /> Anti-Tanking Protocol
               </h5>
               <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                 <span className="font-bold text-gray-900 dark:text-white">Definition:</span> Starting inactive players (Bye week, Injury, Free Agents) or benching obvious starters to intentionally lose.
               </p>
               <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                 <span className="font-bold text-gray-900 dark:text-white">Penalty:</span> Second offense results in <span className="font-bold text-gray-900 dark:text-white">forfeiture of your highest draft pick</span> next season.
               </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "5. Dispute Resolution Protocol",
      icon: <Handshake className="text-yellow-600" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white text-xs sm:text-sm">
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic text-center">
              Disputes follow a 3-Step process to ensure democracy and fairness.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-black text-sm sm:text-base">Step 1: Mediation</h4>
              <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                Any member may initiate a dispute by notifying the Commish. Mediators schedule an informal discussion. If <span className="font-bold text-gray-900 dark:text-white">50% (6 members)</span> are present, it proceeds.
              </p>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">Step 2: Group Vote</h4>
              <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                If Step 1 fails, the issue goes to a league-wide vote.
              </p>
              <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <span className="font-bold text-gray-900 dark:text-white">Quorum:</span> Minimum <span className="font-bold text-gray-900 dark:text-white">8 members</span> required.</li>
                <li>• <span className="font-bold text-gray-900 dark:text-white">Threshold:</span> Simple majority <span className="font-bold text-gray-900 dark:text-white">(7/12)</span> wins.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm sm:text-base">Step 3: Leadership Decision</h4>
              <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                If no quorum in Step 2, leaders make a final binding decision.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "6. Postseason & Payouts",
      icon: <Trophy className="text-yellow-600" size={20} />,
      content: (
        <div className="space-y-8 text-gray-900 dark:text-white text-xs sm:text-sm">
          <div>
            <h4 className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
              6.1 Playoff Bracket
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                <CheckCircle2 size={10} /> Sleeper Setting
              </span>
            </h4>
            <p className="mt-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Weeks 15-17. 6 Teams advance.</p>
            <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
              <li>• <span className="font-bold text-gray-900 dark:text-white">Seeds 1-3:</span> Division Winners.</li>
              <li>• <span className="font-bold text-gray-900 dark:text-white">Seed 4:</span> Next best record.</li>
              <li>• <span className="font-bold text-gray-900 dark:text-white">Seeds 5-6:</span> Highest <span className="font-bold text-gray-900 dark:text-white">Points For</span> remaining.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
              <h5 className="font-black text-xs sm:text-sm text-green-700 dark:text-green-500 uppercase tracking-tight mb-4 flex items-center gap-2">
                💰 Prize Pool
              </h5>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between border-b border-green-200/50 pb-1">
                  <span className="text-gray-600 dark:text-gray-400">1st Place:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$219 + Ring*</span>
                </div>
                <div className="flex justify-between border-b border-green-200/50 pb-1">
                  <span className="text-gray-600 dark:text-gray-400">2nd Place:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$100</span>
                </div>
                <div className="flex justify-between border-b border-green-200/50 pb-1">
                  <span className="text-gray-600 dark:text-gray-400">3rd Place:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$50</span>
                </div>
                <div className="flex justify-between border-b border-green-200/50 pb-1">
                  <span className="text-gray-600 dark:text-gray-400">Weekly High:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$10/wk</span>
                </div>
                <div className="flex justify-between border-b border-green-200/50 pb-1">
                  <span className="text-gray-600 dark:text-gray-400">Div Winner:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$25 ea</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-[10px] sm:text-xs"><Diamond size={12} className="text-cyan-500" /> Ring Cost:</span>
                  <span className="font-bold text-gray-900 dark:text-white">$16</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white leading-relaxed">
              <h5 className="font-black text-xs sm:text-sm text-gray-700 dark:text-gray-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                🚽 The Toilet Bowl
              </h5>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                The bottom 6 teams enter the consolation bracket. The last place game loser is the Toilet Bowl Champion.
              </p>
              <div className="p-3 bg-white dark:bg-black/20 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-[10px] sm:text-xs leading-relaxed">
                  <span className="text-red-600 font-black uppercase block mb-1">Punishment:</span>
                  <span className="text-red-600 font-bold">Must write a 500-word apology letter to the league.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "7. Emergency Protocols",
      icon: <Siren className="text-red-600" size={20} />,
      content: (
        <div className="space-y-6 text-gray-900 dark:text-white text-xs sm:text-sm">
          <div className="space-y-4">
            <p className="leading-relaxed">
              <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base block mb-1 underline decoration-red-500/30 uppercase tracking-tight">Official Season:</span>
              A season is "Official" if <span className="font-bold text-gray-900 dark:text-white">9 Weeks</span> are played. Payouts prorated by current standings.
            </p>
            <p className="leading-relaxed">
              <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base block mb-1 underline decoration-red-500/30 uppercase tracking-tight">Unofficial Season:</span>
              Fewer than 9 weeks = void. Entry fees carry over to the next year.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "8. Revision History",
      icon: <History className="text-gray-500" size={20} />,
      content: (
        <div className="space-y-8 text-gray-900 dark:text-white text-[10px] sm:text-xs">
          <div className="relative border-l-2 border-gray-100 dark:border-white/5 ml-2 sm:ml-3 space-y-8 sm:space-y-10">
            {/* 2025 LOG */}
            <div className="relative pl-6 sm:pl-8">
              <div className="absolute -left-[7px] sm:-left-[9px] top-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-600 border-2 sm:border-4 border-white dark:border-[#1e1e1e]" />
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-base sm:text-lg font-black tracking-tighter uppercase">V7</span>
                <span className="text-[9px] sm:text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">03/22/25</span>
              </div>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p>• Rule 2.1.3: Rookie hazing modified (Passed 12-0).</p>
                <p>• Rule 4.2: Prohibited offseason FAAB trading (Passed 12-0).</p>
              </div>
            </div>

            {/* 2024 LOG */}
            <div className="relative pl-6 sm:pl-8">
              <div className="absolute -left-[7px] sm:-left-[9px] top-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300 dark:bg-white/20 border-2 sm:border-4 border-white dark:border-[#1e1e1e]" />
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-base sm:text-lg font-black tracking-tighter uppercase">V6</span>
                <span className="text-[9px] sm:text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">03/03/24</span>
              </div>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p>• Rule 4.2: Keeper cap (Passed 7-5).</p>
                <p>• Rule 2.2.1: Toilet Bowl punishment changed to apology letter (Passed 12-0).</p>
                <p>• Rule 5.2.1: Trade deadline Week 10 (Passed 9-1).</p>
              </div>
            </div>

            {/* 2019 LOG */}
            <div className="relative pl-6 sm:pl-8 pb-4">
              <div className="absolute -left-[7px] sm:-left-[9px] top-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300 dark:bg-white/20 border-2 sm:border-4 border-white dark:border-[#1e1e1e]" />
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-base sm:text-lg font-black tracking-tighter uppercase">V1</span>
                <span className="text-[9px] sm:text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">08/14/19</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">• Initial rebrand rules (Passed 7-4).</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans pb-20 selection:bg-orange-500 selection:text-white">
      
      {/* HEADER: Fluid scale for phone */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-white/5 pb-6 sm:pb-8 pt-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 text-center relative">
            <Link href="/league-info" className="absolute top-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-orange-600 transition-colors font-bold text-[10px] sm:text-sm z-50 uppercase tracking-tight">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Hub
            </Link>
            <div className="absolute top-4 right-2 sm:right-4 z-50"><ModeToggle /></div>
            
            <h1 className="mt-2 text-lg sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                <span className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Scale className="w-5 h-5 sm:w-8 sm:h-8" /></span>
                Constitution
            </h1>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        {/* SEARCH BAR: Responsive padding */}
        <div className="relative mb-6 sm:mb-8 text-gray-900 dark:text-white">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search regulations..." 
            className="w-full pl-10 pr-4 py-3 sm:py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] focus:ring-2 focus:ring-orange-500 outline-none transition text-sm sm:text-base placeholder:text-gray-400 shadow-sm"
            onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          />
        </div>

        {/* SECTIONS: Fully fluid containers */}
        <div className="space-y-3 sm:space-y-4">
          {sections.filter(s => s.title.toLowerCase().includes(searchQuery)).map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => toggleSection(idx)} 
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-black/20 rounded-lg shrink-0">{section.icon}</div>
                  <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{section.title}</h3>
                </div>
                {openSections.includes(idx) ? <ChevronUp className="text-gray-400 shrink-0" size={18}/> : <ChevronDown className="text-gray-400 shrink-0" size={18}/>}
              </button>
              {openSections.includes(idx) && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t dark:border-white/10 animate-in slide-in-from-top-2 duration-200">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}