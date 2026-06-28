import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Eye, ChevronUp, ChevronDown,
  BookOpen, Search, Users, BarChart2,
  CheckCircle, AlertTriangle,
  FolderOpen, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { SkeletonKPICard, SkeletonListItem } from "../../components/common/Skeleton";
import CreateTestSetup from "../../components/admin/CreateTestSetup";
import { ExamFormModal, MOCK_EXAMS, type Exam } from "../../components/admin/ExamFormModal";
import ExamRow from "../../components/admin/test-series-outline/ExamRow";
import ImportTestModal from "../../components/admin/test-series-outline/ImportTestModal";
import { MOCK_SERIES, MOCK_TQS, MOCK_BANK } from "../../components/admin/test-series-outline/mockData";
import { QuestionFormModal } from "../../components/admin/QuestionFormModal";
import {
  STATUS_BADGE, DIFF_BADGE,
  type Series, type TestItem, type ConfirmState,
  type SeriesType, type SeriesStatus, type Group, type Difficulty,
} from "../../components/admin/test-series-outline/types";
import { DEMO_MODE } from "@/lib/demoMode";

// ── Types (used only within this file) ──────────────────────────────────────────
interface TestQuestion {
  id:            string;
  orderIndex:    number;
  marks:         number;
  negativeMarks: number;
  question: {
    id:         string;
    textEn:     string;
    textMr?:    string;
    type:       string;
    difficulty: Difficulty;
    subject?:   { nameEn: string };
    topic?:     { nameEn: string };
    options:    { id: string; textEn: string; textMr?: string; isCorrect: boolean; orderIndex: number }[];
    explanationEn?: string;
    usageCount: number;
    successRate?: number;
    pyqYear?:   number;
  };
}

interface BankQuestion {
  id:         string;
  textEn:     string;
  textMr?:    string;
  type:       string;
  difficulty: Difficulty;
  usageCount: number;
  isApproved: boolean;
  subject?:   { nameEn: string };
  topic?:     { nameEn: string };
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
function ConfirmModal({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{state.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{state.message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button onClick={() => { state.onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all justify-center flex">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Panel ──────────────────────────────────────────────────────────────
export function TestPreviewPanel({ testId, onClose }: { testId: string; onClose: () => void }) {
  const { data: analyticsRaw } = useQuery({
    queryKey: ["test-analytics", testId],
    queryFn:  () => api.get<any>(`/admin/tests/${testId}/analytics`),
    enabled:  !DEMO_MODE,
  });
  const analytics = analyticsRaw as any;

  const { data, isLoading } = useQuery({
    queryKey: ["test-preview", testId],
    queryFn:  () => api.get<any>(`/admin/tests/${testId}/preview`),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? {
      totalQuestions: 50, qualityScore: 84,
      byDifficulty: { easy: 15, medium: 20, hard: 12, expert: 3 },
      bySubject: { History: 20, Geography: 15, "Political Science": 15 },
      duplicates: [], questionsNoAnswer: 0,
      questionsWithExplanation: 45,
      warnings: ["5 questions have no explanation"],
    } : undefined,
  });

  const preview = data as any;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Test Preview Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({length:4}).map((_,i)=><SkeletonListItem key={i}/>)}
          </div>
        ) : preview ? (
          <div className="p-5 space-y-5">
            {/* Quality score */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"
                    stroke={preview.qualityScore>=80?"#10b981":preview.qualityScore>=60?"#f59e0b":"#ef4444"}
                    strokeDasharray={`${preview.qualityScore} ${100-preview.qualityScore}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{preview.qualityScore}</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-gray-900">Quality Score</div>
                <div className="text-xs text-gray-500 mt-1">{preview.totalQuestions} questions · {preview.questionsWithExplanation} have explanations</div>
                <div className={`text-xs font-semibold mt-1 ${preview.qualityScore>=80?"text-emerald-600":preview.qualityScore>=60?"text-amber-600":"text-red-600"}`}>
                  {preview.qualityScore>=80?"Excellent":preview.qualityScore>=60?"Good — can improve":"Needs attention before publishing"}
                </div>
              </div>
            </div>

            {/* Difficulty distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Difficulty Distribution</h4>
              <div className="space-y-2">
                {Object.entries(preview.byDifficulty ?? {}).map(([diff, count]: any) => (
                  <div key={diff} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full w-16 text-center font-medium ${DIFF_BADGE[diff as Difficulty] ?? "bg-gray-100 text-gray-600"}`}>{diff}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{width:`${(count/preview.totalQuestions)*100}%`}} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Subject Distribution</h4>
              <div className="space-y-1.5">
                {Object.entries(preview.bySubject ?? {}).map(([subj, count]: any) => (
                  <div key={subj} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{subj}</span>
                    <span className="font-semibold text-primary-600">{count} questions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings?.length > 0 && (
              <div className="space-y-2">
                {preview.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {preview.duplicates?.length > 0 && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700">
                ⚠️ {preview.duplicates.length} potential duplicate question(s) detected
              </div>
            )}

            {/* Live analytics (only shown if attempts exist) */}
            {analytics && analytics.attemptCount > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📈 Live Analytics</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Attempts",  value: analytics.attemptCount },
                    { label: "Avg Score", value: `${analytics.avgScore}%` },
                    { label: "Pass Rate", value: `${analytics.passRate}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2.5 bg-gray-50 rounded-xl">
                      <div className="text-sm font-bold text-gray-800">{value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                {analytics.distribution && (
                  <div className="space-y-1.5">
                    {analytics.distribution.map((b: any) => (
                      <div key={b.range} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-16 flex-shrink-0">{b.range}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full"
                            style={{ width: analytics.attemptCount > 0 ? `${(b.count / analytics.attemptCount) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-gray-400 w-6 text-right">{b.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center text-sm">Close</button>
          <button onClick={() => { toast.success("Test published!"); onClose(); }} className="btn-primary flex-1 justify-center text-sm">
            Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ManageTestSeries() {
  const qc = useQueryClient();

  // Outline filter
  const [activeGroup, setActiveGroup] = useState<Group | "ALL">("ALL");

  // Exam modal/demo state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editExam, setEditExam]         = useState<Exam | null>(null);
  const [demoExams, setDemoExams]       = useState<Exam[]>(MOCK_EXAMS);

  // Series modal state
  const [showCreateSeries, setShowCreateSeries]       = useState(false);
  const [editSeries, setEditSeries]                   = useState<Series | null>(null);
  const [createSeriesForExamId, setCreateSeriesForExamId] = useState<string | null>(null);

  // Test modal state
  const [createTestForSeriesId, setCreateTestForSeriesId] = useState<string | null>(null);
  const [smartBuildForSeriesId, setSmartBuildForSeriesId]  = useState<string | null>(null);
  const [importTestForSeriesId, setImportTestForSeriesId]  = useState<string | null>(null);
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);
  const [confirm, setConfirm]             = useState<ConfirmState | null>(null);

  // Question view (test drill-down) state
  const [viewTest,       setViewTest]       = useState<TestItem | null>(null);
  const [viewTestSeries, setViewTestSeries] = useState<Series | null>(null);
  const [viewTestExam,   setViewTestExam]   = useState<Exam | null>(null);

  // Question view state
  const [qSearch,   setQSearch]   = useState("");
  const [qSubject,  setQSubject]  = useState("all");
  const [qDiff,     setQDiff]     = useState("all");
  const [selectedTQIds, setSelectedTQIds] = useState<Set<string>>(new Set());
  const [expandedTQ,    setExpandedTQ]   = useState<string | null>(null);

  // Inline "new question" creation state
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  // Bank panel state
  const [showAddBank,  setShowAddBank]  = useState(false);
  const [bankSearch,   setBankSearch]   = useState("");
  const [bankSubject,  setBankSubject]  = useState("all");
  const [bankDiff,     setBankDiff]     = useState("all");
  const [bankPage,     setBankPage]     = useState(1);
  const [bankSelected, setBankSelected] = useState<Set<string>>(new Set());

  // ── Exam Queries ──────────────────────────────────────────────────────────────
  const { data: examsRaw, isLoading: examsLoading } = useQuery({
    queryKey: ["exams"],
    queryFn:  () => api.get<any>("/admin/exams"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: MOCK_EXAMS } : undefined,
  });
  const exams: Exam[] = DEMO_MODE ? demoExams : (Array.isArray(examsRaw) ? examsRaw : []);

  // ── Series Queries ─────────────────────────────────────────────────────────
  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ["admin", "test-series", activeGroup],
    queryFn:  () => api.get<any>("/admin/test-series", {
      params: activeGroup !== "ALL" ? { groupType: `GROUP_${activeGroup}` } : {},
    }),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? MOCK_SERIES : undefined,
  });
  const allSeries: Series[] = (Array.isArray(seriesData) ? seriesData : []).map((s: any) => ({
    ...s,
    groupType: s.groupType ? (s.groupType.replace("GROUP_", "") as Group) : s.groupType,
    // listSeries returns test/enrollment counts nested under Prisma's `_count`,
    // not flat `testCount` — without this every series showed "0 tests" and
    // the "Total Tests" stat card was always 0.
    testCount: s._count?.tests ?? s.testCount ?? 0,
  }));

  // ── Test Questions ─────────────────────────────────────────────────────────
  const { data: tqData, isLoading: tqLoading } = useQuery({
    queryKey: ["admin", "test-questions", viewTest?.id],
    queryFn:  () => api.get<any>(`/admin/tests/${viewTest!.id}/questions`),
    enabled:  !DEMO_MODE && !!viewTest,
    initialData: DEMO_MODE && viewTest ? MOCK_TQS : undefined,
  });
  const testQuestions: TestQuestion[] = Array.isArray(tqData) ? tqData : [];

  // ── Question Bank panel ────────────────────────────────────────────────────
  const bankFilters = { status:"approved", search:bankSearch, difficulty:bankDiff!=="all"?bankDiff:"", page:bankPage, limit:20, ...(bankSubject!=="all"?{subjectId:bankSubject}:{}) };
  const { data: bankData } = useQuery({
    queryKey: ["questions", "bank-panel", bankFilters],
    queryFn:  () => api.get<any>("/questions", { params: bankFilters }),
    enabled:  showAddBank && !DEMO_MODE,
    initialData: DEMO_MODE && showAddBank ? { data: { questions: MOCK_BANK, pagination: { total: 5, page: 1, limit: 20, totalPages: 1 } } } : undefined,
  });
  const bankQuestions: BankQuestion[] = DEMO_MODE
    ? ((bankData as any)?.data?.questions ?? [])
    : Array.isArray(bankData) ? bankData : ((bankData as any)?.data ?? []);

  // ── Exam Mutations ─────────────────────────────────────────────────────────
  const mutateToggleExam = useMutation({
    mutationFn: ({ id, isActive }: any) => api.put(`/admin/exams/${id}`, { isActive }),
    onSuccess: () => { toast.success("Exam status updated"); qc.invalidateQueries({ queryKey: ["exams"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateDeleteExam = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/exams/${id}`),
    onSuccess: () => { toast.success("Exam deleted"); qc.invalidateQueries({ queryKey: ["exams"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const handleToggleExamActive = (exam: Exam) => {
    if (DEMO_MODE) {
      setDemoExams(prev => prev.map(e => e.id === exam.id ? { ...e, isActive: !e.isActive } : e));
      toast.success("Exam status updated");
      return;
    }
    mutateToggleExam.mutate({ id: exam.id, isActive: !exam.isActive });
  };

  const handleDeleteExam = (exam: Exam) => {
    if (DEMO_MODE) {
      setDemoExams(prev => prev.filter(e => e.id !== exam.id));
      toast.success("Exam deleted");
      return;
    }
    setConfirm({
      title: "Delete exam?",
      message: `This will permanently remove "${exam.name}" and all related questions and tests. This cannot be undone.`,
      onConfirm: () => mutateDeleteExam.mutate(exam.id),
    });
  };

  const handleDemoSaveExam = (examData: Partial<Exam>, existingId?: string) => {
    if (existingId) {
      setDemoExams(prev => prev.map(e => e.id === existingId ? { ...e, ...examData } : e));
    } else {
      const newExam: Exam = {
        id: String(Date.now()),
        negativeMarking: false,
        negativeMarkValue: 0.33,
        isActive: true,
        orderIndex: demoExams.length + 1,
        ...examData,
      } as Exam;
      setDemoExams(prev => [...prev, newExam]);
    }
  };

  // ── Series Mutations ───────────────────────────────────────────────────────
  const mutateCreateSeries = useMutation({
    mutationFn: (data: any) => api.post("/admin/test-series", data),
    onSuccess: () => { toast.success("Series created"); qc.invalidateQueries({ queryKey: ["admin","test-series"] }); setShowCreateSeries(false); setCreateSeriesForExamId(null); },
    onError: (e: any) => toast.error(e.message ?? "Failed to create series"),
  });

  const mutateUpdateSeries = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/test-series/${id}`, data),
    onSuccess: () => { toast.success("Series updated"); qc.invalidateQueries({ queryKey: ["admin","test-series"] }); setEditSeries(null); },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });

  const mutateToggleSeries = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/admin/test-series/${id}`, { status }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin","test-series"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateDeleteSeries = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/test-series/${id}`),
    onSuccess: () => { toast.success("Series deleted"); qc.invalidateQueries({ queryKey: ["admin","test-series"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateDuplicateSeries = useMutation({
    mutationFn: ({ id, titleEn }: { id: string; titleEn: string }) =>
      api.post(`/admin/test-series/${id}/duplicate`, { titleEn }),
    onSuccess: () => {
      toast.success(`Series duplicated as draft`);
      qc.invalidateQueries({ queryKey: ["admin","test-series"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Duplication failed"),
  });

  // ── Test Mutations ─────────────────────────────────────────────────────────
  const mutateCreateTest = useMutation({
    mutationFn: ({ seriesId, ...data }: any) => api.post("/admin/tests", { ...data, seriesId }),
    onSuccess: () => { toast.success("Test created"); qc.invalidateQueries({ queryKey: ["admin","tests"] }); setCreateTestForSeriesId(null); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateToggleTest = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/admin/tests/${id}`, { status }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin","tests"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateToggleTestFree = useMutation({
    mutationFn: ({ id, isFree }: any) => api.patch(`/admin/tests/${id}`, { isFree }),
    onSuccess: () => { toast.success("Pricing updated"); qc.invalidateQueries({ queryKey: ["admin","tests"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateDeleteTest = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/tests/${id}`),
    onSuccess: () => { toast.success("Test deleted"); qc.invalidateQueries({ queryKey: ["admin","tests"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // ── Test Question Mutations ────────────────────────────────────────────────
  const mutateAddQuestions = useMutation({
    mutationFn: ({ testId, questionIds }: any) => api.post(`/admin/tests/${testId}/questions`, { questionIds }),
    onSuccess: () => { toast.success("Questions added"); qc.invalidateQueries({ queryKey: ["admin","test-questions"] }); setShowAddBank(false); setBankSelected(new Set()); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // Approve a freshly-created question, then immediately attach it to the
  // test being built — admins authoring a question from this view are
  // creating it specifically for this test, so skip the separate manual
  // approve-then-pick-from-bank round trip.
  const handleInlineQuestionCreated = async (created: any) => {
    const newId: string = created?.data?.id ?? created?.id ?? "";
    setShowCreateQuestion(false);
    if (!newId || !viewTest) return;
    try {
      if (!DEMO_MODE) await api.post(`/questions/${newId}/approve`);
    } catch (e: any) {
      toast.error(e.message ?? "Question saved, but approval failed");
    }
    mutateAddQuestions.mutate({ testId: viewTest.id, questionIds: [newId] });
  };

  const mutateRemoveQuestion = useMutation({
    mutationFn: ({ testId, tqId }: any) => api.delete(`/admin/tests/${testId}/questions/${tqId}`),
    onSuccess: () => { toast.success("Question removed"); qc.invalidateQueries({ queryKey: ["admin","test-questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const mutateReorder = useMutation({
    mutationFn: ({ testId, orderedIds }: any) => api.put(`/admin/tests/${testId}/questions/reorder`, { orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","test-questions"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed to reorder"),
  });

  // ── Reorder helpers ────────────────────────────────────────────────────────
  const moveTQ = useCallback((tqId: string, dir: "up" | "down") => {
    if (!viewTest) return;
    const sorted = [...testQuestions].sort((a,b) => a.orderIndex - b.orderIndex);
    const idx = sorted.findIndex(q => q.id === tqId);
    if (idx < 0) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const arr = [...sorted];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    const reordered = arr.map((q, i) => ({ ...q, orderIndex: i + 1 }));

    // Optimistic update
    qc.setQueryData(["admin","test-questions",viewTest.id], { data: reordered });

    mutateReorder.mutate({
      testId: viewTest.id,
      orderedIds: reordered.map(q => q.id),
    });
  }, [viewTest, testQuestions, mutateReorder, qc]);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredTQs = testQuestions
    .filter(tq => {
      const q = tq.question;
      const txt = (q.textEn + (q.subject?.nameEn ?? "") + (q.topic?.nameEn ?? "")).toLowerCase();
      return (
        (!qSearch   || txt.includes(qSearch.toLowerCase())) &&
        (qSubject === "all" || q.subject?.nameEn === qSubject) &&
        (qDiff    === "all" || q.difficulty === qDiff)
      );
    })
    .sort((a,b) => a.orderIndex - b.orderIndex);

  const tqSubjects = [...new Set(testQuestions.map(tq => tq.question.subject?.nameEn ?? "").filter(Boolean))].sort();

  // ── Outline grouping ───────────────────────────────────────────────────────
  const seriesByExam = new Map<string, Series[]>();
  const unassignedSeries: Series[] = [];
  allSeries.forEach(s => {
    if (s.examId) {
      seriesByExam.set(s.examId, [...(seriesByExam.get(s.examId) ?? []), s]);
    } else {
      unassignedSeries.push(s);
    }
  });
  const visibleExams = activeGroup === "ALL"
    ? exams
    : exams.filter(e => (seriesByExam.get(e.id)?.length ?? 0) > 0);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalEnrolled = allSeries.reduce((a,s) => a + s.enrolledCount, 0);
  const totalTests = allSeries.reduce((a,s) => a + (s.testCount ?? 0), 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: Test Questions
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewTest) {
    const goBackToOutline = () => { setViewTest(null); setViewTestSeries(null); setViewTestExam(null); };
    return (
      <div className="animate-fade-in">
        {confirm && <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />}
        {previewTestId && <TestPreviewPanel testId={previewTestId} onClose={() => setPreviewTestId(null)} />}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
          <button onClick={goBackToOutline} className="text-primary-600 hover:underline">All Series</button>
          {viewTestExam && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500 max-w-xs truncate">{viewTestExam.name}</span>
            </>
          )}
          <span className="text-gray-300">/</span>
          <button onClick={goBackToOutline} className="text-primary-600 hover:underline max-w-xs truncate">{viewTestSeries?.titleEn}</button>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-gray-900 max-w-xs truncate">{viewTest.titleEn}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`badge ${STATUS_BADGE[viewTest.status]}`}>{viewTest.status}</span>
              <span className="text-xs text-gray-400">{viewTest.duration} min · {viewTest.totalMarks} marks · Pass {viewTest.passingPct}%</span>
              {viewTest.negativeMarking && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Neg. Marking</span>}
            </div>
            <h1 className="page-title">{viewTest.titleEn}</h1>
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <button onClick={() => setPreviewTestId(viewTest.id)} className="btn-ghost border border-gray-200 text-sm">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={() => setShowAddBank(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add Questions
            </button>
            <button onClick={() => setShowCreateQuestion(true)} className="btn-ghost border border-gray-200 text-sm">
              <Plus className="w-4 h-4" /> New Question
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
          {[
            { label:"Total Qs",   value: testQuestions.length,                                     color:"text-primary-600" },
            { label:"Easy",       value: testQuestions.filter(q=>q.question.difficulty==="easy").length, color:"text-emerald-600" },
            { label:"Medium",     value: testQuestions.filter(q=>q.question.difficulty==="medium").length, color:"text-amber-600" },
            { label:"Hard",       value: testQuestions.filter(q=>q.question.difficulty==="hard").length,   color:"text-red-600" },
            { label:"Total Marks",value: testQuestions.reduce((a,q)=>a+Number(q.marks),0).toFixed(0),     color:"text-primary-600" },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + bulk actions */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search questions…" value={qSearch} onChange={e=>setQSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto text-sm" value={qSubject} onChange={e=>setQSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {tqSubjects.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="input-field w-auto text-sm" value={qDiff} onChange={e=>setQDiff(e.target.value)}>
            <option value="all">All Difficulty</option>
            {(["easy","medium","hard","expert"] as Difficulty[]).map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          {selectedTQIds.size > 0 && (
            <button
              onClick={() => setConfirm({ title:"Remove Questions", message:`Remove ${selectedTQIds.size} selected questions from this test?`, onConfirm:() => {
                if (viewTest) {
                  selectedTQIds.forEach(id => mutateRemoveQuestion.mutate({ testId:viewTest.id, tqId:id }));
                  setSelectedTQIds(new Set());
                }
              }})}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Remove {selectedTQIds.size}
            </button>
          )}
        </div>

        {/* Select all */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded"
              checked={selectedTQIds.size === filteredTQs.length && filteredTQs.length > 0}
              onChange={e => setSelectedTQIds(e.target.checked ? new Set(filteredTQs.map(q=>q.id)) : new Set())} />
            <span>Select all ({filteredTQs.length})</span>
          </label>
          <span className="ml-auto">Showing {filteredTQs.length} of {testQuestions.length}</span>
        </div>

        {/* Question list */}
        <div className="space-y-2">
          {tqLoading
            ? Array.from({length:5}).map((_,i)=><SkeletonListItem key={i}/>)
            : filteredTQs.length === 0
              ? (
                <div className="card p-12 text-center text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No questions yet</p>
                  <p className="text-sm mt-1">Click "Add Questions" to add from your question bank</p>
                  <button onClick={() => setShowAddBank(true)} className="btn-primary mt-4 text-sm">
                    <Plus className="w-4 h-4" /> Add Questions
                  </button>
                </div>
              )
              : filteredTQs.map((tq, i) => {
                  const q = tq.question;
                  const isSel = selectedTQIds.has(tq.id);
                  const isExpanded = expandedTQ === tq.id;
                  return (
                    <div key={tq.id} className={`card-flat border rounded-2xl overflow-hidden transition-all ${isSel?"border-primary-300 bg-primary-50":"border-gray-200"}`}>
                      <div className="flex items-start gap-3 p-4">
                        <input type="checkbox" className="rounded mt-1 flex-shrink-0"
                          checked={isSel}
                          onChange={() => {
                            const n = new Set(selectedTQIds);
                            if (isSel) n.delete(tq.id); else n.add(tq.id);
                            setSelectedTQIds(n);
                          }} />

                        {/* Reorder handle */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                          <button onClick={() => moveTQ(tq.id,"up")} disabled={i===0}
                            className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => moveTQ(tq.id,"down")} disabled={i===filteredTQs.length-1}
                            className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Order badge */}
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                          {tq.orderIndex}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {q.subject && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.subject.nameEn}</span>}
                            {q.topic   && <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.topic.nameEn}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_BADGE[q.difficulty]}`}>{q.difficulty}</span>
                            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.type}</span>
                            {q.pyqYear && <span className="text-[11px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">PYQ {q.pyqYear}</span>}
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed line-clamp-2">{q.textEn}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            {q.successRate != null && <span className="text-emerald-600 font-medium">✓ {q.successRate.toFixed(0)}% accuracy</span>}
                            <span className="text-gray-400">Used {q.usageCount}×</span>
                            <span className="text-primary-600 font-medium ml-auto">+{tq.marks} / −{tq.negativeMarks}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setExpandedTQ(isExpanded ? null : tq.id)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all" title="Preview">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirm({ title:"Remove Question", message:"Remove this question from the test?", onConfirm:() => mutateRemoveQuestion.mutate({ testId:viewTest.id, tqId:tq.id }) })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all" title="Remove">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preview */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                          {q.textMr && <p className="text-sm font-marathi text-gray-700">{q.textMr}</p>}
                          <div className="space-y-1.5">
                            {q.options.sort((a,b)=>a.orderIndex-b.orderIndex).map(opt => (
                              <div key={opt.id} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm ${opt.isCorrect?"border-emerald-400 bg-emerald-50":"border-gray-200 bg-white"}`}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${opt.isCorrect?"bg-emerald-500 text-white":"bg-gray-100 text-gray-500"}`}>
                                  {String.fromCharCode(65+q.options.indexOf(opt))}
                                </div>
                                <span className={opt.isCorrect?"text-emerald-800 font-medium":"text-gray-700"}>{opt.textEn}</span>
                                {opt.isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                              </div>
                            ))}
                          </div>
                          {q.explanationEn && (
                            <p className="text-xs text-gray-500 border-t border-gray-200 pt-2">{q.explanationEn}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
          }
        </div>

        {/* Add from Bank slide-over */}
        {showAddBank && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => { setShowAddBank(false); setBankSelected(new Set()); }} />
            <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl animate-slide-in-right">

              {/* Panel header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="font-bold text-gray-900">Add from Question Bank</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Approved questions only</p>
                  </div>
                  {bankSelected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white bg-violet-600 px-2.5 py-1 rounded-full">
                        {bankSelected.size} selected
                      </span>
                      <button onClick={() => setBankSelected(new Set())}
                        className="text-xs text-gray-400 hover:text-gray-700 hover:underline">Clear</button>
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowAddBank(false); setBankSelected(new Set()); }}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-100 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input-field pl-9 text-sm" placeholder="Search questions…"
                    value={bankSearch} onChange={e=>{setBankSearch(e.target.value);setBankPage(1);}} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-field text-sm py-1.5" value={bankDiff} onChange={e=>setBankDiff(e.target.value)}>
                    <option value="all">All Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                  <select className="input-field text-sm py-1.5" value={bankSubject} onChange={e=>setBankSubject(e.target.value)}>
                    <option value="all">All Subjects</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Political Science">Political Science</option>
                    <option value="General Studies">General Studies</option>
                    <option value="Marathi Language">Marathi Language</option>
                    <option value="English">English</option>
                    <option value="CSAT">CSAT</option>
                    <option value="Economics">Economics</option>
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Environment">Environment</option>
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>
              </div>

              {/* Question list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {bankQuestions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No approved questions found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                ) : bankQuestions.map(bq => {
                  const isSel = bankSelected.has(bq.id);
                  const alreadyInTest = testQuestions.some(tq => tq.question.id === bq.id);
                  const isFresh = bq.usageCount === 0;
                  return (
                    <div key={bq.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        alreadyInTest ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : isSel       ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (alreadyInTest) return;
                        const n = new Set(bankSelected);
                        if (isSel) n.delete(bq.id); else n.add(bq.id);
                        setBankSelected(n);
                      }}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isSel ? "bg-violet-500 border-violet-500" : "border-gray-300"
                        }`}>
                          {isSel && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2 leading-snug">{bq.textEn}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {bq.subject && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{bq.subject.nameEn}</span>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE[bq.difficulty]}`}>{bq.difficulty}</span>
                            {isFresh
                              ? <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> Fresh</span>
                              : <span className="text-[10px] text-gray-400">Used {bq.usageCount}×</span>
                            }
                            {alreadyInTest && <span className="text-[10px] text-emerald-600 font-semibold">✓ In test</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 space-y-3">
                {/* Pagination */}
                {(() => {
                  const pagination = (bankData as any)?.data?.pagination ?? (bankData as any)?.pagination;
                  const totalPages = pagination?.totalPages ?? 1;
                  const total      = pagination?.total ?? bankQuestions.length;
                  if (totalPages <= 1) return null;
                  return (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{total} questions found</span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={bankPage <= 1}
                          onClick={() => setBankPage(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                        >← Prev</button>
                        <span className="font-medium">{bankPage} / {totalPages}</span>
                        <button
                          disabled={bankPage >= totalPages}
                          onClick={() => setBankPage(p => Math.min(totalPages, p + 1))}
                          className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                        >Next →</button>
                      </div>
                    </div>
                  );
                })()}
                <button
                  disabled={bankSelected.size === 0 || mutateAddQuestions.isPending}
                  onClick={() => mutateAddQuestions.mutate({ testId: viewTest.id, questionIds: Array.from(bankSelected) })}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {mutateAddQuestions.isPending
                    ? "Adding…"
                    : bankSelected.size === 0
                    ? "Select questions above"
                    : `Add ${bankSelected.size} Question${bankSelected.size !== 1 ? "s" : ""} →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline "New Question" creation — saved questions are auto-approved and attached to this test */}
        {showCreateQuestion && (
          <QuestionFormModal
            examType={viewTestExam?.code ?? ""}
            onClose={() => setShowCreateQuestion(false)}
            onSaved={handleInlineQuestionCreated}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: Exam → Series → Test Outline
  // ═══════════════════════════════════════════════════════════════════════════
  const isLoadingOutline = examsLoading || seriesLoading;

  const renderExamRow = (exam: Exam | null, index: number, seriesList: Series[]) => (
    <ExamRow
      key={exam ? exam.id : "unassigned"}
      exam={exam}
      index={index}
      seriesList={seriesList}
      onEditExam={() => { setEditExam(exam); setShowExamForm(true); }}
      onToggleExamActive={() => exam && handleToggleExamActive(exam)}
      onDeleteExam={() => exam && handleDeleteExam(exam)}
      onAddSeries={() => { setCreateSeriesForExamId(exam ? exam.id : null); setShowCreateSeries(true); }}
      onEditSeries={(series) => setEditSeries(series)}
      onDuplicateSeries={(series) => mutateDuplicateSeries.mutate({ id: series.id, titleEn: `${series.titleEn} (Copy)` })}
      duplicateSeriesPending={mutateDuplicateSeries.isPending}
      onTogglePublishSeries={(series) => mutateToggleSeries.mutate({ id: series.id, status: series.status==="published"?"draft":"published" })}
      onDeleteSeries={(series) => setConfirm({ title:"Delete Series", message:`Delete "${series.titleEn}"? All tests inside will be removed.`, onConfirm:() => mutateDeleteSeries.mutate(series.id) })}
      onAddTest={(seriesId) => setCreateTestForSeriesId(seriesId)}
      onSmartBuild={(seriesId) => setSmartBuildForSeriesId(seriesId)}
      onImportTest={(seriesId) => setImportTestForSeriesId(seriesId)}
      onPreviewTest={(testId) => setPreviewTestId(testId)}
      onTogglePublishTest={(test) => mutateToggleTest.mutate({ id: test.id, status: test.status==="published"?"draft":"published" })}
      onToggleFreeTest={(test) => mutateToggleTestFree.mutate({ id: test.id, isFree: !test.isFree })}
      onDeleteTest={(test) => setConfirm({ title:"Delete Test", message:`Delete "${test.titleEn}"? All its questions will be removed.`, onConfirm:() => mutateDeleteTest.mutate(test.id) })}
      onOpenTestQuestions={(test, series) => { setViewTest(test); setViewTestSeries(series); setViewTestExam(exam); }}
    />
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {confirm && <ConfirmModal state={confirm} onClose={() => setConfirm(null)} />}
      {previewTestId && <TestPreviewPanel testId={previewTestId} onClose={() => setPreviewTestId(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Test Series</h1>
          <p className="page-subtitle">Manage exams, test series, and tests</p>
        </div>
        <button onClick={() => { setEditExam(null); setShowExamForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Exam
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoadingOutline
          ? Array.from({length:4}).map((_,i)=><SkeletonKPICard key={i}/>)
          : [
              { label:"Total Exams",   value: exams.length,                   Icon:BookOpen,    bg:"bg-primary-50", ic:"text-primary-600" },
              { label:"Total Series",  value: allSeries.length,               Icon:FolderOpen,  bg:"bg-violet-50",  ic:"text-violet-600" },
              { label:"Total Tests",   value: totalTests,                     Icon:BarChart2,   bg:"bg-sky-50",     ic:"text-sky-600" },
              { label:"Total Enrolled",value: totalEnrolled.toLocaleString(), Icon:Users,        bg:"bg-emerald-50", ic:"text-emerald-600" },
            ].map(({ label, value, Icon, bg, ic }) => (
              <div key={label} className="card p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                  <Icon className={`w-4 h-4 ${ic}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
      </div>

      {/* Group filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "A", "B", "C", "D"] as const).map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeGroup === g ? "bg-primary-600 text-white shadow-purple-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
            }`}
          >
            {g === "ALL" ? "All Groups" : `Group ${g}`}
          </button>
        ))}
      </div>

      {/* Outline */}
      <div className="space-y-3">
        {isLoadingOutline
          ? Array.from({length:3}).map((_,i) => <div key={i} className="card p-4 h-16 animate-pulse" />)
          : (visibleExams.length === 0 && unassignedSeries.length === 0)
            ? (
              <div className="card p-16 text-center text-gray-400">
                <BookOpen className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-gray-600">No exams found</p>
                <p className="text-sm mt-1">Create your first exam to get started</p>
                <button onClick={() => { setEditExam(null); setShowExamForm(true); }} className="btn-primary mt-4">
                  <Plus className="w-4 h-4" /> Add Exam
                </button>
              </div>
            )
            : (
              <>
                {visibleExams.map((exam, i) => renderExamRow(exam, i + 1, seriesByExam.get(exam.id) ?? []))}
                {unassignedSeries.length > 0 && renderExamRow(null, visibleExams.length + 1, unassignedSeries)}
              </>
            )
        }
      </div>

      {/* Exam modal */}
      {showExamForm && (
        <ExamFormModal
          exam={editExam ?? undefined}
          onClose={() => { setShowExamForm(false); setEditExam(null); }}
          onSaved={() => { setShowExamForm(false); setEditExam(null); }}
          onDemoSave={handleDemoSaveExam}
        />
      )}

      {/* Series modal */}
      {(showCreateSeries || editSeries) && (
        <SeriesFormModal
          series={editSeries ?? undefined}
          exams={exams}
          presetExamId={createSeriesForExamId ?? undefined}
          onClose={() => { setShowCreateSeries(false); setEditSeries(null); setCreateSeriesForExamId(null); }}
          onSave={(data) => {
            if (DEMO_MODE) {
              toast.success(editSeries ? "Series updated" : "Series created");
              setShowCreateSeries(false); setEditSeries(null); setCreateSeriesForExamId(null); return;
            }
            const payload = { ...data, groupType: data.groupType ? `GROUP_${data.groupType}` : undefined, examId: data.examId || null };
            if (editSeries) mutateUpdateSeries.mutate({ id: editSeries.id, ...payload });
            else            mutateCreateSeries.mutate(payload);
          }}
        />
      )}

      {/* Create Test modal */}
      {createTestForSeriesId && (
        <TestFormModal
          mode="create"
          onClose={() => setCreateTestForSeriesId(null)}
          onSave={(data) => {
            if (DEMO_MODE) { toast.success("Test created"); setCreateTestForSeriesId(null); return; }
            mutateCreateTest.mutate({ seriesId: createTestForSeriesId, ...data });
          }}
        />
      )}

      {/* Smart Build modal */}
      {smartBuildForSeriesId && (
        <CreateTestSetup
          seriesId={smartBuildForSeriesId}
          onClose={() => setSmartBuildForSeriesId(null)}
          onSave={() => { setSmartBuildForSeriesId(null); qc.invalidateQueries({ queryKey: ["admin","tests"] }); }}
        />
      )}

      {/* Create test from Excel/CSV upload */}
      {importTestForSeriesId && (
        <ImportTestModal
          seriesId={importTestForSeriesId}
          onClose={() => setImportTestForSeriesId(null)}
          onImported={() => qc.invalidateQueries({ queryKey: ["admin","tests"] })}
        />
      )}
    </div>
  );
}

// ── Series Form Modal ──────────────────────────────────────────────────────────
export function SeriesFormModal({ series, exams, presetExamId, onClose, onSave }: { series?: Series; exams: Exam[]; presetExamId?: string; onClose: () => void; onSave: (data: any) => void }) {
  const isEdit = !!series;
  const [form, setForm] = useState<{
    titleEn: string; titleMr: string; groupType: Group;
    type: SeriesType;
    isPremium: boolean; price: number; status: SeriesStatus;
    examId: string;
  }>({
    titleEn:   series?.titleEn  ?? "",
    titleMr:   series?.titleMr  ?? "",
    groupType: series?.groupType ?? "A",
    type:      series?.type     ?? "GROUP_WISE",
    isPremium: series?.isPremium ?? false,
    // price is a Prisma Decimal column — comes back as a string ("0", "999"),
    // not a number; coerce or an untouched field fails backend validation.
    price:     Number(series?.price ?? 0),
    status:    series?.status   ?? "draft",
    examId:    series?.examId   ?? presetExamId ?? "",
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? "Edit Series" : "New Test Series"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Series Title (English) *</label>
            <input className="input-field" placeholder="e.g. Group A — Rajyaseva Mock Series 2026" value={form.titleEn} onChange={e=>setForm(f=>({...f,titleEn:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Series Title (Marathi)</label>
            <input className="input-field font-marathi" placeholder="मराठी शीर्षक" value={form.titleMr} onChange={e=>setForm(f=>({...f,titleMr:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
            <select className="input-field" value={form.examId} onChange={e=>setForm(f=>({...f,examId:e.target.value}))}>
              <option value="">No Exam</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select className="input-field" value={form.groupType ?? ""} onChange={e=>setForm(f=>({...f,groupType:(e.target.value || null) as Group}))}>
                <option value="">No Group</option>
                <option value="A">Group A (Gazetted)</option>
                <option value="B">Group B (Non-Gazetted)</option>
                <option value="C">Group C (Technical)</option>
                <option value="D">Group D (Class IV)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Series Type</label>
              <select className="input-field" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as SeriesType}))}>
                <option value="GROUP_WISE">Group Wise</option>
                <option value="SUBJECT_WISE">Subject Wise</option>
                <option value="PYQ">PYQ</option>
                <option value="MOCK">Mock</option>
                <option value="LIVE">Live</option>
                <option value="SPEED_TEST">Speed Test</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="rounded" checked={form.isPremium} onChange={e=>setForm(f=>({...f,isPremium:e.target.checked}))} />
              <span className="font-medium text-gray-700">Premium Series</span>
            </label>
            {form.isPremium && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">₹</span>
                <input type="number" className="input-field w-24 py-1" value={form.price} onChange={e=>setForm(f=>({...f,price:parseInt(e.target.value)||0}))} />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.titleEn.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {isEdit ? "Update Series" : "Create Series"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Test Form Modal ────────────────────────────────────────────────────────────
export function TestFormModal({ test, mode, onClose, onSave }: { test?: TestItem; mode:"create"|"edit"; onClose:()=>void; onSave:(data:any)=>void }) {
  const [form, setForm] = useState({
    titleEn:        test?.titleEn        ?? "",
    titleMr:        test?.titleMr        ?? "",
    duration:       test?.duration       ?? 60,
    // totalMarks is a Prisma Decimal column — it comes back from the API as a
    // string (e.g. "100"), not a number. Coerce here or an untouched field
    // silently fails backend validation ("Expected number, received string")
    // the moment an admin edits a test without re-typing this one field.
    totalMarks:     Number(test?.totalMarks ?? 100),
    passingPct:     test?.passingPct     ?? 40,
    negativeMarking:test?.negativeMarking ?? false,
    isFree:         test?.isFree         ?? false,
    shuffleQuestions: false,
    shuffleOptions:   false,
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{mode==="create"?"New Test":"Edit Test"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Title (English) *</label>
            <input className="input-field" placeholder="e.g. Mock Test 1 — Full Syllabus" value={form.titleEn} onChange={e=>setForm(f=>({...f,titleEn:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Title (Marathi)</label>
            <input className="input-field font-marathi" placeholder="मराठी शीर्षक" value={form.titleMr} onChange={e=>setForm(f=>({...f,titleMr:e.target.value}))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" className="input-field" value={form.duration} onChange={e=>setForm(f=>({...f,duration:parseInt(e.target.value)||60}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" className="input-field" value={form.totalMarks} onChange={e=>setForm(f=>({...f,totalMarks:parseInt(e.target.value)||100}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing %</label>
              <input type="number" className="input-field" value={form.passingPct} onChange={e=>setForm(f=>({...f,passingPct:parseInt(e.target.value)||40}))} />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
            {[
              { key:"negativeMarking",   label:"Negative Marking" },
              { key:"shuffleQuestions",  label:"Shuffle Questions" },
              { key:"shuffleOptions",    label:"Shuffle Options" },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded" checked={(form as any)[opt.key]} onChange={e=>setForm(f=>({...f,[opt.key]:e.target.checked}))} />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <input type="checkbox" className="rounded" checked={form.isFree} onChange={e=>setForm(f=>({...f,isFree:e.target.checked}))} />
            <span className="text-gray-700">Free Test <span className="text-gray-400">— stays accessible even if the series is premium</span></span>
          </label>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.titleEn.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {mode==="create"?"Create Test":"Update Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
