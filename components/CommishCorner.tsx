'use client';

import { Newspaper, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CommishCorner() {
  return (
    <div className="rounded-2xl border border-blue-900/30 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 shadow-xl relative overflow-hidden group">
      
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Newspaper className="w-6 h-6 text-blue-400" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Commissioner's Corner</h2>
            <p className="text-xs text-blue-300 font-mono uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Week 15 • Playoff Edition
            </p>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-[#1e293b]/50 rounded-xl p-5 border border-blue-800/30 backdrop-blur-sm relative z-10 hover:border-blue-500/30 transition-colors">
        <h3 className="text-lg font-bold text-white mb-2">
            Kyle Pitts Breaks the Slate
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
            The playoffs kicked off with a bang on Thursday Night Football. 
            <span className="text-white font-bold"> Kyle Pitts </span> 
            silenced the doubters with a monster line: 
            <span className="text-green-400 font-mono"> 3 TDs, 166 YDS</span>. 
            If you started him, you're likely cruising to Round 2. If you faced him... better hope for a miracle on Sunday.
        </p>
        
        <div className="border-t border-white/5 pt-4 mt-2">
            <p className="text-xs text-gray-400 mb-2">
                The fight for the 6th seed came down to the wire. Check out the bracket to see who survived.
            </p>
            <Link 
                href="/matchups" 
                className="inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
                View Playoff Bracket →
            </Link>
        </div>
      </div>

    </div>
  );
}