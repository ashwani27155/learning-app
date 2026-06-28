import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy } from "lucide-react";
import { testService } from "../../services/testService";
import { testSeriesService } from "../../services/testSeriesService";
import { useAuth } from "../../context/AuthContext";
import { LeaderboardTable } from "../../components/leaderboard/LeaderboardTable";
import { Skeleton } from "../../components/common/Skeleton";

export default function TestLeaderboardPage() {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => testService.getTest(testId!),
    enabled: !!testId,
  });

  const { data: entries, isLoading, isError, refetch } = useQuery({
    queryKey: ["test-leaderboard", testId],
    queryFn: () => testSeriesService.getLeaderboard(testId!),
    enabled: !!testId,
  });

  const myEntry = entries?.find(e => e.user.name === user?.name);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to={testId ? `/test/${testId}/instructions` : "/dashboard/my-tests"} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to test
        </Link>

        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-600" />
            Test Leaderboard
          </h1>
          <p className="page-subtitle">
            {test ? <>See how you rank in <span className="font-medium text-gray-700">{test.titleEn}</span></>
                  : "See how you rank against fellow aspirants on this test"}
          </p>
        </div>

        {myEntry && (
          <div className="rounded-2xl p-5 text-white flex items-center gap-5"
            style={{ background: "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#f59e0b 100%)" }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">#{myEntry.rank}</div>
            <div className="flex-1">
              <div className="font-bold text-lg">Your Rank</div>
              <div className="text-white/70 text-sm">{Math.round(myEntry.percentage)}% score · {Math.floor(myEntry.timeTaken / 60)}m {myEntry.timeTaken % 60}s</div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-48">
          <input className="input-field" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : isError || !entries ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load the leaderboard. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : (
          <LeaderboardTable
            entries={entries}
            search={search}
            highlightRank={myEntry?.rank}
            emptyDescription="No one has completed this test yet — be the first to set the benchmark!"
          />
        )}
      </div>
    </div>
  );
}
