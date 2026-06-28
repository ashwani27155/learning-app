import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Filter, Plus, Download, Upload, CheckCircle, XCircle,
  Trash2, Eye, ChevronUp, AlertTriangle, RefreshCw, Printer, RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { SkeletonListItem } from "../../components/common/Skeleton";
import QuestionImageUpload from "../../components/admin/QuestionImageUpload";
import CreateTestSetup from "../../components/admin/CreateTestSetup";
import QuestionPaperModal from "../../components/admin/QuestionPaperModal";
import { downloadQuestionBankTemplate, downloadQuestionBankTemplateCSV, parseImportedExcel } from "../../lib/excelUtils";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DEMO_MODE } from "@/lib/demoMode";
import RichTextEditor from "../../components/common/RichTextEditor";
import { ExamFormModal } from "../../components/admin/ExamFormModal";
import { QUESTION_TYPES } from "../../components/admin/paper-builder/demoData";
import { QuestionFormModal, OPTION_LABELS, OPTION_COUNT, type Option, type QType, type Difficulty } from "../../components/admin/QuestionFormModal";

// ── Types ─────────────────────────────────────────────────────────────────────
type QStatus = "draft" | "pending_review" | "approved" | "rejected" | "archived";

interface Question {
  id:               string;
  textEn:           string;
  textMr:           string;
  type:             QType;
  difficulty:       Difficulty;
  status:           QStatus;
  isApproved:       boolean;
  usageCount:       number;
  successRate?:     number;
  examType?:        string;
  subtopic?:        string;
  subjectId?:       string;
  chapterId?:       string;
  topicId?:         string;
  marks?:           number;
  negativeMarks?:   number;
  referenceSource?: string;
  pyqYear?:         number;
  pyqExam?:         string;
  numericalAnswer?: number;
  tags:             string[];
  subject?:         { nameEn: string };
  chapter?:         { nameEn: string };
  topic?:           { nameEn: string };
  options:          Option[];
  images?:          any[];
  usedInTests?:     Array<{ testId: string; testName: string; usedAt: string }> | any;
  createdBy?:       { name: string };
  explanationEn?:   string;
  explanationMr?:   string;
}

interface Filters {
  examType:   string;
  subjectId:  string;
  chapterId:  string;
  difficulty: string;
  type:       string;
  status:     string;
  usageMin:   string;
  usageMax:   string;
  search:     string;
  page:       number;
}

// ── Badges ────────────────────────────────────────────────────────────────────
function UsageBadge({ count, usedInTests }: { count: number; usedInTests?: any[] }) {
  const [open, setOpen] = useState(false);
  const tests: any[] = Array.isArray(usedInTests) ? usedInTests.slice(0, 5) : [];

  const badge = count === 0
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">Unused</span>
    : count === 1
      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">1×</span>
      : count <= 3
        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{count}×</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">{count}× ⚠️</span>;

  if (count === 0) return badge;

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)} className="block">{badge}</button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-48 max-w-64">
          <p className="text-xs font-bold text-gray-700 mb-2">Used in {count} test{count !== 1 ? "s" : ""}:</p>
          {tests.length > 0 ? tests.map((t, i) => (
            <p key={i} className="text-[10px] text-gray-600 truncate">• {t.testName ?? `Test ${i+1}`}</p>
          )) : <p className="text-[10px] text-gray-400">Test details not available</p>}
        </div>
      )}
    </div>
  );
}

// ── Question health score ──────────────────────────────────────────────────────
function getHealthScore(q: Question): number {
  return [
    q.textEn?.length > 10 ? 2 : 0,
    q.textMr?.length > 10 ? 1 : 0,
    (q.explanationEn?.length ?? 0) > 10 ? 2 : 0,
    (q.images?.length ?? 0) > 0 ? 1 : 0,
    (q.tags?.length ?? 0) > 0 ? 1 : 0,
    q.status === "approved" ? 2 : 0,
  ].reduce((a, b) => a + b, 0);
}

function HealthDot({ q }: { q: Question }) {
  const score = getHealthScore(q);

  const missing: string[] = [];
  if (!q.textMr || q.textMr.length < 5) missing.push("Marathi text");
  if (!q.explanationEn) missing.push("Explanation");
  if (!q.images?.length) missing.push("Image");
  if (!q.tags?.length) missing.push("Tags");

  const color = score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-red-500";
  const label = score >= 7 ? "Good" : score >= 4 ? "Needs improvement" : "Incomplete";
  void score; // used by getHealthScore above

  return (
    <div className="relative inline-block group">
      <div className={`w-2.5 h-2.5 rounded-full ${color} cursor-help`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 bg-gray-900 text-white rounded-lg p-2 text-[10px] min-w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="font-semibold">{label} ({score}/9)</p>
        {missing.length > 0 && <p className="mt-1 text-gray-300">Missing: {missing.join(", ")}</p>}
      </div>
    </div>
  );
}

// ── Mock data for demo mode ────────────────────────────────────────────────────
const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1", textEn: "In which year was Maharashtra formed?", textMr: "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?",
    type: "MCQ", difficulty: "easy", status: "approved", isApproved: true, usageCount: 14, successRate: 72,
    examType: "MPSC", tags: ["history", "maharashtra"],
    subject: { nameEn: "History" }, options: [
      { id: "a", textEn: "1956", textMr: "1956", isCorrect: false },
      { id: "b", textEn: "1960", textMr: "1960", isCorrect: true },
      { id: "c", textEn: "1947", textMr: "1947", isCorrect: false },
      { id: "d", textEn: "1972", textMr: "1972", isCorrect: false },
    ],
    explanationEn: "Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.",
  },
  {
    id: "q2", textEn: "How many articles are there in the original Constitution of India?",
    textMr: "भारतीय राज्यघटनेत मूळतः किती कलमे होती?",
    type: "MCQ", difficulty: "medium", status: "pending_review", isApproved: false, usageCount: 0, examType: "MPSC",
    tags: ["polity", "constitution"], subject: { nameEn: "Political Science" },
    options: [
      { id: "a", textEn: "350", textMr: "350", isCorrect: false },
      { id: "b", textEn: "395", textMr: "395", isCorrect: true },
      { id: "c", textEn: "448", textMr: "448", isCorrect: false },
      { id: "d", textEn: "470", textMr: "470", isCorrect: false },
    ],
    explanationEn: "The Constitution originally had 395 articles in 22 parts and 8 schedules.",
  },
  {
    id: "q3", textEn: "Which of the following statements about Din-i-Ilahi are correct? Select all that apply.",
    textMr: "दीन-इ-इलाही बद्दल कोणती विधाने बरोबर आहेत?",
    type: "MULTI_SELECT", difficulty: "hard", status: "approved", isApproved: true, usageCount: 6, successRate: 45, examType: "UPSC",
    tags: ["mughal", "akbar"], subject: { nameEn: "History" },
    options: [
      { id: "a", textEn: "It was founded by Akbar", textMr: "ते अकबरने स्थापले होते", isCorrect: true },
      { id: "b", textEn: "It emphasised tolerance", textMr: "ते सहिष्णुतेवर भर देत होते", isCorrect: true },
      { id: "c", textEn: "It replaced Islam", textMr: "त्याने इस्लामची जागा घेतली", isCorrect: false },
      { id: "d", textEn: "It had very few followers", textMr: "त्यास फार कमी अनुयायी होते", isCorrect: true },
    ],
    explanationEn: "Din-i-Ilahi was a syncretic religion founded by Akbar in 1582.",
  },
  {
    id: "q4", textEn: "The speed of light in vacuum is approximately _____ km/s.",
    textMr: "निर्वात पोकळीत प्रकाशाचा वेग अंदाजे _____ km/s आहे.",
    type: "FILL_IN_BLANK", difficulty: "easy", status: "draft", isApproved: false, usageCount: 0, examType: "NEET",
    tags: ["physics", "light"], subject: { nameEn: "Science" }, options: [],
    numericalAnswer: 300000,
    explanationEn: "The speed of light in vacuum is approximately 3 × 10⁵ km/s or 299,792 km/s.",
  },
  {
    id: "q5", textEn: "A sum of ₹12,000 amounts to ₹15,600 in 4 years at simple interest. What is the rate of interest per annum?",
    textMr: "सोपे व्याज — दर वार्षिक किती टक्के?",
    type: "NUMERICAL", difficulty: "medium", status: "approved", isApproved: true, usageCount: 9, successRate: 61, examType: "BANKING",
    tags: ["SI", "maths"], subject: { nameEn: "Quantitative Aptitude" }, options: [],
    numericalAnswer: 7.5,
    explanationEn: "SI = 15600 − 12000 = ₹3600. Rate = (3600 × 100)/(12000 × 4) = 7.5% per annum.",
  },
];

const MOCK_STATS = { total: 152400, approved: 98200, pending: 18400, neverUsed: 42800 };

// ── Rejection modal ────────────────────────────────────────────────────────────
function RejectModal({ questionId, onClose, onDone }: { questionId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/questions/${questionId}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Question rejected");
      qc.invalidateQueries({ queryKey: ["questions"] });
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to reject"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-gray-900 mb-2">Reject Question</h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason so the creator can improve the question.</p>
        <textarea
          className="input-field w-full h-24 resize-none"
          placeholder="e.g. Duplicate of Q#123, incorrect answer, ambiguous wording…"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button onClick={() => mutate()} disabled={!reason.trim() || isPending} className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50">
            {isPending ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subject / Chapter filter dropdowns (sidebar) ──────────────────────────────
function SubjectFilterDropdowns({ filters, setFilter }: { filters: Filters; setFilter: (k: keyof Filters, v: string) => void }) {
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<any>("/subjects"),
    enabled: !DEMO_MODE,
  });
  const subjects: any[] = Array.isArray(subjectsData) ? subjectsData : [];

  const { data: chaptersData } = useQuery({
    queryKey: ["chapters", filters.subjectId],
    queryFn: () => api.get<any>(`/subjects/${filters.subjectId}/chapters`),
    enabled: !DEMO_MODE && !!filters.subjectId,
  });
  const chapters: any[] = Array.isArray(chaptersData) ? chaptersData : [];

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
        <select
          className="input-field text-sm py-1.5"
          value={filters.subjectId}
          onChange={e => { setFilter("subjectId", e.target.value); setFilter("chapterId", ""); }}
        >
          <option value="">All Subjects</option>
          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
        </select>
      </div>
      {filters.subjectId && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Chapter</label>
          <select
            className="input-field text-sm py-1.5"
            value={filters.chapterId}
            onChange={e => setFilter("chapterId", e.target.value)}
          >
            <option value="">All Chapters</option>
            {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuestionBank() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_FILTERS: Filters = {
    examType: "", subjectId: "", chapterId: "", difficulty: "", type: "", status: "",
    usageMin: "", usageMax: "", search: "", page: 1,
  };

  const [selectedExam, setSelectedExam] = useState<string | null>(
    () => sessionStorage.getItem("qb_selectedExam") ?? null
  );
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const saved = sessionStorage.getItem("qb_filters");
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
    } catch { return DEFAULT_FILTERS; }
  });

  useEffect(() => {
    if (selectedExam) sessionStorage.setItem("qb_selectedExam", selectedExam);
    else sessionStorage.removeItem("qb_selectedExam");
  }, [selectedExam]);

  useEffect(() => {
    sessionStorage.setItem("qb_filters", JSON.stringify(filters));
  }, [filters]);
  const [selected, setSelected]           = useState<string[]>([]);
  const [showAdd, setShowAdd]             = useState(false);
  const [showAddExam, setShowAddExam]     = useState(false);
  const [editQ, setEditQ]                 = useState<Question | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDuplicates, setShowDuplicates]   = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [rejectId, setRejectId]           = useState<string | null>(null);
  const [showImport, setShowImport]           = useState(false);
  const [importStep, setImportStep]           = useState<"upload"|"preview"|"done">("upload");
  const [importMode, setImportMode]           = useState<"file"|"paste">("file");
  const [pasteText,  setPasteText]            = useState("");
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [importLoading, setImportLoading]     = useState(false);
  const [importResult, setImportResult]       = useState<any>(null);
  const [importFile,   setImportFile]         = useState<File | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [expandedPreviewIdx, setExpandedPreviewIdx] = useState<number | null>(null);
  const [showCreateTest, setShowCreateTest]   = useState(false);
  const [showPrintModal, setShowPrintModal]   = useState(false);
  const [demoImportedQs, setDemoImportedQs]   = useState<Question[]>([]);
  const [demoDeletedIds, setDemoDeletedIds]   = useState<string[]>([]);

  // ── API queries ──────────────────────────────────────────────────────────
  const { data: examsData } = useQuery({
    queryKey: ["exams"],
    queryFn:  () => api.get<any>("/admin/exams"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: [
      { code: "MPSC", name: "MPSC", count: 52400 },
      { code: "UPSC", name: "UPSC", count: 38200 },
      { code: "NEET", name: "NEET", count: 24100 },
      { code: "JEE",  name: "JEE",  count: 18600 },
      { code: "SSC",  name: "SSC",  count: 15800 },
      { code: "BANKING", name: "Banking", count: 12300 },
    ]} : undefined,
  });
  // api.get() already unwraps the {success,data} envelope, so in real (non-demo)
  // mode `examsData`/`statsData` ARE the array/object already — only the demo
  // `initialData` above is still wrapped in `{ data: ... }`. Handle both shapes
  // instead of assuming the wrapped one, which silently fell back to [] / MOCK_STATS
  // for every real request (the exam cards stayed stuck on their loading skeleton
  // forever, and the stats row always showed the hardcoded demo numbers).
  const exams = Array.isArray(examsData) ? examsData : ((examsData as any)?.data ?? []);

  const { data: statsData } = useQuery({
    queryKey: ["question-stats"],
    queryFn:  () => api.get<any>("/questions/stats"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: MOCK_STATS } : undefined,
  });
  const stats = (statsData as any)?.data ?? (statsData as any) ?? MOCK_STATS;

  const effectiveFilters = { ...filters, examType: filters.examType || selectedExam || "" };
  // /questions is paginated (response meta: {page, limit, total, pages}); the
  // generic api.get() unwrap discards `meta`, so fetch raw here to keep
  // pagination working — same pattern as PaperBuilder.tsx's bank-list query.
  const { data: questionsRaw, isLoading } = useQuery({
    queryKey: ["questions", effectiveFilters],
    queryFn: async () => {
      const res = await api.get<Response>("/questions", { raw: true, params: effectiveFilters });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load questions");
      return json as { data: Question[]; meta?: { page: number; limit: number; total: number; pages: number } };
    },
    enabled: !DEMO_MODE && !!selectedExam,
  });
  const questions: Question[] = DEMO_MODE
    ? [...MOCK_QUESTIONS, ...demoImportedQs].filter(q => !demoDeletedIds.includes(q.id))
    : questionsRaw?.data ?? [];
  const pagination = DEMO_MODE
    ? { total: MOCK_QUESTIONS.length, page: 1, totalPages: 1, hasPrevPage: false, hasNextPage: false }
    : questionsRaw?.meta
      ? { total: questionsRaw.meta.total, page: questionsRaw.meta.page,
          totalPages: questionsRaw.meta.pages,
          hasPrevPage: questionsRaw.meta.page > 1,
          hasNextPage: questionsRaw.meta.page < questionsRaw.meta.pages }
      : null;

  // ── Approve mutation ─────────────────────────────────────────────────────
  const { mutate: approveQ } = useMutation({
    mutationFn: (id: string) => api.post(`/questions/${id}/approve`),
    onSuccess: () => { toast.success("Question approved"); qc.invalidateQueries({ queryKey: ["questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // ── Delete mutation ──────────────────────────────────────────────────────
  const { mutate: deleteQ } = useMutation({
    mutationFn: (id: string) => {
      if (DEMO_MODE) return Promise.resolve();
      return api.delete(`/questions/${id}`);
    },
    onSuccess: (_data, id) => {
      if (DEMO_MODE) setDemoDeletedIds(ids => [...ids, id]);
      toast.success("Question deleted");
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // ── Unarchive mutation ───────────────────────────────────────────────────
  const { mutate: unarchiveQ } = useMutation({
    mutationFn: (id: string) => api.post(`/questions/${id}/unarchive`, {}),
    onSuccess: () => { toast.success("Question unarchived (set to Draft)"); qc.invalidateQueries({ queryKey: ["questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // ── Bulk approve/delete ──────────────────────────────────────────────────
  const { mutate: bulkApprove } = useMutation({
    mutationFn: () => api.post("/questions/bulk-approve", { ids: selected }),
    onSuccess: () => { toast.success(`${selected.length} questions approved`); setSelected([]); qc.invalidateQueries({ queryKey: ["questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const { mutate: bulkDelete } = useMutation({
    mutationFn: () => {
      if (DEMO_MODE) return Promise.resolve();
      return api.post("/questions/bulk-delete", { ids: selected });
    },
    onSuccess: () => {
      if (DEMO_MODE) setDemoDeletedIds(ids => [...ids, ...selected]);
      toast.success(`${selected.length} questions deleted`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
    onSettled: () => setShowBulkDeleteConfirm(false),
  });

  // ── Bulk field update ────────────────────────────────────────────────────
  const [bulkDifficulty, setBulkDifficulty] = useState("");
  const [bulkStatus,     setBulkStatus]     = useState("");

  const { mutate: bulkFieldUpdate } = useMutation({
    mutationFn: (data: { difficulty?: string; status?: string }) =>
      api.patch("/questions/bulk-update", { ids: selected, data }),
    onSuccess: (_, vars) => {
      const key = Object.keys(vars)[0];
      toast.success(`${selected.length} questions updated (${key})`);
      setSelected([]); setBulkDifficulty(""); setBulkStatus("");
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bulk update failed"),
  });

  // ── Inline quick-edit ────────────────────────────────────────────────────
  const { mutate: quickUpdate } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { difficulty?: string; status?: string } }) =>
      api.put(`/questions/${id}`, data),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  // ── Duplicate flags ──────────────────────────────────────────────────────
  const { data: dupFlagsData, refetch: refetchDups } = useQuery({
    queryKey: ["duplicate-flags"],
    queryFn: () => api.get<any>("/questions/duplicate-flags"),
    enabled: !DEMO_MODE && showDuplicates,
  });
  const dupFlags: any[] = (dupFlagsData as any)?.data?.flags ?? (dupFlagsData as any)?.data ?? [];

  const { mutate: resolveDup } = useMutation({
    mutationFn: ({ flagId, resolution }: { flagId: string; resolution: string }) =>
      api.post(`/questions/duplicates/${flagId}/resolve`, { resolution }),
    onSuccess: () => { toast.success("Duplicate resolved"); refetchDups(); qc.invalidateQueries({ queryKey: ["questions"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // ── Filter-aware export ──────────────────────────────────────────────────
  const handleExport = () => {
    if (!selectedExam) return;
    const params = new URLSearchParams();
    params.set("examType", filters.examType || selectedExam);
    if (filters.subjectId)  params.set("subjectId",  filters.subjectId);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.status)     params.set("status",     filters.status);
    if (filters.type)       params.set("type",       filters.type);
    const url = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1"}/questions/export?${params}`;
    const token = localStorage.getItem("accessToken");
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => {
        if (!r.ok) throw new Error("Export failed");
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `questions-${selectedExam}-${Date.now()}.xlsx`;
        a.click();
      })
      .catch(() => toast.error("Export failed — check server connection"));
  };

  // ── Clone question ───────────────────────────────────────────────────────
  const [cloneQ, setCloneQ] = useState<Question | null>(null);

  const handleClone = async (q: Question) => {
    // Fetch full question data then open form as new question
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/questions/${q.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const data = await res.json();
      const full = data?.data ?? q;
      setCloneQ({ ...full, id: "" }); // clear ID so it creates new
    } catch {
      setCloneQ({ ...q, id: "" });
    }
  };

  // ── Import handlers ──────────────────────────────────────────────────────
  const handleFileDrop = useCallback(async (file: File) => {
    setImportFile(file);
    setImportLoading(true);
    try {
      const result = await parseImportedExcel(file, selectedExam ?? "MPSC");
      setImportResult(result);
      setPreviewQuestions(result.questions ?? []);
      setExpandedPreviewIdx(null);
      setImportStep("preview");
    } catch {
      toast.error("Failed to parse Excel file");
    } finally {
      setImportLoading(false);
    }
  }, [selectedExam]);

  const CSV_HEADER =
    "Subject *,Topic *,Source Book,Source Page,Question (English),Question (Marathi) *," +
    "Option A *,Option B *,Option C,Option D,Option E,Option F," +
    "Correct Option(s) *,Type *,Difficulty *,Is PYQ,PYQ Year,PYQ Exam," +
    "Explanation,Explanation Book,Explanation Page";

  const handlePasteParse = useCallback(async () => {
    if (!pasteText.trim()) { toast.error("Paste some data first"); return; }

    // Strip a header row if the user included one (detect by checking if column 13 looks like "type" or "correct")
    const lines = pasteText.trim().split("\n").filter(l => l.trim());
    const firstLineLower = lines[0]?.toLowerCase() ?? "";
    const looksLikeHeader =
      firstLineLower.startsWith("subject") ||
      /,\s*(type|correct|difficulty)\s*[*,]/.test(firstLineLower);
    const dataLines = looksLikeHeader ? lines.slice(1) : lines;

    if (dataLines.length === 0) { toast.error("No data rows found. Please paste at least one question row."); return; }

    const csv  = CSV_HEADER + "\n" + dataLines.join("\n");
    // UTF-8 BOM ensures Marathi Unicode characters are read correctly
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const file = new File([blob], "paste-import.csv", { type: "text/csv" });
    await handleFileDrop(file);
  }, [pasteText, handleFileDrop]);

  const closeImportModal = () => {
    setShowImport(false);
    setImportStep("upload");
    setImportMode("file");
    setPasteText("");
    setShowFormatGuide(false);
    setImportResult(null);
    setPreviewQuestions([]);
    setExpandedPreviewIdx(null);
    setImportFile(null);
  };

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = () =>
    setSelected(selected.length === questions.length ? [] : questions.map(q => q.id));

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(f => ({ ...f, [key]: value, page: 1 }));

  // ── Board select screen ──────────────────────────────────────────────────
  if (!selectedExam) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Question Bank</h1>
            <p className="page-subtitle">Select an exam to manage its question bank</p>
          </div>
          <button onClick={() => setShowAddExam(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {exams.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              ))
            : exams.map((e: any) => (
                <button
                  key={e.code}
                  onClick={() => { setSelectedExam(e.code); setFilters(f => ({ ...f, examType: e.code })); }}
                  className="card-hover p-5 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm mb-3">
                    {e.code.slice(0, 2)}
                  </div>
                  <div className="font-bold text-gray-900 text-sm">{e.name}</div>
                  {/* /admin/exams doesn't return a live question-bank count for this
                      exam — fall back to the exam's configured pattern size (e.g.
                      "100 questions" for the real exam format) rather than always 0. */}
                  <div className="text-xs text-gray-400 mt-1">{(e.count ?? e.totalQuestions ?? 0).toLocaleString()} questions</div>
                </button>
              ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Questions",  value: (stats.total ?? 0).toLocaleString(),   color: "text-gray-900" },
            { label: "Approved",         value: (stats.approved ?? 0).toLocaleString(), color: "text-emerald-600" },
            { label: "Pending Review",   value: (stats.pending ?? 0).toLocaleString(),  color: "text-amber-600" },
            { label: "Never Used",       value: (stats.neverUsed ?? 0).toLocaleString(), color: "text-primary-600" },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {showAddExam && (
          <ExamFormModal
            onClose={() => setShowAddExam(false)}
            onSaved={() => setShowAddExam(false)}
          />
        )}
      </div>
    );
  }

  // ── Question list screen ─────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedExam(null)} className="text-sm text-primary-600 hover:underline">
            ← Exams
          </button>
          <span className="text-gray-400">/</span>
          <h1 className="page-title mb-0">{selectedExam} Question Bank</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => downloadQuestionBankTemplate()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all border-r border-gray-200"
              title="Download Excel template (.xlsx)">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => downloadQuestionBankTemplateCSV()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-all border-r border-gray-200"
              title="Download CSV template (.csv)">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-all border-r border-gray-200"
              title="Export filtered questions as Excel">
              <Download className="w-4 h-4" /> Export Data
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition-all"
              title="Generate printable question paper">
              <Printer className="w-4 h-4" /> Print Paper
            </button>
          </div>
          <button onClick={() => setShowImport(true)} className="btn-ghost border border-gray-200 text-sm">
            <Upload className="w-4 h-4" /> Import Excel / CSV
          </button>
          <button onClick={() => setShowCreateTest(true)} className="btn-outline text-sm">
            <Plus className="w-4 h-4" /> Create Test
          </button>
          {selected.length > 0 && (
            <>
              <button onClick={() => bulkApprove()} className="btn-ghost border border-emerald-300 text-emerald-700 text-sm">
                <CheckCircle className="w-4 h-4" /> Approve ({selected.length})
              </button>
              <select
                value={bulkDifficulty}
                onChange={e => setBulkDifficulty(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-2 py-1.5 bg-white cursor-pointer"
              >
                <option value="">Set Difficulty…</option>
                {(["easy","medium","hard","expert"] as Difficulty[]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {bulkDifficulty && (
                <button onClick={() => bulkFieldUpdate({ difficulty: bulkDifficulty })} className="btn-ghost border border-amber-300 text-amber-700 text-sm">
                  Apply ({selected.length})
                </button>
              )}
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-2 py-1.5 bg-white cursor-pointer"
              >
                <option value="">Set Status…</option>
                {(["draft","pending_review","approved","rejected","archived"] as QStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {bulkStatus && (
                <button onClick={() => bulkFieldUpdate({ status: bulkStatus })} className="btn-ghost border border-primary-300 text-primary-700 text-sm">
                  Apply ({selected.length})
                </button>
              )}
              <button onClick={() => setShowBulkDeleteConfirm(true)} className="btn-ghost border border-red-200 text-red-600 text-sm">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all">
                <Printer className="w-3.5 h-3.5" /> Print Paper ({selected.length})
              </button>
            </>
          )}
          <button
            onClick={() => setShowDuplicates(v => !v)}
            className={`btn-ghost border text-sm ${showDuplicates ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200"}`}
          >
            <AlertTriangle className="w-4 h-4" /> Duplicates
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Duplicate Resolution Panel */}
      {showDuplicates && (
        <div className="card p-5 space-y-4 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Unresolved Duplicate Flags</h3>
            <span className="text-xs text-gray-400">Review and resolve similar questions</span>
          </div>
          {dupFlags.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No unresolved duplicates — you're all clear! ✓</p>
          ) : (
            <div className="space-y-4">
              {dupFlags.map((flag: any) => (
                <div key={flag.id} className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {((flag.similarityScore ?? flag.similarity ?? 0) * 100).toFixed(0)}% similar
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveDup({ flagId: flag.id, resolution: "deleted_b" })}
                        className="text-xs px-3 py-1 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all"
                      >Keep A</button>
                      <button
                        onClick={() => resolveDup({ flagId: flag.id, resolution: "deleted_a" })}
                        className="text-xs px-3 py-1 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all"
                      >Keep B</button>
                      <button
                        onClick={() => resolveDup({ flagId: flag.id, resolution: "kept_both" })}
                        className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
                      >Keep Both</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Question A</p>
                      <p className="text-sm text-gray-800 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: flag.questionA?.textMr ?? flag.questionA?.textEn ?? "" }}
                      />
                      {flag.questionA?.subject && <p className="text-xs text-gray-400 mt-1">{flag.questionA.subject.nameEn}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Question B</p>
                      <p className="text-sm text-gray-800 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: flag.questionB?.textMr ?? flag.questionB?.textEn ?? "" }}
                      />
                      {flag.questionB?.subject && <p className="text-xs text-gray-400 mt-1">{flag.questionB.subject.nameEn}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar filters */}
        <aside className="w-56 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="card p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input-field pl-9 text-sm py-2"
                placeholder="Search questions…"
                value={filters.search}
                onChange={e => setFilter("search", e.target.value)}
              />
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters
            </h3>

            {/* Subject filter */}
            <SubjectFilterDropdowns filters={filters} setFilter={setFilter} />

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="input-field text-sm py-1.5" value={filters.status} onChange={e => setFilter("status", e.target.value)}>
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
              <select className="input-field text-sm py-1.5" value={filters.difficulty} onChange={e => setFilter("difficulty", e.target.value)}>
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Question type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Question Type</label>
              <select className="input-field text-sm py-1.5" value={filters.type} onChange={e => setFilter("type", e.target.value)}>
                <option value="">All Types</option>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Usage filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Usage Count</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Unused", min: "0", max: "0" },
                  { label: "Used 1×", min: "1", max: "1" },
                  { label: "2–3×", min: "2", max: "3" },
                  { label: "4+", min: "4", max: "" },
                ].map(u => (
                  <button
                    key={u.label}
                    onClick={() => {
                      if (filters.usageMin === u.min && filters.usageMax === u.max) {
                        setFilters(f => ({ ...f, usageMin: "", usageMax: "", page: 1 }));
                      } else {
                        setFilters(f => ({ ...f, usageMin: u.min, usageMax: u.max, page: 1 }));
                      }
                    }}
                    className={`text-xs py-1 px-2 rounded-lg border transition-all ${
                      filters.usageMin === u.min && filters.usageMax === u.max
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white border-gray-200 text-gray-600 hover:border-primary-300"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => setFilters(f => ({ ...f, subjectId: "", chapterId: "", difficulty: "", type: "", status: "", usageMin: "", usageMax: "", search: "", page: 1 }))}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset filters
            </button>
          </div>
        </aside>

        {/* Main table */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="rounded" onChange={toggleAll} checked={selected.length === questions.length && questions.length > 0} />
                <span className="text-sm text-gray-500">
                  {pagination ? `${pagination.total.toLocaleString()} questions` : `${questions.length} questions`}
                  {selected.length > 0 && ` · ${selected.length} selected`}
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)
                : questions.length === 0
                  ? (
                    <div className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="font-medium">No questions found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  )
                  : [...questions].sort((a, b) => {
                      const sa = getHealthScore(a), sb = getHealthScore(b);
                      const aLow = sa < 4 ? 0 : 1, bLow = sb < 4 ? 0 : 1;
                      if (aLow !== bLow) return aLow - bLow;
                      return sa - sb;
                    }).map((q) => (
                    <div key={q.id} className={`px-4 py-3 hover:bg-gray-50 transition-all ${selected.includes(q.id) ? "bg-primary-50" : ""}`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          className="mt-1 rounded flex-shrink-0"
                          checked={selected.includes(q.id)}
                          onChange={() => toggleSelect(q.id)}
                        />

                        {/* Question text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                            {q.textEn}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {q.subject && <span className="text-xs text-gray-400">{q.subject.nameEn}</span>}
                            <select
                              value={q.difficulty}
                              className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white cursor-pointer"
                              onClick={e => e.stopPropagation()}
                              onChange={e => quickUpdate({ id: q.id, data: { difficulty: e.target.value } })}
                            >
                              {(["easy","medium","hard","expert"] as Difficulty[]).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select
                              value={q.status}
                              className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white cursor-pointer"
                              onClick={e => e.stopPropagation()}
                              onChange={e => quickUpdate({ id: q.id, data: { status: e.target.value } })}
                            >
                              {(["draft","pending_review","approved","rejected","archived"] as QStatus[]).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <UsageBadge count={q.usageCount} usedInTests={Array.isArray(q.usedInTests) ? q.usedInTests : []} />
                            {q.marks != null && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                +{q.marks}{q.negativeMarks ? ` / -${q.negativeMarks}` : ""}
                              </span>
                            )}
                            <HealthDot q={q} />
                            {getHealthScore(q) < 4 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Needs Review
                              </span>
                            )}
                            {q.type !== "MCQ" && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                {QUESTION_TYPES.find(t => t.value === q.type)?.label ?? q.type}
                              </span>
                            )}
                            {q.successRate != null && (
                              <span className="text-xs text-gray-400">✓ {q.successRate.toFixed(0)}% accuracy</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditQ(q)}
                            className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleClone(q)}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600"
                            title="Clone question"
                          >
                            📋
                          </button>
                          {q.status === "archived" ? (
                            <button
                              onClick={() => unarchiveQ(q.id)}
                              className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600"
                              title="Unarchive (restore to Draft)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              {q.status !== "approved" && (
                                <button
                                  onClick={() => approveQ(q.id)}
                                  className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {q.status === "pending_review" && (
                                <button
                                  onClick={() => setRejectId(q.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(q.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded preview */}
                      {expandedId === q.id && (
                        <div className="mt-3 ml-10 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                          {q.textMr && (
                            <p className="text-sm font-marathi text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: q.textMr }} />
                          )}
                          {q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${opt.isCorrect ? "bg-emerald-100 text-emerald-800 font-medium" : "bg-white border border-gray-200 text-gray-600"}`}>
                                  <span className="font-bold">{OPTION_LABELS[i]}.</span>
                                  <span>{opt.textEn}</span>
                                  {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.numericalAnswer != null && (
                            <p className="text-sm text-emerald-700 font-medium">Correct Answer: {q.numericalAnswer}</p>
                          )}
                          {q.explanationEn && (
                            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: q.explanationEn }} />
                          )}
                          {q.referenceSource && (
                            <p className="text-xs text-gray-400">📚 {q.referenceSource}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setFilter("page", String(filters.page - 1))}
                  className="btn-ghost border border-gray-200 text-sm disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setFilter("page", String(filters.page + 1))}
                  className="btn-ghost border border-gray-200 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      {(showAdd || editQ) && (
        <QuestionFormModal
          editQuestion={editQ ?? undefined}
          examType={selectedExam}
          onClose={() => { setShowAdd(false); setEditQ(null); }}
          onSaved={() => { setShowAdd(false); setEditQ(null); }}
        />
      )}

      {/* Clone modal — pre-fills with existing question data as a new question */}
      {cloneQ && (
        <QuestionFormModal
          editQuestion={undefined}
          prefillData={cloneQ}
          examType={selectedExam}
          onClose={() => setCloneQ(null)}
          onSaved={() => { setCloneQ(null); toast.success("Question cloned and saved as Draft"); }}
        />
      )}

      {/* Reject modal */}
      {rejectId && (
        <RejectModal
          questionId={rejectId}
          onClose={() => setRejectId(null)}
          onDone={() => setRejectId(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Question?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirmId(null)} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
              <button
                onClick={() => { deleteQ(deleteConfirmId); setDeleteConfirmId(null); }}
                className="btn-danger flex-1 justify-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title="Delete questions?"
        message={<>This will permanently remove <strong>{selected.length}</strong> question{selected.length === 1 ? "" : "s"} from the bank. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => bulkDelete()}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">Import Questions</h2>
                {importStep === "preview" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {previewQuestions.filter(q => !q.error).length} valid · {importResult?.errors?.length ?? 0} errors
                    {importMode === "file" && importFile && ` · ${importFile.name}`}
                    {importMode === "paste" && ` · pasted data`}
                  </p>
                )}
              </div>
              <button onClick={closeImportModal} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
            </div>

            {/* Mode tabs — only shown on upload step */}
            {importStep === "upload" && (
              <div className="flex gap-1 px-6 pt-4 pb-0">
                <button
                  onClick={() => setImportMode("file")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
                    importMode === "file"
                      ? "border-primary-600 text-primary-700 bg-primary-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📁 Upload File
                </button>
                <button
                  onClick={() => setImportMode("paste")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
                    importMode === "paste"
                      ? "border-primary-600 text-primary-700 bg-primary-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📋 Paste CSV Data
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">

              {/* ── Step 1: Upload ── */}
              {importStep === "upload" && importMode === "file" && (
                <div className="p-6 space-y-4">
                  {/* Template info */}
                  <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-primary-800">📋 Download a template first</p>
                      <p className="text-xs text-primary-600 mt-0.5">Fill it with questions, then upload below</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => downloadQuestionBankTemplate()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">
                        <Download className="w-3.5 h-3.5" /> Excel (.xlsx)
                      </button>
                      <button onClick={() => downloadQuestionBankTemplateCSV()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white text-primary-700 border border-primary-300 rounded-xl text-xs font-semibold hover:bg-primary-50 transition-all">
                        <Download className="w-3.5 h-3.5" /> CSV (.csv)
                      </button>
                    </div>
                  </div>

                  {/* Column reference table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-700 flex items-center gap-2">
                      📋 21-column format — columns marked <span className="text-red-500 font-bold">*</span> are required
                    </div>
                    <div className="overflow-x-auto max-h-52 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr className="border-b border-gray-200">
                            <th className="px-2 py-1.5 text-gray-500 font-semibold w-6">#</th>
                            <th className="px-2 py-1.5 text-gray-700 font-semibold">Field</th>
                            <th className="px-2 py-1.5 text-gray-500 font-semibold w-12 text-center">Req</th>
                            <th className="px-2 py-1.5 text-gray-500 font-semibold">Valid Values / Format</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { n:1,  f:"Subject",            r:true,  v:"History · Geography · Political Science · Current Affairs · Marathi Language · Economics · Science & Technology · Environment · General Studies · English · CSAT · Reasoning · Quantitative Aptitude" },
                            { n:2,  f:"Topic",              r:true,  v:"Free text (chapter / subtopic)" },
                            { n:3,  f:"Source Book",        r:false, v:"Free text — e.g. स्पर्धा परीक्षा जानेवारी 2025" },
                            { n:4,  f:"Source Page",        r:false, v:"Number — e.g. 90" },
                            { n:5,  f:"Question (English)", r:false, v:"Free text (leave blank if Marathi only)" },
                            { n:6,  f:"Question (Marathi)", r:true,  v:"Free text in Devanagari script" },
                            { n:7,  f:"Option A",           r:true,  v:"Free text" },
                            { n:8,  f:"Option B",           r:true,  v:"Free text" },
                            { n:9,  f:"Option C",           r:false, v:"Free text (leave blank if unused)" },
                            { n:10, f:"Option D",           r:false, v:"Free text (leave blank if unused)" },
                            { n:11, f:"Option E",           r:false, v:"MULTI_SELECT only — leave blank otherwise" },
                            { n:12, f:"Option F",           r:false, v:"MULTI_SELECT only — leave blank otherwise" },
                            { n:13, f:"Correct Answer",     r:true,  v:"Single letter: A B C D E F — or comma-separated for MULTI_SELECT: A,C or B,D,E" },
                            { n:14, f:"Type",               r:true,  v:"MCQ · MULTI_SELECT · TRUE_FALSE · ASSERTION_REASON · FILL_IN_BLANK · NUMERICAL · MATCH_THE_FOLLOWING · COMPREHENSION" },
                            { n:15, f:"Difficulty",         r:true,  v:"easy · medium · hard · expert (all lowercase)" },
                            { n:16, f:"Is PYQ",             r:false, v:"yes · no (all lowercase)" },
                            { n:17, f:"PYQ Year",           r:false, v:"4-digit year — e.g. 2024 (only when Is PYQ = yes)" },
                            { n:18, f:"PYQ Exam",           r:false, v:"Free text — e.g. Rajyaseva Pre" },
                            { n:19, f:"Explanation",        r:false, v:"Free text — solution / explanation paragraph" },
                            { n:20, f:"Explanation Book",   r:false, v:"Free text — reference book name" },
                            { n:21, f:"Explanation Page",   r:false, v:"Number — page in reference book" },
                          ].map(({ n, f, r, v }) => (
                            <tr key={n} className={`border-b border-gray-100 ${r ? "bg-white" : "bg-gray-50/50"}`}>
                              <td className="px-2 py-1 text-gray-400">{n}</td>
                              <td className="px-2 py-1 font-medium text-gray-800 whitespace-nowrap">
                                {f} {r && <span className="text-red-500">*</span>}
                              </td>
                              <td className="px-2 py-1 text-center">{r ? <span className="text-red-500 font-bold">✓</span> : <span className="text-gray-300">–</span>}</td>
                              <td className="px-2 py-1 text-gray-500 leading-tight">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} />
                    {importLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Parsing file…</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-5xl mb-3">📂</div>
                        <p className="text-sm font-semibold text-gray-700">Drop your Excel / CSV file here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse · .xlsx · .csv · max 10 MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 1: Paste ── */}
              {importStep === "upload" && importMode === "paste" && (
                <div className="p-6 space-y-4">

                  {/* Info banner */}
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">📋</span>
                    <div>
                      <p className="text-sm font-semibold text-violet-800">Paste comma-separated question data</p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        One question per line · <strong>21 columns</strong> in fixed order · columns 6, 7–8, 13, 14, 15 are <strong className="text-red-500">required</strong> · if you paste from a CSV file with a header row, it will be <strong>auto-detected and skipped</strong>
                      </p>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    rows={9}
                    placeholder={
                      "Current Affairs,Important Days,स्पर्धा परीक्षा 2025,90,,2024 च्या आंतरराष्ट्रीय भ्रष्टाचार विरोधी दिवसाची थीम काय होती?,Corruption Free Society,Youth Against Corruption,Uniting with Youth Against Corruption,Integrity for All,,,C,MCQ,medium,no,,,explanation here,source book,90\n" +
                      "History,Maratha Empire,,,,महाराष्ट्र राज्य कोणत्या वर्षी स्थापन झाले?,1956,1960,1947,1972,,,B,MCQ,easy,yes,2022,Rajyaseva Pre,Maharashtra was formed on 1 May 1960.,,\n" +
                      "... (paste data rows only — header row is auto-detected and removed)"
                    }
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    spellCheck={false}
                  />

                  {/* Line count indicator */}
                  {pasteText.trim() && (
                    <p className="text-xs text-gray-400 -mt-2">
                      {pasteText.trim().split("\n").filter(l => l.trim()).length} line(s) detected
                    </p>
                  )}

                  {/* Collapsible column format guide */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowFormatGuide(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-all text-sm font-semibold text-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        📋 Column structure guide (21 columns)
                        <span className="text-[10px] text-red-500 font-normal">* = required</span>
                      </span>
                      <span className="text-gray-400 text-xs">{showFormatGuide ? "▲ collapse" : "▼ expand"}</span>
                    </button>
                    {showFormatGuide && (
                      <div className="bg-white text-xs">
                        {/* CSV header row */}
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                          <p className="font-semibold text-amber-800 mb-1.5">📌 CSV column order (21 columns) — header row is auto-skipped if included:</p>
                          <code className="text-[10px] text-amber-700 break-all leading-relaxed block font-mono">
                            Subject,Topic,SourceBook,SourcePage,QuestionEnglish,QuestionMarathi*,OptionA*,OptionB*,OptionC,OptionD,OptionE,OptionF,CorrectAnswer*,Type*,Difficulty*,IsPYQ,PYQYear,PYQExam,Explanation,ExplanationBook,ExplanationPage
                          </code>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                              <tr>
                                <th className="px-2 py-1.5 text-gray-500 font-semibold w-6">#</th>
                                <th className="px-2 py-1.5 text-gray-700 font-semibold whitespace-nowrap">Field Name</th>
                                <th className="px-2 py-1.5 text-gray-500 font-semibold w-10 text-center">Req</th>
                                <th className="px-2 py-1.5 text-gray-500 font-semibold">Valid Values / Notes</th>
                                <th className="px-2 py-1.5 text-gray-500 font-semibold">Example</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { n:1,  f:"Subject",            r:true,  v:"History · Geography · Political Science · Current Affairs · Marathi Language · Economics · Science & Technology · Environment · General Studies · English · CSAT · Reasoning · Quantitative Aptitude", ex:"Current Affairs" },
                                { n:2,  f:"Topic",              r:true,  v:"Free text (chapter / subtopic name)", ex:"Important Days in December" },
                                { n:3,  f:"Source Book",        r:false, v:"Free text — name of reference book or journal", ex:"स्पर्धा परीक्षा जानेवारी 2025" },
                                { n:4,  f:"Source Page",        r:false, v:"Page number (numeric)", ex:"90" },
                                { n:5,  f:"Question (English)", r:false, v:"Question text in English — leave blank if Marathi only", ex:"What was the theme of Anti-Corruption Day 2024?" },
                                { n:6,  f:"Question (Marathi)", r:true,  v:"Question text in Devanagari script", ex:"2024 च्या आंतरराष्ट्रीय भ्रष्टाचार विरोधी दिवसाची थीम काय होती?" },
                                { n:7,  f:"Option A",           r:true,  v:"First answer option — free text", ex:"Corruption Free Society" },
                                { n:8,  f:"Option B",           r:true,  v:"Second answer option — free text", ex:"Youth Against Corruption" },
                                { n:9,  f:"Option C",           r:false, v:"Third option — leave blank if only 2 options", ex:"Uniting with Youth Against Corruption" },
                                { n:10, f:"Option D",           r:false, v:"Fourth option — leave blank if unused", ex:"Integrity for All" },
                                { n:11, f:"Option E",           r:false, v:"Fifth option — MULTI_SELECT only, blank otherwise", ex:"" },
                                { n:12, f:"Option F",           r:false, v:"Sixth option — MULTI_SELECT only, blank otherwise", ex:"" },
                                { n:13, f:"Correct Answer",     r:true,  v:"A · B · C · D · E · F   or comma-separated for MULTI_SELECT: A,C  or  B,D,E", ex:"C" },
                                { n:14, f:"Type",               r:true,  v:"MCQ · MULTI_SELECT · TRUE_FALSE · ASSERTION_REASON · FILL_IN_BLANK · NUMERICAL · MATCH_THE_FOLLOWING · COMPREHENSION", ex:"MCQ" },
                                { n:15, f:"Difficulty",         r:true,  v:"easy · medium · hard · expert  (all lowercase)", ex:"medium" },
                                { n:16, f:"Is PYQ",             r:false, v:"yes · no  (lowercase) — is this a Previous Year Question?", ex:"no" },
                                { n:17, f:"PYQ Year",           r:false, v:"4-digit year — e.g. 2024  (only when Is PYQ = yes)", ex:"" },
                                { n:18, f:"PYQ Exam",           r:false, v:"Exam name — e.g. Rajyaseva Pre  (only when Is PYQ = yes)", ex:"" },
                                { n:19, f:"Explanation",        r:false, v:"Explanation / solution paragraph (Marathi or English)", ex:"The theme was 'Uniting with Youth Against Corruption'." },
                                { n:20, f:"Explanation Book",   r:false, v:"Reference book name for the explanation", ex:"स्पर्धा परीक्षा जानेवारी 2025" },
                                { n:21, f:"Explanation Page",   r:false, v:"Page number in the reference book", ex:"90" },
                              ].map(({ n, f, r, v, ex }) => (
                                <tr key={n} className={`border-b border-gray-100 ${r ? "bg-white" : "bg-gray-50/40"}`}>
                                  <td className="px-2 py-1.5 text-gray-400 text-center">{n}</td>
                                  <td className="px-2 py-1.5 font-semibold whitespace-nowrap">
                                    <span className={r ? "text-gray-900" : "text-gray-600"}>{f}</span>
                                    {r && <span className="text-red-500 ml-0.5">*</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    {r
                                      ? <span className="text-emerald-600 font-bold text-xs">✓</span>
                                      : <span className="text-gray-300 text-xs">–</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-gray-500 leading-snug max-w-xs">{v}</td>
                                  <td className="px-2 py-1.5 font-mono text-violet-700 whitespace-nowrap max-w-[120px] truncate" title={ex}>{ex || <span className="text-gray-300">(blank)</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Preview ── */}
              {importStep === "preview" && (
                <div className="flex flex-col h-full">

                  {/* Stats bar */}
                  <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100 flex-shrink-0">
                    {[
                      { label: "Total Parsed",  value: previewQuestions.length,                                         color: "text-gray-900",    bg: "bg-gray-50 border-gray-200" },
                      { label: "Ready to Import", value: previewQuestions.filter(q => !q.error).length,                 color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                      { label: "Errors",         value: importResult?.errors?.length ?? 0,                             color: "text-red-700",     bg: "bg-red-50 border-red-200" },
                      { label: "Removed",        value: (importResult?.questions?.length ?? 0) - previewQuestions.length, color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
                    ].map(s => (
                      <div key={s.label} className={`p-3 rounded-xl border text-center ${s.bg}`}>
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Error list */}
                  {(importResult?.errors?.length ?? 0) > 0 && (
                    <div className="px-4 pt-3 space-y-1 flex-shrink-0">
                      <p className="text-xs font-semibold text-red-700 mb-1.5">⚠ Row-level errors (will be skipped):</p>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {importResult.errors.map((e: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>Row {e.row}: {e.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question cards */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {previewQuestions.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm">All questions removed — upload a new file</p>
                      </div>
                    ) : (
                      previewQuestions.map((q: any, idx: number) => {
                        const isExpanded = expandedPreviewIdx === idx;
                        return (
                          <div key={idx} className={`rounded-xl border-2 overflow-hidden ${q.error ? "border-red-300" : "border-gray-200"}`}>
                            {/* Card header */}
                            <div className={`flex items-center gap-2 px-3 py-2 ${q.error ? "bg-red-50" : "bg-gray-50"} border-b border-gray-100`}>
                              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              {q.subject && (
                                <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                  {q.subject}
                                </span>
                              )}
                              {q.difficulty && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  q.difficulty === "easy" ? "bg-emerald-100 text-emerald-700"
                                  : q.difficulty === "medium" ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-600"
                                }`}>{q.difficulty}</span>
                              )}
                              {q.type && q.type !== "MCQ" && (
                                <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{q.type}</span>
                              )}
                              {q.error && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠ {q.error}</span>
                              )}
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => setExpandedPreviewIdx(isExpanded ? null : idx)}
                                  className="p-1 hover:bg-primary-50 rounded-lg text-primary-500 text-xs transition-all"
                                  title={isExpanded ? "Collapse" : "Expand preview"}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => {
                                    setPreviewQuestions(qs => qs.filter((_, i) => i !== idx));
                                    if (expandedPreviewIdx === idx) setExpandedPreviewIdx(null);
                                  }}
                                  className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all"
                                  title="Remove from import"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Question text (always visible) */}
                            <div className="px-4 py-2">
                              <p className="text-sm text-gray-800 leading-snug line-clamp-2">{q.textEn}</p>
                              {q.textMr && !isExpanded && (
                                <p className="text-xs text-gray-400 font-marathi mt-0.5 truncate">{q.textMr}</p>
                              )}
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="px-4 pb-3 space-y-2 border-t border-gray-100 pt-2">
                                {q.textMr && (
                                  <p className="text-xs text-gray-500 font-marathi">{q.textMr}</p>
                                )}
                                {(q.options ?? []).length > 0 && (
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {(q.options as any[]).map((opt: any, oi: number) => (
                                      <div key={oi} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border ${
                                        opt.isCorrect
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                          : "bg-white border-gray-200 text-gray-600"
                                      }`}>
                                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${opt.isCorrect ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                                          {(opt.id ?? String.fromCharCode(65 + oi)).toUpperCase()}
                                        </span>
                                        <span className="truncate">{opt.text ?? opt.textEn ?? ""}</span>
                                        {opt.isCorrect && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0 text-emerald-600" />}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(q.explanationEn ?? q.explanation) && (
                                  <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-1.5">
                                    💡 {(q.explanationEn ?? q.explanation ?? "").slice(0, 120)}
                                    {(q.explanationEn ?? q.explanation ?? "").length > 120 ? "…" : ""}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 3: Done ── */}
              {importStep === "done" && (
                <div className="p-8 text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-bold text-gray-900 text-lg">Import Complete!</p>
                  <p className="text-sm text-gray-500 mt-1">Questions added as <strong>Pending Review</strong></p>
                  <p className="text-xs text-gray-400 mt-1">Review them in the question list and approve when ready</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              {importStep === "upload" && (
                <>
                  <button onClick={closeImportModal} className="btn-ghost border border-gray-200">Cancel</button>
                  {importMode === "paste" && (
                    <button
                      onClick={handlePasteParse}
                      disabled={importLoading || !pasteText.trim()}
                      className="btn-primary ml-auto disabled:opacity-50 flex items-center gap-2"
                    >
                      {importLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Parsing…
                        </>
                      ) : (
                        "Parse & Preview →"
                      )}
                    </button>
                  )}
                </>
              )}

              {importStep === "preview" && (
                <>
                  <button onClick={() => { setImportStep("upload"); setPreviewQuestions([]); setExpandedPreviewIdx(null); }}
                    className="btn-ghost border border-gray-200">
                    {importMode === "paste" ? "← Edit Paste" : "← Re-upload"}
                  </button>
                  <div className="flex-1 text-xs text-gray-400 flex items-center">
                    {previewQuestions.filter(q => !q.error).length} questions ready to import
                  </div>
                  <button
                    disabled={previewQuestions.filter(q => !q.error).length === 0 || importLoading}
                    onClick={async () => {
                      setImportLoading(true);
                      try {
                        const validParsed = previewQuestions.filter(q => !q.error);
                        const validCount  = validParsed.length;

                        if (!DEMO_MODE && importFile) {
                          const fd = new FormData();
                          fd.append("file", importFile);
                          fd.append("examType", selectedExam ?? "");
                          const token = localStorage.getItem("accessToken");
                          const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/questions/bulk-import`,
                            { method: "POST", body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} },
                          );
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message ?? "Import failed");
                          toast.success(`${data.data?.importedCount ?? validCount} questions imported!`);
                          qc.invalidateQueries({ queryKey: ["questions"] });
                          qc.invalidateQueries({ queryKey: ["question-stats"] });
                        } else {
                          // Demo mode — convert parsed questions to Question shape and add to local state
                          const now = Date.now();
                          const converted: Question[] = validParsed.map((q: any, idx: number) => ({
                            id:             `demo-import-${now}-${idx}`,
                            textEn:         q.textEn ?? q.text ?? "",
                            textMr:         q.textMr ?? "",
                            type:           (q.type ?? "MCQ") as QType,
                            difficulty:     (q.difficulty ?? "medium") as Difficulty,
                            status:         "pending_review" as QStatus,
                            isApproved:     false,
                            usageCount:     0,
                            examType:       selectedExam ?? "MPSC",
                            tags:           [],
                            subject:        q.subject ? { nameEn: q.subject } : undefined,
                            topic:          q.topic   ? { nameEn: q.topic }   : undefined,
                            options:        (q.options ?? []).map((o: any) => ({
                              id:        o.id ?? "",
                              textEn:    o.text ?? o.textEn ?? "",
                              textMr:    o.textMr ?? o.text ?? "",
                              isCorrect: !!o.isCorrect,
                            })),
                            explanationEn:  q.explanationEn ?? q.explanation ?? "",
                            explanationMr:  "",
                            referenceSource: q.sourceBook
                              ? `${q.sourceBook}${q.sourcePage ? ` p.${q.sourcePage}` : ""}`
                              : "",
                          }));
                          setDemoImportedQs(prev => [...prev, ...converted]);
                          toast.success(`${validCount} questions imported and added to Question Bank`);
                        }
                        setImportStep("done");
                      } catch (e: any) {
                        toast.error(e.message ?? "Import failed");
                      } finally {
                        setImportLoading(false);
                      }
                    }}
                    className="btn-primary disabled:opacity-50"
                  >
                    {importLoading
                      ? "Importing…"
                      : `Import ${previewQuestions.filter(q => !q.error).length} Questions →`
                    }
                  </button>
                </>
              )}

              {importStep === "done" && (
                <button onClick={closeImportModal} className="btn-primary w-full justify-center">
                  Done ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create test from selected */}
      {showCreateTest && (
        <CreateTestSetup
          onClose={() => setShowCreateTest(false)}
          onSave={() => setShowCreateTest(false)}
        />
      )}

      {/* Print Question Paper */}
      {showPrintModal && (
        <QuestionPaperModal
          questions={
            selected.length > 0
              ? questions.filter(q => selected.includes(q.id))
              : questions
          }
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
