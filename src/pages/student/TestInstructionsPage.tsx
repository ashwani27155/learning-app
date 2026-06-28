import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { testService, type Test } from "../../services/testService";
import { DEMO_MODE } from "@/lib/demoMode";


export default function TestInstructionsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate   = useNavigate();

  const [test,     setTest]     = useState<Test | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [checked,  setChecked]  = useState(false);

  useEffect(() => {
    if (!testId) return;
    if (DEMO_MODE) {
      setTest({
        id: testId, titleEn: "MPSC Rajyaseva Demo Mock Test",
        titleMr: "डेमो मॉक टेस्ट", duration: 30, totalMarks: 10, passingPct: 50,
        negativeMarking: true, sections: [],
      });
      setLoading(false);
      return;
    }
    testService.getTest(testId)
      .then(setTest)
      .catch(e => setError(e.message ?? "Failed to load test"))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !test) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Test Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link to="/" className="btn-primary">← Back to Home</Link>
      </div>
    </div>
  );

  const totalQs   = test.sections.reduce((acc, s) => acc + s.questions.length, 0);
  const timePerQ  = totalQs > 0 ? Math.round((test.duration * 60) / totalQs) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="rounded-2xl text-white p-6 mb-6" style={{ background: "linear-gradient(135deg, #030108 0%, #6d28d9 55%, #7c3aed 100%)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">M</div>
            <span className="text-white/70 text-sm">MPSC Sadhak</span>
          </div>
          <h1 className="text-xl font-bold mb-1">{test.titleEn}</h1>
          <p className="text-white/70 text-sm">{test.titleMr}</p>
        </div>

        {/* Test stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "📝", label: "Questions",    value: totalQs || "—" },
            { icon: "⏱",  label: "Duration",     value: `${test.duration} min` },
            { icon: "📊", label: "Max Marks",     value: Number(test.totalMarks) },
            { icon: "✅", label: "Passing",       value: `${test.passingPct}%` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-gray-900 text-lg">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section Breakdown (if multi-section) */}
        {test.sections.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">📂 Test Structure</h2>
            <div className="space-y-3">
              {test.sections.map((s: any, i: number) => {
                const qCount  = s.questions?.length ?? 0;
                const marks   = s.marksPerQ != null ? qCount * Number(s.marksPerQ) : qCount;
                const pct     = totalQs > 0 ? Math.round((qCount / totalQs) * 100) : 0;
                return (
                  <div key={s.id ?? i}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{s.titleEn}</span>
                        {s.subject?.nameEn && <span className="ml-2 text-xs text-gray-400">({s.subject.nameEn})</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{qCount} Q</span>
                        {s.marksPerQ != null && <span>{s.marksPerQ} mark/Q</span>}
                        {marks > 0 && <span className="font-semibold text-primary-600">{marks} marks</span>}
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {timePerQ > 0 && (
              <p className="text-xs text-gray-400 mt-4 text-center">
                ⏱ ~{timePerQ}s per question at this pace
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">📋 Instructions</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">1.</span> Read every question carefully before selecting an answer.</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">2.</span> You can switch between English and Marathi at any time during the test.</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">3.</span> Use "Mark for Review" to flag questions you want to revisit.</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">4.</span> The question palette on the right shows your progress (green = answered, purple = review, red = skipped).</li>
            {test.negativeMarking && (
              <li className="flex items-start gap-2 text-red-600 font-medium">
                <span className="font-bold mt-0.5">5.</span> ⚠️ <strong>Negative marking applies</strong> — wrong answers deduct marks. Unanswered questions carry no penalty.
              </li>
            )}
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">{test.negativeMarking ? "6" : "5"}.</span> The test will auto-submit when the timer reaches zero.</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 font-bold mt-0.5">{test.negativeMarking ? "7" : "6"}.</span> Do not refresh or close the browser during the test — your progress is auto-saved every 30 seconds.</li>
          </ul>
        </div>

        {/* Confirmation + Start */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary-600 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              I have read and understood all the instructions above and I am ready to begin the test.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              disabled={!checked}
              onClick={() => navigate(`/test/${testId}/attempt`)}
              className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              Start Test →
            </button>
            <Link to="/" className="btn-ghost border border-gray-200 px-5">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
