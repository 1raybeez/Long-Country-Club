'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

export default function CommishPage() {
  return (
    // STANDARD BACKGROUND
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BACK LINK */}
      <div className="container mx-auto px-4 pt-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <ModeToggle />
      </div>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        
        {/* ARTICLE CARD */}
        <article className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          
          {/* HEADER IMAGE / BANNER */}
          <div className="bg-blue-600 p-8 sm:p-12 text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg">
                   <Newspaper className="w-10 h-10 text-white" />
                </div>
                <div>
                   <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2 uppercase drop-shadow-md">Commissioner's Corner</h1>
                   <p className="text-blue-100 font-bold uppercase tracking-[0.2em] text-sm">Week 15 • Playoff Edition</p>
                </div>
             </div>
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>

          {/* CONTENT BODY */}
          <div className="p-8 sm:p-12 prose dark:prose-invert lg:prose-xl max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
            
            <h2 className="text-gray-900 dark:text-white font-bold text-2xl mb-4">Kyle Pitts Breaks the Slate</h2>
            <p className="mb-6">
              The playoffs kicked off with a bang on Thursday Night Football. <strong>Kyle Pitts</strong> silenced the doubters with a monster line: <span className="text-green-600 dark:text-green-400 font-bold font-mono">3 TDs, 166 YDS</span>. If you started him, you are likely cruising to Round 2. If you played against him, you better hope for a miracle on Sunday.
            </p>
            <p className="mb-8">
              It was a masterclass in tight end efficiency, something we haven't seen in this league since the days of prime Gronk. The decision to start him over safer options likely won someone their matchup before the weekend even started.
            </p>

            <hr className="border-gray-100 dark:border-white/10 my-8" />

            <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-4">The Battle for the 6th Seed</h3>
            <p className="mb-6">
              Going into Monday night, the fight for the final playoff spot was tighter than a pair of skinny jeans on an offensive lineman. <strong>The Mad 'Panda'</strong> needed just 4 points from their kicker to clinch, but disaster struck with a missed field goal in the 4th quarter.
            </p>
            <p className="mb-8">
              Meanwhile, <strong>Shake-n-Bakers</strong> snuck in through the back door thanks to a stat correction on Tuesday morning. Absolute heartbreak for one, jubilation for the other. This is why we play the game.
            </p>

            {/* COMMISSIONER NOTE BOX */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400">
               <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase text-xs tracking-wider">Official Commissioner's Note</h4>
               <p className="text-blue-800 dark:text-blue-200 italic font-medium m-0">
                  "Please remember to set your lineups for Saturday games. No excuses for empty roster spots in the playoffs!"
               </p>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}