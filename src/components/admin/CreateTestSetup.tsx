import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, CheckCircle, Plus, Trash2,
  Building2, Shield, ClipboardCheck, FileText, Settings2,
  Save, Calendar, Rocket, ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { DEMO_MODE } from "@/lib/demoMode";


// ── Types ───────────────────────────────────────────────────────────────────
type Step        = 1 | 2 | 3 | 4 | 5 | 6;
type ExamType    = "rajyaseva_pre"|"rajyaseva_main"|"psi_pre"|"sti_pre"|"aso"|"custom";
type PublishMode = "draft"|"schedule"|"publish";
type DiffMode    = "global"|"per_subject";

interface SubjectRow {
  id: string;
  subject: string;
  total: number;
  usedCount: number;
  easy: number;
  medium: number;
  hard: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const ALL_SUBJECTS = [
  "History", "Geography", "Political Science", "General Studies",
  "Marathi Language", "English", "CSAT", "Economics",
  "Science & Technology", "Environment", "Quantitative Aptitude",
  "Reasoning", "Current Affairs",
];

const BANK_AVAIL: Record<string, number> = {
  "History": 52, "Geography": 43, "Political Science": 54,
  "General Studies": 58, "Marathi Language": 32, "English": 28,
  "CSAT": 48, "Economics": 26, "Science & Technology": 34,
  "Environment": 22, "Quantitative Aptitude": 30, "Reasoning": 38,
  "Current Affairs": 24,
};

const BANK_USED: Record<string, number> = {
  "History": 14, "Geography": 8, "Political Science": 22,
  "General Studies": 18, "Marathi Language": 6, "English": 4,
  "CSAT": 12, "Economics": 8, "Science & Technology": 10,
  "Environment": 5, "Quantitative Aptitude": 9, "Reasoning": 12,
  "Current Affairs": 6,
};

const EXAM_PRESETS: Record<ExamType, {
  label: string; Icon: React.ElementType; badge: string;
  totalQ: number; duration: number; marks: number; neg: number; pass: number;
  group: "A"|"B"|"C"|"D"|null;
  subjects: { subject: string; total: number }[];
}> = {
  rajyaseva_pre: {
    label:"Rajyaseva Pre", Icon: Building2, badge:"Group A",
    totalQ:100, duration:60, marks:1, neg:0.33, pass:40, group:"A",
    subjects:[
      {subject:"History", total:20}, {subject:"Geography", total:15},
      {subject:"Political Science", total:20}, {subject:"General Studies", total:20},
      {subject:"Marathi Language", total:15}, {subject:"CSAT", total:10},
    ],
  },
  rajyaseva_main: {
    label:"Rajyaseva Main", Icon: Building2, badge:"Group A",
    totalQ:150, duration:120, marks:2, neg:0.66, pass:40, group:"A",
    subjects:[
      {subject:"History", total:25}, {subject:"Geography", total:20},
      {subject:"Political Science", total:25}, {subject:"General Studies", total:25},
      {subject:"Marathi Language", total:20}, {subject:"CSAT", total:15},
      {subject:"Economics", total:10}, {subject:"Environment", total:10},
    ],
  },
  psi_pre: {
    label:"PSI Pre", Icon: Shield, badge:"Group B",
    totalQ:100, duration:60, marks:1, neg:0.25, pass:40, group:"B",
    subjects:[
      {subject:"History", total:25}, {subject:"Geography", total:20},
      {subject:"Political Science", total:25}, {subject:"General Studies", total:20},
      {subject:"Marathi Language", total:10},
    ],
  },
  sti_pre: {
    label:"STI Pre", Icon: ClipboardCheck, badge:"Group B",
    totalQ:100, duration:60, marks:1, neg:0.25, pass:40, group:"B",
    subjects:[
      {subject:"History", total:25}, {subject:"Geography", total:20},
      {subject:"Political Science", total:25}, {subject:"General Studies", total:20},
      {subject:"Marathi Language", total:10},
    ],
  },
  aso: {
    label:"ASO", Icon: FileText, badge:"Group B",
    totalQ:100, duration:60, marks:1, neg:0.25, pass:40, group:"B",
    subjects:[
      {subject:"History", total:20}, {subject:"Geography", total:20},
      {subject:"Political Science", total:20}, {subject:"General Studies", total:25},
      {subject:"English", total:15},
    ],
  },
  custom: {
    label:"Custom", Icon: Settings2, badge:"Custom",
    totalQ:50, duration:30, marks:1, neg:0, pass:40, group:null,
    subjects:[],
  },
};

const DEMO_SERIES = [
  { id:"s1", titleEn:"Group A — Rajyaseva Mock 2026",  groupType:"A" },
  { id:"s2", titleEn:"Group B — PSI / STI / ASO 2026", groupType:"B" },
  { id:"s3", titleEn:"Group C — Technical 2026",        groupType:"C" },
  { id:"s4", titleEn:"Group D — Class IV 2026",         groupType:"D" },
];

const DIFF_PRESETS = [
  { label:"40/40/20", easy:40, medium:40, hard:20 },
  { label:"50/30/20", easy:50, medium:30, hard:20 },
  { label:"Equal",    easy:33, medium:33, hard:34 },
];

const STEP_META: { label: string; sub: string }[] = [
  { label:"Select Exam",      sub:"Pick exam type" },
  { label:"Test Series",      sub:"Choose or create" },
  { label:"Total Questions",  sub:"Set count" },
  { label:"Subject-wise",     sub:"Allocate per subject" },
  { label:"Difficulty",       sub:"Easy / Medium / Hard" },
  { label:"Settings & Publish", sub:"Configure & go live" },
];

const GROUP_BG: Record<string, string> = {
  A: "bg-primary-600", B: "bg-sky-600", C: "bg-purple-600", D: "bg-emerald-600",
};

// ── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSave:  (result: { testTitle: string; questions: number; status: string }) => void;
  seriesId?: string;
}

export default function CreateTestSetup({ onClose, onSave, seriesId: presetSeriesId }: Props) {
  const qc = useQueryClient();

  // ── Navigation ──
  const [activeStep, setActiveStep] = useState<Step>(1);
  const [completed,  setCompleted]  = useState<Set<Step>>(new Set());

  const advance = (step: Step) => {
    setCompleted(prev => new Set([...prev, step]));
    setActiveStep((step + 1) as Step);
  };
  const goBack = () => setActiveStep(s => Math.max(1, s - 1) as Step);
  const goToStep = (step: Step) => {
    if (completed.has(step) || step < activeStep) setActiveStep(step);
  };

  // ── Step 1: Exam ──
  const [examType, setExamType] = useState<ExamType|null>(null);

  // ── Step 2: Series ──
  const [seriesMode,     setSeriesMode]     = useState<"existing"|"new">(presetSeriesId ? "existing" : "new");
  const [seriesId,       setSeriesId]       = useState(presetSeriesId ?? "");
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [group,          setGroup]          = useState<"A"|"B"|"C"|"D"|null>(null);

  // ── Step 3: Total questions ──
  const [totalQuestions, setTotalQuestions] = useState(100);

  // ── Step 4: Subject rows ──
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  const setSubjectField = <K extends keyof SubjectRow>(id: string, key: K, val: SubjectRow[K]) =>
    setSubjects(s => s.map(r => r.id === id ? { ...r, [key]: val } : r));

  const addSubject = () =>
    setSubjects(s => [...s, { id: uid(), subject: "", total: 10, usedCount: 0, easy: 40, medium: 40, hard: 20 }]);

  const removeSubject = (id: string) =>
    setSubjects(s => s.filter(r => r.id !== id));

  const allocated = subjects.reduce((n, r) => n + (r.total || 0), 0);
  const remaining = totalQuestions - allocated;

  const autoDistribute = () => {
    if (subjects.length === 0) return;
    const base = Math.floor(totalQuestions / subjects.length);
    const rem  = totalQuestions % subjects.length;
    setSubjects(s => s.map((r, i) => {
      const fresh = (BANK_AVAIL[r.subject] ?? 999) - (BANK_USED[r.subject] ?? 0);
      return { ...r, total: Math.min(fresh > 0 ? fresh : (BANK_AVAIL[r.subject] ?? 999), base + (i < rem ? 1 : 0)), usedCount: 0 };
    }));
  };

  // ── Step 5: Difficulty ──
  const [diffMode,     setDiffMode]     = useState<DiffMode>("global");
  const [globalEasy,   setGlobalEasy]   = useState(40);
  const [globalMedium, setGlobalMedium] = useState(40);
  const [globalHard,   setGlobalHard]   = useState(20);

  const diffSum = globalEasy + globalMedium + globalHard;

  const applyPreset = (p: typeof DIFF_PRESETS[0]) => {
    setGlobalEasy(p.easy); setGlobalMedium(p.medium); setGlobalHard(p.hard);
  };

  // ── Step 6: Settings & Publish ──
  const [duration,    setDuration]    = useState(60);
  const [marksPerQ,   setMarksPerQ]   = useState(1);
  const [negMarks,    setNegMarks]    = useState(0.33);
  const [passingPct,  setPassingPct]  = useState(40);
  const [shuffleQ,    setShuffleQ]    = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [certOnPass,  setCertOnPass]  = useState(false);
  const [retakeLimit, setRetakeLimit] = useState(0);
  const [publishMode, setPublishMode] = useState<PublishMode>("draft");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("10:00");
  const [isPremium,   setIsPremium]   = useState(false);
  const [price,       setPrice]       = useState(0);
  const [testTitle,   setTestTitle]   = useState("");
  const [testTitleMr, setTestTitleMr] = useState("");

  // ── Fetch series list ──
  const { data: seriesData } = useQuery({
    queryKey: ["admin","test-series"],
    queryFn:  () => api.get<any>("/admin/test-series"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? DEMO_SERIES : undefined,
    staleTime: 60_000,
  });

  // ── Fetch subjects (name -> id) so the subject-allocation step can
  // actually query the bank by subjectId, not just a display name ──
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn:  () => api.get<any>("/subjects"),
    enabled:  !DEMO_MODE,
    staleTime: 300_000,
  });
  const subjectNameToId: Record<string, string> = Object.fromEntries(
    (Array.isArray(subjectsData) ? subjectsData : []).map((s: any) => [s.nameEn, s.id]),
  );
  // api.get() already unwraps the response envelope, so seriesData is the
  // series array itself — don't unwrap .data again or this always falls
  // through to the demo fixture, sending fake "s1".."s4" IDs to the backend.
  const allSeriesList: { id:string; titleEn:string; groupType?:string }[] = (seriesData as any) ?? DEMO_SERIES;

  // Filter series by exam group
  const examGroup = examType ? EXAM_PRESETS[examType].group : null;
  const filteredSeriesList = examGroup
    ? allSeriesList.filter(s => !s.groupType || s.groupType === examGroup)
    : allSeriesList;

  // ── Apply exam preset ──
  const applyExamPreset = (type: ExamType) => {
    const p = EXAM_PRESETS[type];
    setExamType(type);
    setTotalQuestions(p.totalQ);
    setDuration(p.duration);
    setMarksPerQ(p.marks);
    setNegMarks(p.neg);
    setPassingPct(p.pass);
    if (p.group) setGroup(p.group);
    setSubjects(p.subjects.map(s => ({ id: uid(), subject: s.subject, total: s.total, usedCount: 0, easy: 40, medium: 40, hard: 20 })));
    if (!testTitle) setTestTitle(`${p.label} — Mock Test 1`);
  };

  // ── Save mutation ──
  const { mutate: saveTest, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 700));
        return { data: { id: `demo-${Date.now()}` } };
      }
      let targetSeriesId = seriesId;
      if (seriesMode === "new" && newSeriesTitle) {
        const s = await api.post<any>("/admin/test-series", {
          titleEn: newSeriesTitle, type: "GROUP_WISE", groupType: group ? `GROUP_${group}` : undefined,
        });
        targetSeriesId = (s as any)?.id;
      }
      const test = await api.post<any>("/admin/tests", {
        seriesId: targetSeriesId,
        titleEn: testTitle, titleMr: testTitleMr || undefined,
        duration, totalMarks: totalQuestions * marksPerQ, passingPct,
        negativeMarking: negMarks > 0, defaultNegMarkValue: negMarks,
        shuffleQuestions: shuffleQ, shuffleOptions: shuffleOpts, certOnPass, retakeLimit,
        status: publishMode === "publish" ? "published" : publishMode === "schedule" ? "scheduled" : "draft",
        scheduledAt: publishMode === "schedule" ? `${publishDate}T${publishTime}:00` : undefined,
      });
      const testId = (test as any)?.id;

      // Pick real approved bank questions matching the subject/difficulty
      // allocation from steps 4-5 and assign them to the test — without
      // this, that allocation UI just collected numbers that went nowhere.
      const shortfalls: string[] = [];
      const pickedQuestionIds: string[] = [];
      for (const row of subjects) {
        const subjectId = subjectNameToId[row.subject];
        if (!subjectId) { shortfalls.push(`${row.subject}: subject not found`); continue; }
        const split = diffMode === "global"
          ? { easy: globalEasy, medium: globalMedium, hard: globalHard }
          : { easy: row.easy, medium: row.medium, hard: row.hard };
        const easyCount   = Math.round(row.total * split.easy / 100);
        const mediumCount = Math.round(row.total * split.medium / 100);
        const hardCount   = Math.max(0, row.total - easyCount - mediumCount);
        for (const [difficulty, count] of [["easy", easyCount], ["medium", mediumCount], ["hard", hardCount]] as const) {
          if (count <= 0) continue;
          const found = await api.get<any>("/questions", {
            params: { subjectId, difficulty, status: "approved", limit: count },
          });
          const ids = (Array.isArray(found) ? found : []).map((q: any) => q.id);
          pickedQuestionIds.push(...ids);
          if (ids.length < count) {
            shortfalls.push(`${row.subject} (${difficulty}): only ${ids.length} of ${count} available`);
          }
        }
      }
      if (pickedQuestionIds.length > 0) {
        await api.post(`/admin/tests/${testId}/questions`, { questionIds: pickedQuestionIds });
      }
      return { test, shortfalls, picked: pickedQuestionIds.length };
    },
    onSuccess: (result: any) => {
      if (DEMO_MODE) {
        toast.success("Test created successfully!");
      } else if (result.shortfalls.length > 0) {
        toast.success(`Test created with ${result.picked} questions — some subjects came up short:\n${result.shortfalls.join("\n")}`, { duration: 6000 });
      } else {
        toast.success(`Test created with ${result.picked} questions!`);
      }
      qc.invalidateQueries({ queryKey: ["admin","tests"] });
      qc.invalidateQueries({ queryKey: ["admin","test-series"] });
      onSave({ testTitle, questions: totalQuestions, status: publishMode === "publish" ? "published" : "draft" });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create test"),
  });

  // ── Validation ──
  const step1Valid = !!examType;
  const step2Valid = seriesMode === "existing" ? !!seriesId : !!newSeriesTitle.trim();
  const step3Valid = totalQuestions >= 5;
  const step4Valid = subjects.length > 0 && allocated === totalQuestions && subjects.every(s => s.subject && s.total >= 1);
  const step5Valid = diffMode === "global" ? diffSum === 100 : subjects.every(s => (s.easy + s.medium + s.hard) === 100);
  const step6Valid = testTitle.trim().length > 0;

  const stepValid: Record<Step, boolean> = { 1:step1Valid, 2:step2Valid, 3:step3Valid, 4:step4Valid, 5:step5Valid, 6:step6Valid };

  // ── Summary values for left nav ──
  const summaries: Record<Step, string> = {
    1: examType ? `${EXAM_PRESETS[examType].label} · ${EXAM_PRESETS[examType].badge}` : "",
    2: seriesMode === "existing"
      ? (filteredSeriesList.find(s => s.id === seriesId)?.titleEn ?? "")
      : newSeriesTitle,
    3: step3Valid ? `${totalQuestions} Qs · ${totalQuestions * marksPerQ} marks` : "",
    4: step4Valid ? subjects.slice(0,2).map(s=>`${s.subject} ${s.total}`).join(", ") + (subjects.length>2?`…`:"") : "",
    5: step5Valid ? (diffMode==="global" ? `${globalEasy}E · ${globalMedium}M · ${globalHard}H` : "Per subject") : "",
    6: step6Valid ? testTitle : "",
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step content renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Select Exam Type</h3>
      <p className="text-sm text-gray-500 mb-5">Choose to auto-fill default settings for the test</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.entries(EXAM_PRESETS) as [ExamType, typeof EXAM_PRESETS[ExamType]][]).map(([key, p]) => {
          const Icon = p.Icon;
          return (
            <button key={key} type="button" onClick={() => applyExamPreset(key)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                examType === key
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                  : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                examType === key ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm">{p.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.badge} · {p.totalQ} Qs · {p.duration}min</div>
              </div>
              {examType === key && <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Test Series</h3>
      <p className="text-sm text-gray-500 mb-5">Which series will this test belong to?</p>
      <div className="flex gap-2 mb-5">
        {(["existing","new"] as const).map(m => (
          <button key={m} type="button" onClick={() => setSeriesMode(m)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              seriesMode === m ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-violet-300"
            }`}>
            {m === "existing" ? "Existing Series" : "+ Create New Series"}
          </button>
        ))}
      </div>
      {seriesMode === "existing" ? (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Select Series
            {examGroup && <span className="ml-2 text-violet-600 font-semibold">· Showing Group {examGroup} only</span>}
          </label>
          <select className="input-field" value={seriesId} onChange={e => setSeriesId(e.target.value)}>
            <option value="">— Select a series —</option>
            {filteredSeriesList.map(s => <option key={s.id} value={s.id}>{s.titleEn}</option>)}
          </select>
          {filteredSeriesList.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">No series for this group yet. Switch to "Create New" to make one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Series Title (English) *</label>
            <input className="input-field" placeholder="e.g. Rajyaseva Pre Full Mock 2026"
              value={newSeriesTitle} onChange={e => setNewSeriesTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Group
              {examGroup && <span className="ml-2 text-violet-600">(Pre-filled from exam type)</span>}
            </label>
            <div className="flex gap-2">
              {(["A","B","C","D"] as const).map(g => (
                <button key={g} type="button" onClick={() => setGroup(g)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    group === g
                      ? `border-transparent text-white ${GROUP_BG[g]}`
                      : "border-gray-200 text-gray-500 hover:border-violet-300"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Total Questions</h3>
      <p className="text-sm text-gray-500 mb-6">How many questions should this test have?</p>
      <div className="flex items-center gap-4 justify-center py-2 mb-4">
        <button type="button" onClick={() => setTotalQuestions(q => Math.max(5, q - 5))}
          className="w-12 h-12 rounded-2xl border-2 border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-2xl flex items-center justify-center transition-all">−</button>
        <input type="number" min={5} max={300}
          className="w-28 text-center input-field py-3 text-3xl font-bold"
          value={totalQuestions}
          onChange={e => setTotalQuestions(Math.max(5, Number(e.target.value)))} />
        <button type="button" onClick={() => setTotalQuestions(q => Math.min(300, q + 5))}
          className="w-12 h-12 rounded-2xl border-2 border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-2xl flex items-center justify-center transition-all">+</button>
      </div>
      <div className="flex items-center justify-center gap-2 mb-5 text-sm text-gray-500">
        <span>{totalQuestions} questions</span>
        <span className="text-gray-300">×</span>
        <span className="font-semibold text-gray-700">+{marksPerQ} marks</span>
        <span className="text-gray-300">=</span>
        <span className="font-bold text-violet-700">{(totalQuestions * marksPerQ).toFixed(0)} total marks</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {[25, 50, 75, 100, 150, 200].map(n => (
          <button key={n} type="button" onClick={() => setTotalQuestions(n)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
              totalQuestions === n ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-violet-300"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Subject-wise Questions</h3>
      <p className="text-sm text-gray-500 mb-4">Set how many questions from each subject</p>

      {/* Budget bar */}
      <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-gray-700">Question Budget</span>
          <span className={`font-bold ${
            allocated > totalQuestions ? "text-red-600" :
            allocated === totalQuestions ? "text-emerald-600" : "text-violet-600"
          }`}>
            {allocated} / {totalQuestions} allocated
            {allocated < totalQuestions && ` · ${remaining} remaining`}
            {allocated === totalQuestions && " ✓ Complete"}
            {allocated > totalQuestions && ` · ${allocated - totalQuestions} over budget`}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${
            allocated > totalQuestions ? "bg-red-500" : allocated === totalQuestions ? "bg-emerald-500" : "bg-violet-500"
          }`} style={{ width: `${Math.min((allocated / totalQuestions) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Subject rows */}
      <div className="space-y-2 mb-3">
        {subjects.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
            <p>No subjects added.</p>
            <p className="text-xs mt-1">Select an exam in Step 1 to auto-fill, or add manually.</p>
          </div>
        )}
        {subjects.map(row => {
          const avail       = BANK_AVAIL[row.subject] ?? null;
          const bankUsed    = BANK_USED[row.subject] ?? 0;
          const fresh       = avail != null ? avail - bankUsed : null;
          const maxUsed     = Math.min(row.total, bankUsed);
          const freshNeeded = row.total - row.usedCount;
          const isOverTotal = avail != null && row.total > avail;
          const isOverFresh = fresh != null && freshNeeded > fresh && !isOverTotal;
          return (
            <div key={row.id} className={`p-3 rounded-xl border-2 transition-all ${
              isOverTotal ? "border-red-300 bg-red-50/40" :
              isOverFresh ? "border-amber-300 bg-amber-50/40" :
              "border-gray-200 hover:border-gray-300"
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="input-field flex-1 min-w-32 py-1.5 text-sm"
                  value={row.subject}
                  onChange={e => setSubjectField(row.id, "subject", e.target.value)}>
                  <option value="">— Select Subject —</option>
                  {ALL_SUBJECTS.map(s => (
                    <option key={s} value={s} disabled={subjects.some(r => r.id !== row.id && r.subject === s)}>{s}</option>
                  ))}
                </select>

                {/* Total Qs */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => setSubjectField(row.id, "total", Math.max(1, row.total - 1))}
                    className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-sm">−</button>
                  <div className="flex flex-col items-center">
                    <input type="number" min={1} max={avail ?? 999}
                      className={`w-14 text-center input-field py-1 text-sm font-bold ${
                        isOverTotal ? "border-red-400 text-red-700" :
                        isOverFresh ? "border-amber-400 text-amber-700" : ""
                      }`}
                      value={row.total}
                      onChange={e => {
                        const v = Math.max(1, Number(e.target.value));
                        setSubjectField(row.id, "total", v);
                        if (row.usedCount > v) setSubjectField(row.id, "usedCount", v);
                      }} />
                    <span className="text-[9px] text-gray-400 mt-0.5">Total</span>
                  </div>
                  <button type="button" onClick={() => setSubjectField(row.id, "total", Math.min(avail ?? 999, row.total + 1))}
                    disabled={avail != null && row.total >= avail}
                    className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-sm disabled:opacity-30">+</button>
                </div>

                {/* Used Qs */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button"
                    onClick={() => setSubjectField(row.id, "usedCount", Math.max(0, row.usedCount - 1))}
                    className="w-7 h-7 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm">−</button>
                  <div className="flex flex-col items-center">
                    <input type="number" min={0} max={maxUsed}
                      className="w-14 text-center input-field py-1 text-sm font-bold border-amber-300 text-amber-700"
                      value={row.usedCount}
                      onChange={e => setSubjectField(row.id, "usedCount", Math.max(0, Math.min(maxUsed, Number(e.target.value))))} />
                    <span className="text-[9px] text-amber-500 mt-0.5">Used Qs</span>
                  </div>
                  <button type="button"
                    onClick={() => setSubjectField(row.id, "usedCount", Math.min(maxUsed, row.usedCount + 1))}
                    disabled={row.usedCount >= maxUsed}
                    className="w-7 h-7 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm disabled:opacity-30">+</button>
                </div>

                <button type="button" onClick={() => removeSubject(row.id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0 ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bank info row */}
              {row.subject && (
                <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                  {avail != null && <span className="text-gray-500">📦 {avail} in bank</span>}
                  {bankUsed > 0 && <span className="text-amber-600">🔄 {bankUsed} prev. used</span>}
                  {fresh != null && <span className={`font-semibold ${fresh > 0 ? "text-emerald-600" : "text-red-500"}`}>✨ {fresh} fresh</span>}
                  <span className="text-gray-400 ml-auto">= {row.usedCount} used + {freshNeeded} fresh</span>
                  {isOverTotal && <span className="text-red-600 font-semibold">⚠ Exceeds bank limit</span>}
                  {isOverFresh && !isOverTotal && <span className="text-amber-600 font-semibold">⚠ Not enough fresh questions</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={addSubject}
          disabled={subjects.length >= ALL_SUBJECTS.length}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-xs font-semibold hover:border-violet-400 hover:text-violet-600 transition-all disabled:opacity-40">
          <Plus className="w-3.5 h-3.5" /> Add Subject
        </button>
        {subjects.length > 0 && remaining !== 0 && (
          <button type="button" onClick={autoDistribute}
            className="px-3 py-2 rounded-xl border-2 border-violet-300 text-violet-700 text-xs font-semibold hover:bg-violet-50 transition-all">
            ⚡ Auto-distribute {totalQuestions} Qs
          </button>
        )}
      </div>

      {subjects.length > 0 && allocated !== totalQuestions && (
        <div className={`mt-3 px-4 py-2.5 rounded-xl text-xs font-medium ${
          allocated > totalQuestions ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {allocated > totalQuestions
            ? `⚠ ${allocated - totalQuestions} questions over budget — reduce some subjects`
            : `${remaining} questions unallocated — add subjects or click "Auto-distribute"`}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-1">Difficulty Distribution</h3>
      <p className="text-sm text-gray-500 mb-5">Set the Easy / Medium / Hard mix</p>

      <div className="flex gap-2 mb-5">
        {(["global","per_subject"] as const).map(m => (
          <button key={m} type="button" onClick={() => setDiffMode(m)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              diffMode === m ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-violet-300"
            }`}>
            {m === "global" ? "Same for all subjects" : "Per subject (custom)"}
          </button>
        ))}
      </div>

      {diffMode === "global" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-1">
            <span className="text-xs text-gray-500 self-center">Quick presets:</span>
            {DIFF_PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  globalEasy === p.easy && globalMedium === p.medium
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-gray-200 text-gray-500 hover:border-violet-300"
                }`}>{p.label}</button>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-600">Difficulty Mix</span>
              <span className={`font-bold ${diffSum === 100 ? "text-emerald-600" : "text-red-600"}`}>
                {diffSum}% {diffSum === 100 ? "✓" : "≠ 100%"}
              </span>
            </div>
            {[
              { label:"Easy",   color:"text-emerald-600", val:globalEasy,   set:(v:number) => { setGlobalEasy(v); setGlobalHard(Math.max(0,100-v-globalMedium)); } },
              { label:"Medium", color:"text-amber-600",   val:globalMedium, set:(v:number) => { setGlobalMedium(v); setGlobalHard(Math.max(0,100-globalEasy-v)); } },
              { label:"Hard",   color:"text-red-600",     val:globalHard,   set:(v:number) => setGlobalHard(v) },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-14 flex-shrink-0 ${row.color}`}>{row.label}</span>
                <input type="range" min={0} max={100} step={5} value={row.val}
                  onChange={e => row.set(parseInt(e.target.value))}
                  className="flex-1 accent-violet-600 h-1.5" />
                <span className="text-xs font-bold text-gray-700 w-24 text-right flex-shrink-0">
                  {row.val}% <span className="text-gray-400">({Math.round(totalQuestions * row.val / 100)} Qs)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-3">Set Easy / Medium / Hard % for each subject (must sum to 100%)</p>
          {subjects.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6 border-2 border-dashed border-gray-200 rounded-xl">Configure subjects in Step 4 first</p>
          )}
          {subjects.map(row => {
            const sum = row.easy + row.medium + row.hard;
            return (
              <div key={row.id} className={`p-3 rounded-xl border-2 ${sum === 100 ? "border-emerald-200 bg-emerald-50/20" : "border-amber-300 bg-amber-50/30"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{row.subject || "—"}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sum === 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {sum}% {sum === 100 ? "✓" : "≠ 100%"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label:"Easy",   color:"border-emerald-300 text-emerald-700", val:row.easy,   key:"easy" as const },
                    { label:"Medium", color:"border-amber-300 text-amber-700",     val:row.medium, key:"medium" as const },
                    { label:"Hard",   color:"border-red-300 text-red-700",         val:row.hard,   key:"hard" as const },
                  ].map(d => (
                    <div key={d.key}>
                      <label className={`block text-[10px] font-semibold mb-1 ${d.color.split(" ")[1]}`}>{d.label} %</label>
                      <input type="number" min={0} max={100} step={5}
                        className={`input-field text-center text-sm font-bold py-1 border-2 ${d.color}`}
                        value={d.val}
                        onChange={e => setSubjectField(row.id, d.key, Math.max(0, Math.min(100, Number(e.target.value))))} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Settings & Publish</h3>
        <p className="text-sm text-gray-500">Configure test details and choose how to publish</p>
      </div>

      {/* Test title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title (English) *</label>
          <input className="input-field" placeholder="e.g. Mock Test 1 — Full Syllabus"
            value={testTitle} onChange={e => setTestTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title (Marathi)</label>
          <input className="input-field font-marathi" placeholder="मराठी शीर्षक"
            value={testTitleMr} onChange={e => setTestTitleMr(e.target.value)} />
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Duration (min)", val:duration,   set:(v:number) => setDuration(v),   min:10, step:5 },
          { label:"+Marks/Correct",  val:marksPerQ,  set:(v:number) => setMarksPerQ(v),  min:0.25, step:0.25 },
          { label:"−Marks/Wrong",   val:negMarks,   set:(v:number) => setNegMarks(v),   min:0, step:0.25 },
          { label:"Passing %",      val:passingPct, set:(v:number) => setPassingPct(v), min:0, step:5 },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.label}</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => f.set(Math.max(f.min, f.val - f.step))}
                className="w-8 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center flex-shrink-0">−</button>
              <input type="number" min={f.min} step={f.step}
                className="input-field text-center flex-1 min-w-0 py-2 text-sm font-bold"
                value={f.val} onChange={e => f.set(Number(e.target.value))} />
              <button type="button" onClick={() => f.set(f.val + f.step)}
                className="w-8 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold flex items-center justify-center flex-shrink-0">+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {[
          { label:"Shuffle Questions", val:shuffleQ,    set:setShuffleQ },
          { label:"Shuffle Options",   val:shuffleOpts, set:setShuffleOpts },
          { label:"Certificate on Pass", val:certOnPass, set:setCertOnPass },
        ].map(o => (
          <label key={o.label} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" className="rounded accent-violet-600" checked={o.val}
              onChange={e => o.set(e.target.checked)} />
            <span className="text-gray-700">{o.label}</span>
          </label>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Retakes:</span>
          <select className="input-field py-1 text-sm w-28" value={retakeLimit}
            onChange={e => setRetakeLimit(Number(e.target.value))}>
            <option value={0}>Unlimited</option>
            <option value={1}>1× only</option>
            <option value={2}>2 times</option>
            <option value={3}>3 times</option>
          </select>
        </div>
      </div>

      {/* Publish mode */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Publish Settings</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key:"draft",    Icon:Save,     label:"Save Draft",   desc:"Not visible yet" },
            { key:"schedule", Icon:Calendar, label:"Schedule",     desc:"Set a date/time" },
            { key:"publish",  Icon:Rocket,   label:"Publish Now",  desc:"Go live immediately" },
          ] as {key:PublishMode; Icon:React.ElementType; label:string; desc:string}[]).map(opt => {
            const Icon = opt.Icon;
            return (
              <button key={opt.key} type="button" onClick={() => setPublishMode(opt.key)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  publishMode === opt.key ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300"
                }`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${publishMode === opt.key ? "text-violet-600" : "text-gray-400"}`} />
                <div className={`text-xs font-bold ${publishMode === opt.key ? "text-violet-800" : "text-gray-700"}`}>{opt.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            );
          })}
        </div>
        {publishMode === "schedule" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input type="date" className="input-field" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
            <input type="time" className="input-field" value={publishTime} onChange={e => setPublishTime(e.target.value)} />
          </div>
        )}
      </div>

      {/* Premium */}
      <div className={`p-4 rounded-xl border-2 transition-all ${isPremium ? "border-amber-300 bg-amber-50/40" : "border-gray-200"}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded accent-amber-600 w-4 h-4" checked={isPremium}
            onChange={e => setIsPremium(e.target.checked)} />
          <div>
            <span className="text-sm font-semibold text-gray-800">Premium / Paid Access</span>
            <p className="text-xs text-gray-400">Students must purchase to attempt this test</p>
          </div>
        </label>
        {isPremium && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Price (₹)</span>
            <input type="number" className="input-field w-32" placeholder="e.g. 599"
              value={price} onChange={e => setPrice(Number(e.target.value))} />
          </div>
        )}
      </div>
    </div>
  );

  const stepRenderers: Record<Step, () => JSX.Element> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3,
    4: renderStep4, 5: renderStep5, 6: renderStep6,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl my-0 sm:my-6 flex flex-col max-h-screen sm:max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create New Test</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {examType ? `${EXAM_PRESETS[examType].label} · ${EXAM_PRESETS[examType].badge}` : "Follow the steps to build your test"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left Nav + Right Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left nav */}
          <div className="w-48 flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto bg-gray-50/50 hidden sm:flex">
            <div className="p-4 space-y-1">
              {(Object.entries(STEP_META) as unknown as [number, {label:string; sub:string}][]).map(([i, meta]) => {
                const step = (i + 1) as Step;
                const isDone   = completed.has(step);
                const isActive = activeStep === step;
                const isPast   = isDone && !isActive;
                const canClick = isPast || step < activeStep;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => canClick ? goToStep(step) : undefined}
                    disabled={!canClick && !isActive}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? "bg-violet-100 border border-violet-200" :
                      isPast   ? "hover:bg-gray-100 cursor-pointer" :
                      "opacity-40 cursor-default"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isPast   ? "bg-emerald-500 text-white" :
                        isActive ? "bg-violet-600 text-white" :
                        "bg-gray-200 text-gray-500"
                      }`}>
                        {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : step}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? "text-violet-800" : isPast ? "text-gray-700" : "text-gray-400"}`}>
                          {meta.label}
                        </div>
                        {isPast && summaries[step] && (
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{summaries[step]}</div>
                        )}
                        {!isPast && (
                          <div className="text-[10px] text-gray-400 truncate">{meta.sub}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Compact summary */}
            {completed.size > 0 && (
              <div className="mt-auto p-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</p>
                <div className="space-y-1.5">
                  {([1,2,3] as Step[]).filter(s => completed.has(s) && summaries[s]).map(s => (
                    <div key={s} className="text-[10px] text-gray-500 leading-tight">
                      <span className="font-semibold text-gray-600">{STEP_META[s-1].label}: </span>
                      {summaries[s]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mobile step indicator */}
            <div className="flex items-center gap-2 mb-5 sm:hidden">
              {([1,2,3,4,5,6] as Step[]).map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${
                  completed.has(s) ? "bg-emerald-500" :
                  activeStep === s ? "bg-violet-600" :
                  "bg-gray-200"
                }`} />
              ))}
            </div>

            {stepRenderers[activeStep]()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button onClick={onClose} className="btn-ghost border border-gray-200 text-sm">Cancel</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">Step {activeStep} of 6</span>
            {activeStep > 1 && (
              <button type="button" onClick={goBack} className="btn-ghost border border-gray-200 text-sm flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {activeStep < 6 ? (
              <button type="button" onClick={() => advance(activeStep)}
                disabled={!stepValid[activeStep]}
                className="btn-primary text-sm disabled:opacity-40">
                Continue →
              </button>
            ) : (
              <button type="button" onClick={() => saveTest()}
                disabled={!step6Valid || saving}
                className="btn-primary text-sm disabled:opacity-40 flex items-center gap-2">
                {saving ? "Creating…" :
                 publishMode === "publish" ? <><Rocket className="w-4 h-4" /> Publish Test</> :
                 publishMode === "schedule" ? <><Calendar className="w-4 h-4" /> Schedule Test</> :
                 <><Save className="w-4 h-4" /> Save Draft</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
