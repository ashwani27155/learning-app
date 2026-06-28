import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { api } from "../../lib/api";
import { testSeriesService } from "../../services/testSeriesService";
import { LeaderboardTable } from "../../components/leaderboard/LeaderboardTable";
import { Skeleton } from "../../components/common/Skeleton";

export default function PublicLeaderboardPage() {
  const [testId, setTestId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: tests } = useQuery({
    queryKey: ["leaderboard-tests"],
    queryFn: async () => {
      const seriesList = await api.get<any[]>("/test-series?limit=20");
      const allTests: Array<{ id: string; titleEn: string }> = [];
      const series = Array.isArray(seriesList) ? seriesList : (seriesList as any).data ?? [];
      series.forEach((s: any) => (s.tests ?? []).forEach((t: any) => allTests.push({ id: t.id, titleEn: t.titleEn })));
      return allTests;
    },
  });

  useEffect(() => {
    if (!testId && tests && tests.length > 0) setTestId(tests[0].id);
  }, [tests, testId]);

  const { data: entries, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-leaderboard", testId],
    queryFn: () => testSeriesService.getLeaderboard(testId),
    enabled: !!testId,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-600" />
            Leaderboard
          </h1>
          <p className="page-subtitle">See how top aspirants are performing — sign up to compete and track your rank.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {tests && tests.length > 0 && (
            <select className="input-field w-auto" value={testId} onChange={e => setTestId(e.target.value)}>
              {tests.map(t => <option key={t.id} value={t.id}>{t.titleEn}</option>)}
            </select>
          )}
          <div className="flex-1 min-w-48">
            <input className="input-field" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {!testId || isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : isError || !entries ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load the leaderboard. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : (
          <LeaderboardTable entries={entries} search={search} />
        )}

        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-center">
          <p className="text-sm font-semibold text-primary-800">Want to see your name here?</p>
          <p className="text-xs text-primary-600 mt-1 mb-3">Take a free test and start climbing the ranks today.</p>
          <Link to="/test-series" className="btn-primary text-sm">Browse Test Series →</Link>
        </div>
      </div>
    </div>
  );
}
