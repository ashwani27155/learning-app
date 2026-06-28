import type { PaperMeta } from "./types";

export function StepSetup({
  meta, setM, onMarksPerQChange, onNext,
}: {
  meta: PaperMeta;
  setM: <K extends keyof PaperMeta>(k: K, v: PaperMeta[K]) => void;
  onMarksPerQChange: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 text-base mb-1">Paper details</h2>
          <p className="text-sm text-gray-500">Set the title, exam, and marking scheme for this paper.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paper Title</label>
          <input
            value={meta.title}
            onChange={e => setM("title", e.target.value)}
            placeholder="e.g. MPSC Mock Test 2026"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subtitle</label>
          <input
            value={meta.subtitle}
            onChange={e => setM("subtitle", e.target.value)}
            placeholder="e.g. General Studies — Paper I"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Exam</label>
            <input value={meta.examName} onChange={e => setM("examName", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
            <input value={meta.date} onChange={e => setM("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration (min)</label>
            <input type="number" value={meta.duration} onChange={e => setM("duration", parseInt(e.target.value) || 60)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Marks per question</label>
            <input type="number" min={0} step={0.5} value={meta.marksPerQ}
              onChange={e => onMarksPerQChange(parseFloat(e.target.value) || 1)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            <p className="text-[11px] text-gray-400 mt-1">Applies to every question already added too.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Negative marks</label>
            <input type="number" min={0} step={0.25} value={meta.negMarks}
              onChange={e => setM("negMarks", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onNext}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-purple-sm"
          >
            Continue → Add Questions
          </button>
        </div>
      </div>
    </div>
  );
}
