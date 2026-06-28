import { ChevronUp, ChevronDown, X } from "lucide-react";
import type { Question } from "./types";
import { DiffBadge } from "./helpers";

export function QuestionRow({
  q, localNum, onUp, onDown, onRemove, onMarksChange, isFirst, isLast,
}: {
  q: Question; localNum: number;
  onUp: () => void; onDown: () => void; onRemove: () => void;
  onMarksChange: (v: number) => void; isFirst: boolean; isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {localNum}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-relaxed">{q.textEn}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <DiffBadge d={q.difficulty} />
          {q.subject && <span className="text-[10px] text-gray-500">{q.subject.nameEn}</span>}
          {q.pyqYear && <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 rounded-full">PYQ {q.pyqYear}</span>}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-gray-400">M:</span>
            <input
              type="number" min={0} step={0.5} value={q.marks ?? 1}
              onChange={e => onMarksChange(parseFloat(e.target.value) || 0)}
              className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button onClick={onUp} disabled={isFirst} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
        <button onClick={onDown} disabled={isLast} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
        <button onClick={onRemove} className="p-0.5 text-red-300 hover:text-red-500 transition-colors mt-0.5"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
