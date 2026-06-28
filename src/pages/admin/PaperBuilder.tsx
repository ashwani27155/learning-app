import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import QuestionPaperModal from "../../components/admin/QuestionPaperModal";
import { DEMO_MODE } from "@/lib/demoMode";
import type { BankFilters, PaperMeta, Question, SmartSlot, Subject } from "../../components/admin/paper-builder/types";
import { DEMO_QS, DEMO_SUBJECTS, FALLBACK_EXAM_TYPES } from "../../components/admin/paper-builder/demoData";
import { uid } from "../../components/admin/paper-builder/helpers";
import { StepperHeader } from "../../components/admin/paper-builder/StepperHeader";
import { StepSetup } from "../../components/admin/paper-builder/StepSetup";
import { StepAddQuestions } from "../../components/admin/paper-builder/StepAddQuestions";
import { StepReview } from "../../components/admin/paper-builder/StepReview";

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PaperBuilder() {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paper metadata
  const [meta, setMeta] = useState<PaperMeta>({
    title: "MPSC Mock Test 2026", subtitle: "General Studies — Paper I",
    examName: "MPSC", date: today, duration: 60, marksPerQ: 1, negMarks: 0.25,
  });
  const setM = <K extends keyof PaperMeta>(k: K, v: PaperMeta[K]) => setMeta(p => ({ ...p, [k]: v }));

  // Selected questions
  const [selected, setSelected] = useState<Question[]>([]);
  const [groupBySubject, setGroupBySubject] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Add-questions tab
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");

  // Smart fill
  const [smartExam, setSmartExam] = useState("MPSC");
  const [smartTotalQ, setSmartTotalQ] = useState(100);
  const [slots, setSlots] = useState<SmartSlot[]>([
    { _key: uid(), subjectId: "", subjectName: "", count: 20, easyPct: 30, medPct: 50, hardPct: 20, usagePref: "fresh" },
  ]);

  // Manual filters
  const [bankF, setBankF] = useState<BankFilters>({
    search: "", examType: "", subjectId: "", difficulty: "", type: "",
    isPyq: false, pyqYear: "", usageMin: "", usageMax: "", sortBy: "createdAt", page: 1,
  });
  const setBF = <K extends keyof BankFilters>(k: K, v: BankFilters[K]) =>
    setBankF(p => ({ ...p, [k]: v, ...(k !== "page" ? { page: 1 } : {}) }));

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── API Queries ───────────────────────────────────────────────────────────────
  const { data: subjectsRaw } = useQuery({
    queryKey: ["pb-subjects"],
    queryFn: () => api.get<Subject[] | { data: Subject[] }>("/subjects"),
    staleTime: 300_000,
    enabled: !DEMO_MODE,
  });
  const subjects: Subject[] = DEMO_MODE ? DEMO_SUBJECTS
    : Array.isArray(subjectsRaw) ? subjectsRaw : (subjectsRaw as any)?.data ?? [];

  const { data: examsRaw } = useQuery({
    queryKey: ["exams"],
    queryFn:  () => api.get<any>("/admin/exams"),
    staleTime: 600_000,
    enabled:  !DEMO_MODE,
  });
  const examTypes: string[] = DEMO_MODE
    ? FALLBACK_EXAM_TYPES
    : ((examsRaw as any)?.data ?? examsRaw ?? [])
        .filter((e: any) => e.isActive)
        .map((e: any) => String(e.code));
  const resolvedExamTypes = examTypes.length > 0 ? examTypes : FALLBACK_EXAM_TYPES;

  // Note: uses `raw: true` because the bank list is paginated (`meta.pages`),
  // and the generic api.get() unwrap discards that pagination metadata.
  const { data: bankRaw, isLoading: bankLoading } = useQuery({
    queryKey: ["pb-bank", bankF],
    queryFn: async () => {
      const res = await api.get<Response>("/questions", {
        raw: true,
        params: {
          status: "approved",
          search: bankF.search || undefined,
          examType: bankF.examType || undefined,
          subjectId: bankF.subjectId || undefined,
          difficulty: bankF.difficulty || undefined,
          type: bankF.type || undefined,
          isPyq: bankF.isPyq || undefined,
          pyqYear: bankF.pyqYear || undefined,
          usageMin: bankF.usageMin || undefined,
          usageMax: bankF.usageMax || undefined,
          sortBy: bankF.sortBy || undefined,
          page: bankF.page,
          limit: 15,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load questions");
      return json as { data: Question[]; meta?: { pages: number } };
    },
    enabled: !DEMO_MODE && activeTab === "manual",
  });

  const bankQuestions: Question[] = DEMO_MODE
    ? DEMO_QS.filter(q =>
        (!bankF.search || q.textEn.toLowerCase().includes(bankF.search.toLowerCase())) &&
        (!bankF.difficulty || q.difficulty === bankF.difficulty) &&
        (!bankF.subjectId || (subjects.find(s => s.id === bankF.subjectId)?.nameEn === q.subject?.nameEn)) &&
        (!bankF.isPyq || !!q.pyqYear)
      )
    : bankRaw?.data ?? [];
  const bankPages: number = DEMO_MODE ? 1 : bankRaw?.meta?.pages ?? 1;

  // Auto-fill mutation
  const autoFill = useMutation({
    mutationFn: (body: any) => api.post<{ questions?: Question[]; data?: Question[] }>("/admin/tests/auto-build", body),
    onSuccess: (res) => {
      const qs: Question[] = (res as any)?.questions ?? (res as any)?.data ?? [];
      if (qs.length === 0) { toast.error("No matching questions found in the bank."); return; }
      const existing = new Set(selected.map(q => q.id));
      const fresh = qs.filter(q => !existing.has(q.id)).map(q => ({ ...q, marks: meta.marksPerQ }));
      setSelected(prev => [...prev, ...fresh]);
      toast.success(`Added ${fresh.length} questions to the paper!`);
    },
    onError: () => toast.error("Auto-fill failed. Check your slot configuration."),
  });

  // Records usage on the questions in a paper once it's actually printed (not just previewed),
  // so future "Fresh / Mixed / Any" auto-fill knows these were already used.
  const markUsed = useMutation({
    mutationFn: (body: { questionIds: string[]; label?: string }) => api.post("/questions/mark-used", body),
  });

  // ── Computed ──────────────────────────────────────────────────────────────────
  const selectedIds = useMemo(() => new Set(selected.map(q => q.id)), [selected]);
  const totalMarks = useMemo(() => selected.reduce((s, q) => s + (q.marks ?? meta.marksPerQ), 0), [selected, meta.marksPerQ]);
  const slotsTotal = slots.reduce((s, r) => s + r.count, 0);
  const slotGap = smartTotalQ - slotsTotal;

  const subjectDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    selected.forEach(q => { const s = q.subject?.nameEn ?? "Unknown"; map[s] = (map[s] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [selected]);

  // Grouped view
  const groupedSelected = useMemo(() => {
    if (!groupBySubject) return null;
    const map: Record<string, Question[]> = {};
    selected.forEach(q => { const s = q.subject?.nameEn ?? "Other"; if (!map[s]) map[s] = []; map[s].push(q); });
    return map;
  }, [selected, groupBySubject]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const addQuestion = (q: Question) => {
    if (selectedIds.has(q.id)) return;
    setSelected(prev => [...prev, { ...q, marks: meta.marksPerQ }]);
  };

  const removeQuestion = (id: string) => setSelected(prev => prev.filter(q => q.id !== id));

  const moveUp = (idx: number) => setSelected(prev => {
    if (idx === 0) return prev;
    const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n;
  });

  const moveDown = (idx: number) => setSelected(prev => {
    if (idx === prev.length - 1) return prev;
    const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n;
  });

  const shuffle = () => setSelected(prev => {
    const n = [...prev];
    for (let i = n.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [n[i], n[j]] = [n[j], n[i]]; }
    return n;
  });

  const setAllMarks = (m: number) => setSelected(prev => prev.map(q => ({ ...q, marks: m })));
  const updateMarks = (idx: number, v: number) => setSelected(prev => prev.map((s, i) => i === idx ? { ...s, marks: v } : s));

  const onMarksPerQChange = (v: number) => { setM("marksPerQ", v); setAllMarks(v); };

  const addSlot = () => setSlots(prev => [
    ...prev, { _key: uid(), subjectId: "", subjectName: "", count: 10, easyPct: 30, medPct: 50, hardPct: 20, usagePref: "fresh" },
  ]);
  const removeSlot = (key: string) => setSlots(prev => prev.filter(s => s._key !== key));
  const updateSlot = (key: string, patch: Partial<SmartSlot>) =>
    setSlots(prev => prev.map(s => s._key === key ? { ...s, ...patch } : s));

  const autoDistribute = () => {
    if (slots.length === 0) return;
    const perSlot = Math.floor(smartTotalQ / slots.length);
    const rem = smartTotalQ % slots.length;
    setSlots(prev => prev.map((s, i) => ({ ...s, count: perSlot + (i === 0 ? rem : 0) })));
  };

  const usageDistFor = (pref: SmartSlot["usagePref"]) =>
    pref === "fresh"  ? { unused: 70, usedOnce: 20, usedMultiple: 10 } :
    pref === "mixed"  ? { unused: 50, usedOnce: 30, usedMultiple: 20 } :
                         { unused: 30, usedOnce: 40, usedMultiple: 30 };

  const handleAutoFill = () => {
    if (DEMO_MODE) {
      const available = DEMO_QS.filter(q => !selectedIds.has(q.id)).slice(0, 5);
      setSelected(prev => [...prev, ...available.map(q => ({ ...q, marks: meta.marksPerQ }))]);
      toast.success(`Added ${available.length} demo questions!`);
      return;
    }
    autoFill.mutate({
      examType: smartExam || undefined,
      totalQuestions: smartTotalQ,
      subjectSlots: slots.filter(s => s.subjectId).map(s => ({
        subjectId: s.subjectId, count: s.count,
        difficultyDistribution: { easy: s.easyPct, medium: s.medPct, hard: s.hardPct },
        usageDistribution: usageDistFor(s.usagePref),
      })),
      excludeQuestionIds: selected.map(q => q.id),
    });
  };

  // Reset any expanded bank-question card whenever the filters change (not just the page).
  const setBFAndCollapse = <K extends keyof BankFilters>(k: K, v: BankFilters[K]) => {
    setBF(k, v);
    if (k !== "page") setExpandedId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-116px)] gap-0 overflow-hidden">
      <StepperHeader step={step} onStepChange={setStep} selectedCount={selected.length} totalMarks={totalMarks} />

      <div className="flex-1 flex flex-col bg-white border border-primary-100 rounded-2xl shadow-sm overflow-hidden m-3 mt-3 min-h-0">
        {step === 1 && (
          <StepSetup meta={meta} setM={setM} onMarksPerQChange={onMarksPerQChange} onNext={() => setStep(2)} />
        )}

        {step === 2 && (
          <StepAddQuestions
            activeTab={activeTab} setActiveTab={setActiveTab}
            subjects={subjects} resolvedExamTypes={resolvedExamTypes}
            smartExam={smartExam} setSmartExam={setSmartExam}
            smartTotalQ={smartTotalQ} setSmartTotalQ={setSmartTotalQ}
            slots={slots} addSlot={addSlot} removeSlot={removeSlot} updateSlot={updateSlot}
            autoDistribute={autoDistribute} slotsTotal={slotsTotal} slotGap={slotGap}
            onAutoFill={handleAutoFill} autoFillPending={autoFill.isPending}
            bankF={bankF} setBF={setBFAndCollapse}
            bankQuestions={bankQuestions} bankLoading={bankLoading && !DEMO_MODE} bankPages={bankPages}
            selectedIds={selectedIds} expandedId={expandedId} setExpandedId={setExpandedId} onAdd={addQuestion}
            selectedCount={selected.length} totalMarks={totalMarks} onReview={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepReview
            selected={selected} groupBySubject={groupBySubject} setGroupBySubject={setGroupBySubject}
            shuffle={shuffle} onClear={() => setSelected([])}
            moveUp={moveUp} moveDown={moveDown} removeQuestion={removeQuestion} updateMarks={updateMarks}
            groupedSelected={groupedSelected} subjectDistribution={subjectDistribution} totalMarks={totalMarks}
            onAddMore={() => setStep(2)} onPrint={() => setShowPrintModal(true)}
          />
        )}
      </div>

      {/* ── Print Modal ──────────────────────────────────────────────────────── */}
      {showPrintModal && (
        <QuestionPaperModal
          questions={selected}
          onClose={() => setShowPrintModal(false)}
          onPrinted={() => {
            if (DEMO_MODE) return;
            markUsed.mutate({ questionIds: selected.map(q => q.id), label: meta.title });
          }}
        />
      )}
    </div>
  );
}
