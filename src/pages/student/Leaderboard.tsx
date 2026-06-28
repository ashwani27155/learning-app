import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { testSeriesService } from "../../services/testSeriesService";
import { analyticsService } from "../../services/analyticsService";
import { api } from "../../lib/api";
import { LeaderboardTable, type LeaderEntry } from "../../components/leaderboard/LeaderboardTable";

export default function Leaderboard() {
  const [entries,   setEntries]   = useState<LeaderEntry[]>([]);
  const [overview,  setOverview]  = useState<any>(null);
  const [testId,    setTestId]    = useState<string>("");
  const [tests,     setTests]     = useState<Array<{ id: string; titleEn: string }>>([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);

  // Load available tests to populate the selector
  useEffect(() => {
    Promise.all([
      analyticsService.getOverview(),
      api.get<any[]>("/test-series?limit=20"),
    ]).then(([ov, seriesList]) => {
      setOverview(ov);
      // flatten tests from all series
      const allTests: Array<{ id: string; titleEn: string }> = [];
      const series = seriesList ?? [];
      (Array.isArray(series) ? series : (series as any).data ?? []).forEach((s: any) => {
        (s.tests ?? []).forEach((t: any) => allTests.push({ id: t.id, titleEn: t.titleEn }));
      });
      setTests(allTests);
      if (allTests.length > 0) setTestId(allTests[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    testSeriesService.getLeaderboard(testId)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [testId]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="page-subtitle">See where you stand among all candidates</p>
      </div>

      {/* Your rank card */}
      {overview && overview.testsCompleted > 0 && (
        <div className="rounded-2xl p-5 text-white flex items-center gap-5"
          style={{ background: "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#f59e0b 100%)" }}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">📊</div>
          <div className="flex-1">
            <div className="font-bold text-lg">Your Performance</div>
            <div className="text-white/70 text-sm">{overview.testsCompleted} tests completed · {overview.currentStreak} day streak</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold">{overview.avgScore}%</div>
            <div className="text-white/70 text-xs">Avg Score</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {tests.length > 0 && (
          <select className="input-field w-auto"
            value={testId} onChange={e => setTestId(e.target.value)}>
            {tests.map(t => <option key={t.id} value={t.id}>{t.titleEn}</option>)}
          </select>
        )}
        <div className="flex-1 min-w-48">
          <input className="input-field" placeholder="Search by name..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No results yet</h2>
          <p className="text-gray-500 text-sm mb-6">Complete a test to appear on the leaderboard and see how you compare.</p>
          <Link to="/test-series/group/a" className="btn-primary">Start a Free Test →</Link>
        </div>
      ) : (
        <LeaderboardTable entries={entries} search={search} />
      )}
    </div>
  );
}
