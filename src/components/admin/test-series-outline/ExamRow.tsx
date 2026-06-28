import { useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Trash2, ToggleLeft, ToggleRight, Plus, FolderOpen } from "lucide-react";
import type { Exam } from "../ExamFormModal";
import type { Series, TestItem } from "./types";
import SeriesRow from "./SeriesRow";

interface Props {
  exam: Exam | null;
  index: number;
  seriesList: Series[];
  onEditExam: () => void;
  onToggleExamActive: () => void;
  onDeleteExam: () => void;
  onAddSeries: () => void;
  onEditSeries: (series: Series) => void;
  onDuplicateSeries: (series: Series) => void;
  duplicateSeriesPending: boolean;
  onTogglePublishSeries: (series: Series) => void;
  onDeleteSeries: (series: Series) => void;
  onAddTest: (seriesId: string) => void;
  onSmartBuild: (seriesId: string) => void;
  onImportTest: (seriesId: string) => void;
  onPreviewTest: (testId: string) => void;
  onTogglePublishTest: (test: TestItem) => void;
  onToggleFreeTest: (test: TestItem) => void;
  onDeleteTest: (test: TestItem) => void;
  onOpenTestQuestions: (test: TestItem, series: Series) => void;
}

export default function ExamRow({
  exam, index, seriesList, onEditExam, onToggleExamActive, onDeleteExam, onAddSeries,
  onEditSeries, onDuplicateSeries, duplicateSeriesPending, onTogglePublishSeries, onDeleteSeries,
  onAddTest, onSmartBuild, onImportTest, onPreviewTest, onTogglePublishTest, onToggleFreeTest, onDeleteTest, onOpenTestQuestions,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const isUnassigned = exam === null;

  return (
    <div className="card p-4">
      {/* Exam header row */}
      <div className="flex items-center gap-2 group">
        <button onClick={() => setExpanded(e => !e)} className="p-0.5 text-gray-400 hover:text-gray-700 flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-sm font-mono text-gray-400 flex-shrink-0">{index}.</span>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm truncate">
              {isUnassigned ? "Unassigned Series" : exam.name}
            </span>
            {!isUnassigned && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${exam.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {exam.isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
            <FolderOpen className="w-3 h-3" /> {seriesList.length} test series
          </div>
        </div>

        {!isUnassigned && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
            <button onClick={onEditExam} title="Edit" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-700 transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onToggleExamActive} title={exam.isActive ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded-lg transition-all ${exam.isActive ? "text-gray-300 hover:text-amber-600 hover:bg-amber-50" : "text-gray-300 hover:text-emerald-600 hover:bg-emerald-50"}`}>
              {exam.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onDeleteExam} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-600 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Series under this exam */}
      {expanded && (
        <div className="mt-3 pl-5 space-y-1">
          {seriesList.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No test series yet for this exam.</p>
          ) : (
            seriesList.map((series, i) => (
              <SeriesRow
                key={series.id}
                series={series}
                index={i + 1}
                onEdit={() => onEditSeries(series)}
                onDuplicate={() => onDuplicateSeries(series)}
                duplicatePending={duplicateSeriesPending}
                onTogglePublish={() => onTogglePublishSeries(series)}
                onDelete={() => onDeleteSeries(series)}
                onAddTest={() => onAddTest(series.id)}
                onSmartBuild={() => onSmartBuild(series.id)}
                onImportTest={() => onImportTest(series.id)}
                onPreviewTest={onPreviewTest}
                onTogglePublishTest={onTogglePublishTest}
                onToggleFreeTest={onToggleFreeTest}
                onDeleteTest={onDeleteTest}
                onOpenTestQuestions={(test) => onOpenTestQuestions(test, series)}
              />
            ))
          )}
          <button onClick={onAddSeries} className="btn-ghost border border-gray-200 text-xs py-1 px-2.5 mt-1">
            <Plus className="w-3.5 h-3.5" /> Add Series
          </button>
        </div>
      )}
    </div>
  );
}
