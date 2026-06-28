import { useState, useEffect, useRef } from "react";
import { Trophy, Users, ChevronRight, ChevronLeft, TrendingUp } from "lucide-react";
import { onLeaderboardUpdate, onActiveCount, LeaderboardEntry } from "../../lib/liveSocket";

interface Props {
  userId?: string;
  userName?: string;
}

export default function LiveLeaderboard({ userName }: Props) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [entries,     setEntries]     = useState<LeaderboardEntry[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [rankFlash,   setRankFlash]   = useState<number | null>(null);
  const prevRankRef = useRef<number | null>(null);

  useEffect(() => {
    const offLb = onLeaderboardUpdate((data) => {
      // Find current user's rank
      const myEntry = data.find(e => e.name === userName?.split(" ")[0]);
      if (myEntry && prevRankRef.current !== null && myEntry.rank < prevRankRef.current) {
        setRankFlash(myEntry.rank);
        setTimeout(() => setRankFlash(null), 2000);
      }
      if (myEntry) prevRankRef.current = myEntry.rank;
      setEntries(data);
    });
    const offAc = onActiveCount(setActiveCount);
    return () => { offLb(); offAc(); };
  }, [userName]);

  const myEntry = entries.find(e => e.name === userName?.split(" ")[0]);

  return (
    <div
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-300 ${
        collapsed ? "w-10" : "w-56"
      }`}
    >
      {/* Toggle tab */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-16 bg-red-600 text-white rounded-l-xl flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
      >
        {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {!collapsed && (
        <div className="bg-gray-900 text-white rounded-l-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="px-3 py-2.5 bg-red-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold tracking-wide">LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-[10px]">
              <Users className="w-3 h-3" />
              {activeCount} active
            </div>
          </div>

          {/* My rank highlight */}
          {myEntry && (
            <div
              className={`px-3 py-2 border-b border-gray-700 transition-all ${
                rankFlash !== null ? "bg-yellow-500/20" : "bg-gray-800"
              }`}
            >
              <div className="text-[10px] text-gray-400 mb-0.5">Your rank</div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-yellow-400">#{myEntry.rank}</span>
                {rankFlash !== null && (
                  <div className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold animate-bounce">
                    <TrendingUp className="w-3 h-3" /> up!
                  </div>
                )}
                <span className="ml-auto text-xs font-bold text-white">{myEntry.score} pts</span>
              </div>
            </div>
          )}

          {/* Top 10 list */}
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-1 mb-1.5 px-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Top Rankings</span>
            </div>
            {entries.length === 0 ? (
              <p className="text-[10px] text-gray-500 text-center py-3">
                Rankings appear after first submissions
              </p>
            ) : (
              <div className="space-y-0.5">
                {entries.slice(0, 10).map((e) => {
                  const isMe = e.name === userName?.split(" ")[0];
                  const medal = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : null;
                  return (
                    <div
                      key={e.rank}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isMe ? "bg-yellow-500/20 border border-yellow-500/30" : "hover:bg-gray-800"
                      }`}
                    >
                      <span className="w-5 text-[10px] text-gray-500 font-bold text-center flex-shrink-0">
                        {medal ?? `#${e.rank}`}
                      </span>
                      <span className={`flex-1 truncate text-[11px] ${isMe ? "text-yellow-300 font-bold" : "text-gray-300"}`}>
                        {isMe ? "You" : e.name}
                      </span>
                      <span className={`font-bold text-[11px] flex-shrink-0 ${isMe ? "text-yellow-300" : "text-white"}`}>
                        {e.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[9px] text-gray-600 text-center mt-1.5">Updates every 30s</p>
          </div>
        </div>
      )}
    </div>
  );
}
