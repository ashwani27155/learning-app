import { Eye, Trash2 } from "lucide-react";
import { toRoman } from "./numbering";
import { STATUS_BADGE, type TestItem } from "./types";

interface Props {
  test: TestItem;
  index: number;
  onPreview: () => void;
  onTogglePublish: () => void;
  onToggleFree: () => void;
  onDelete: () => void;
  onOpenQuestions: () => void;
}

export default function TestRow({ test, index, onPreview, onTogglePublish, onToggleFree, onDelete, onOpenQuestions }: Props) {
  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

  return (
    <div className="flex items-center gap-3 py-2 pl-3 pr-2 rounded-lg hover:bg-gray-50 transition-all group">
      <span className="text-xs font-mono text-gray-400 w-6 flex-shrink-0 text-right">{toRoman(index)}.</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">{test.titleEn}</span>
          <span className={`badge ${STATUS_BADGE[test.status]} text-[10px]`}>{test.status}</span>
          {test.isFree
            ? <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Free</span>
            : <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">Paid</span>}
          {test.negativeMarking && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">−mkng</span>}
          {test.scheduledAt && <span className="text-[10px] text-primary-600 font-medium">📅 {new Date(test.scheduledAt).toLocaleDateString("en-IN")}</span>}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          {test.duration}m · {test.totalMarks} marks · Pass {test.passingPct}% · {fmtCount(test.attemptCount)} attempts
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        <button onClick={onPreview} title="Preview" className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-300 hover:text-indigo-600 transition-all">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-600 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={onToggleFree}
        title="Override this test's free/paid status independent of the series"
        className={`text-xs py-1 px-2.5 rounded-lg font-semibold border transition-all flex-shrink-0 ${
          test.isFree
            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {test.isFree ? "Mark Paid" : "Mark Free"}
      </button>

      <button
        onClick={onTogglePublish}
        className={`text-xs py-1 px-2.5 rounded-lg font-semibold border transition-all flex-shrink-0 ${
          test.status === "published"
            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {test.status === "published" ? "Unpublish" : "Publish"}
      </button>

      <button onClick={onOpenQuestions} className="btn-primary text-xs py-1 px-3 flex-shrink-0">
        Questions →
      </button>
    </div>
  );
}
