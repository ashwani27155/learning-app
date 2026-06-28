import { EmptyState } from "../common/EmptyState";

export interface LeaderEntry {
  rank: number;
  score: number;
  timeTaken: number;
  percentage: number;
  user: { name: string; avatar?: string };
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function medalColor(rank: number) {
  return rank === 1 ? "bg-yellow-400 text-white" : rank === 2 ? "bg-gray-300 text-gray-700" : rank === 3 ? "bg-amber-600 text-white" : "bg-primary-100 text-primary-700";
}
function medalText(rank: number) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

interface LeaderboardTableProps {
  entries: LeaderEntry[];
  search?: string;
  highlightRank?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function LeaderboardTable({ entries, search = "", highlightRank, emptyTitle = "No results yet", emptyDescription = "Complete a test to appear on the leaderboard and see how you compare." }: LeaderboardTableProps) {
  const visible = entries.filter(e =>
    !search || e.user.name.toLowerCase().includes(search.toLowerCase())
  );
  const topThree = visible.slice(0, 3);

  if (entries.length === 0) {
    return <EmptyState icon="🏆" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Podium */}
      {topThree.length >= 3 && !search && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[topThree[1], topThree[0], topThree[2]].map((entry, i) => {
            const height = i === 1 ? "h-28" : "h-20";
            return (
              <div key={entry.rank} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                  {initials(entry.user.name)}
                </div>
                <div className="text-xs font-bold text-gray-900 text-center max-w-16 truncate">{entry.user.name.split(" ")[0]}</div>
                <div className="text-xs text-gray-500">{Math.round(entry.percentage)}%</div>
                <div className={`w-16 ${height} ${medalColor(entry.rank)} rounded-t-xl flex items-start justify-center pt-2 font-bold text-sm`}>
                  {medalText(entry.rank)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Candidate</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map(e => (
                <tr key={e.rank} className={`hover:bg-gray-50 transition-colors ${highlightRank === e.rank ? "bg-primary-50/60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${medalColor(e.rank)}`}>
                      {medalText(e.rank)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                        {initials(e.user.name)}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{e.user.name}</span>
                      {highlightRank === e.rank && <span className="badge badge-purple text-[10px]">You</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{Math.round(e.percentage)}%</td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs hidden sm:table-cell">
                    {e.timeTaken ? `${Math.floor(e.timeTaken / 60)}m ${e.timeTaken % 60}s` : "—"}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No results match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {visible.length} of {entries.length} candidates
        </div>
      </div>
    </>
  );
}
