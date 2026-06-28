import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import QuestionImageUpload from "./QuestionImageUpload";
import RichTextEditor from "../common/RichTextEditor";
import { DEMO_MODE } from "@/lib/demoMode";
import { QUESTION_TYPES } from "./paper-builder/demoData";

// ── Types ─────────────────────────────────────────────────────────────────────
export type QType =
  | "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "ASSERTION_REASON"
  | "FILL_IN_BLANK" | "NUMERICAL" | "MATCH_THE_FOLLOWING" | "COMPREHENSION";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Option {
  id:        string;
  textEn:    string;
  textMr:    string;
  imageUrl?: string;
  isCorrect: boolean;
}

// Minimal shape the form needs from an existing question (edit/clone source).
// The full Question type in QuestionBank.tsx is a structural superset of this.
export interface QuestionLike {
  id?:              string;
  textEn?:          string;
  textMr?:          string;
  type?:            QType;
  difficulty?:      Difficulty;
  explanationEn?:   string;
  explanationMr?:   string;
  referenceSource?: string;
  subtopic?:        string;
  pyqYear?:         number;
  pyqExam?:         string;
  numericalAnswer?: number;
  tags?:            string[];
  marks?:           number;
  negativeMarks?:   number;
  subjectId?:       string;
  chapterId?:       string;
  topicId?:         string;
  options?:         Option[];
  images?:          any[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export const OPTION_COUNT: Record<QType, number> = {
  MCQ: 4, MULTI_SELECT: 6, TRUE_FALSE: 2, ASSERTION_REASON: 4,
  FILL_IN_BLANK: 4, NUMERICAL: 0, MATCH_THE_FOLLOWING: 4, COMPREHENSION: 4,
};

// ── Add/Edit Question Modal ────────────────────────────────────────────────────
export function QuestionFormModal({ editQuestion, prefillData, examType, onClose, onSaved }: {
  editQuestion?: QuestionLike;
  prefillData?:  QuestionLike; // for clone — fills form but treats as new question
  examType: string;
  onClose: () => void;
  onSaved: (created?: any) => void;
}) {
  const source = editQuestion ?? prefillData;
  const qc = useQueryClient();
  const isEdit = !!editQuestion;
  const isClone = !!prefillData && !editQuestion;

  const [form, setForm] = useState({
    textEn:           source?.textEn          ?? "",
    textMr:           source?.textMr          ?? "",
    type:             (source?.type          ?? "MCQ") as QType,
    difficulty:       (source?.difficulty    ?? "medium") as Difficulty,
    explanationEn:    source?.explanationEn   ?? "",
    explanationMr:    source?.explanationMr   ?? "",
    referenceSource:  source?.referenceSource ?? "",
    subtopic:         source?.subtopic        ?? "",
    pyqYear:          String(source?.pyqYear  ?? ""),
    pyqExam:          source?.pyqExam         ?? "",
    numericalAnswer:  String(source?.numericalAnswer ?? ""),
    tags:             (source?.tags ?? []).join(", "),
    marks:            String(source?.marks           ?? 1),
    negativeMarks:    String(source?.negativeMarks   ?? 0.25),
    subjectId:        source?.subjectId  ?? "",
    chapterId:        source?.chapterId  ?? "",
    topicId:          source?.topicId    ?? "",
  });

  const [options, setOptions] = useState<Option[]>(() => {
    if (source?.options?.length) return source.options;
    const n = OPTION_COUNT[form.type] || 4;
    return Array.from({ length: n }, (_, i) => ({
      id: OPTION_LABELS[i], textEn: "", textMr: "", isCorrect: false,
    }));
  });

  // ── Subject / Chapter / Topic cascade queries ──────────────────────────────
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<any>("/subjects"),
    enabled: !DEMO_MODE,
  });
  const subjects: any[] = Array.isArray(subjectsData) ? subjectsData : [];

  const { data: chaptersData } = useQuery({
    queryKey: ["chapters", form.subjectId],
    queryFn: () => api.get<any>(`/subjects/${form.subjectId}/chapters`),
    enabled: !DEMO_MODE && !!form.subjectId,
  });
  const chapters: any[] = Array.isArray(chaptersData) ? chaptersData : [];

  const { data: topicsData } = useQuery({
    queryKey: ["topics", form.chapterId],
    queryFn: () => api.get<any>(`/subjects/chapters/${form.chapterId}/topics`),
    enabled: !DEMO_MODE && !!form.chapterId,
  });
  const topics: any[] = Array.isArray(topicsData) ? topicsData : [];

  // ── Pending images for new questions (uploaded after save) ─────────────────
  const [pendingQImages,   setPendingQImages]   = useState<File[]>([]);
  const [pendingOptImages, setPendingOptImages] = useState<{ optionIndex: number; file: File }[]>([]);
  const [pendingSolImages, setPendingSolImages] = useState<File[]>([]);

  const uploadDeferredImages = async (questionId: string) => {
    if (DEMO_MODE) return;
    const token = localStorage.getItem("accessToken");
    const upload = async (file: File, imageType: string, optionIndex?: number) => {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("imageType", imageType);
      if (optionIndex != null) fd.append("optionIndex", String(optionIndex));
      await fetch(`${import.meta.env.VITE_API_URL}/questions/${questionId}/images`, {
        method: "POST", body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    };
    const all = [
      ...pendingQImages.map(f  => upload(f, "QUESTION")),
      ...pendingOptImages.map(({ optionIndex, file }) => upload(file, "OPTION", optionIndex)),
      ...pendingSolImages.map(f => upload(f, "SOLUTION")),
    ];
    if (all.length > 0) await Promise.allSettled(all);
  };

  // ── Real-time duplicate detection (debounced 800ms) ─────────────────────
  const [duplicates, setDuplicates]   = useState<any[]>([]);
  const [showDupList, setShowDupList] = useState(false);
  const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTextChange = (value: string) => {
    setForm(f => ({ ...f, textEn: value }));
    if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
    const plain = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (plain.length < 20) { setDuplicates([]); return; }
    dupTimerRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams({ text: plain });
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/questions/duplicate-check?${params}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        const data = await res.json();
        setDuplicates(data?.data ?? []);
      } catch {}
    }, 800);
  };

  const updateType = (type: QType) => {
    setForm(f => ({ ...f, type }));
    const n = OPTION_COUNT[type] || 4;
    setOptions(Array.from({ length: n }, (_, i) => ({
      id: OPTION_LABELS[i], textEn: "", textMr: "", isCorrect: false,
    })));
  };

  const setOptionField = (i: number, field: keyof Option, value: any) => {
    setOptions(opts => opts.map((o, j) => j === i ? { ...o, [field]: value } : o));
  };

  const toggleCorrect = (i: number) => {
    if (form.type === "MCQ" || form.type === "TRUE_FALSE" || form.type === "FILL_IN_BLANK") {
      // Single correct — deselect all others
      setOptions(opts => opts.map((o, j) => ({ ...o, isCorrect: j === i })));
    } else {
      setOptionField(i, "isCorrect", !options[i].isCorrect);
    }
  };

  // Any type with options can grow up to 6, except TRUE_FALSE which is
  // inherently binary — admins decide option count for everything else.
  const canResizeOptions = form.type !== "TRUE_FALSE";

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions(opts => [...opts, { id: OPTION_LABELS[opts.length], textEn: "", textMr: "", isCorrect: false }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(opts => opts.filter((_, j) => j !== i));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        examType,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        pyqYear: form.pyqYear ? parseInt(form.pyqYear) : undefined,
        numericalAnswer: form.numericalAnswer ? parseFloat(form.numericalAnswer) : undefined,
        marks: parseFloat(form.marks) || 1,
        negativeMarks: parseFloat(form.negativeMarks) || 0,
        subjectId: form.subjectId || undefined,
        chapterId: form.chapterId || undefined,
        topicId: form.topicId || undefined,
        options: form.type === "NUMERICAL" ? [] : options,
      };
      return isEdit
        ? api.put(`/questions/${editQuestion!.id}`, payload)
        : api.post("/questions", payload);
    },
    onSuccess: async (response: any) => {
      // Upload any images that were attached before the question existed
      if (!isEdit) {
        const newId: string = response?.data?.id ?? response?.id ?? "";
        if (newId) await uploadDeferredImages(newId);
        const imgCount = pendingQImages.length + pendingOptImages.length + pendingSolImages.length;
        if (imgCount > 0 && !DEMO_MODE) toast.success(`${imgCount} image${imgCount > 1 ? "s" : ""} uploaded`);
      }
      toast.success(isEdit ? "Question updated" : "Question created");
      qc.invalidateQueries({ queryKey: ["questions"] });
      onSaved(response);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const showOptions = form.type !== "NUMERICAL";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? "Edit Question" : isClone ? "Clone Question (New Draft)" : "Add New Question"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">✕</button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
              <select className="input-field" value={form.type} onChange={e => updateType(e.target.value as QType)}>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
              <select className="input-field" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Marks / Negative Marks — admin-decided, not fixed defaults */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks *</label>
              <input
                type="number" step="0.01" min="0" className="input-field"
                value={form.marks}
                onChange={e => setForm(f => ({ ...f, marks: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
              <input
                type="number" step="0.01" min="0" className="input-field"
                value={form.negativeMarks}
                onChange={e => setForm(f => ({ ...f, negativeMarks: e.target.value }))}
              />
            </div>
          </div>

          {/* Subject / Chapter / Topic */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="input-field"
                value={form.subjectId}
                onChange={e => setForm(f => ({ ...f, subjectId: e.target.value, chapterId: "", topicId: "" }))}
              >
                <option value="">— Select subject —</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <select
                className="input-field"
                value={form.chapterId}
                disabled={!form.subjectId}
                onChange={e => setForm(f => ({ ...f, chapterId: e.target.value, topicId: "" }))}
              >
                <option value="">— Select chapter —</option>
                {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <select
                className="input-field"
                value={form.topicId}
                disabled={!form.chapterId}
                onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
              >
                <option value="">— Select topic —</option>
                {topics.map((t: any) => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
              </select>
            </div>
          </div>

          {/* Question text with duplicate detection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text (English) <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <RichTextEditor
              value={form.textEn}
              onChange={v => onTextChange(v)}
              placeholder="Enter question text in English (optional)…"
              minHeight="80px"
            />
            {/* Duplicate warning */}
            {duplicates.length > 0 && (
              <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-amber-800 font-semibold">
                    {duplicates.length} similar question{duplicates.length > 1 ? "s" : ""} found
                  </span>
                  <button onClick={() => setShowDupList(s => !s)} className="text-xs text-amber-700 underline ml-2">
                    {showDupList ? "Hide" : "View"}
                  </button>
                  {showDupList && (
                    <div className="mt-1 space-y-1">
                      {duplicates.slice(0,3).map((d: any) => (
                        <p key={d.duplicate_id} className="text-[10px] text-amber-700 truncate">
                          {(d.similarity * 100).toFixed(0)}% match — {d.textEn?.slice(0, 60)}…
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text (Marathi) *</label>
            <RichTextEditor
              value={form.textMr}
              onChange={v => setForm(f => ({ ...f, textMr: v }))}
              placeholder="मराठी प्रश्न लिहा… (आवश्यक)"
              minHeight="80px"
              className="font-marathi"
            />
          </div>

          {/* Question image — available in all modes */}
          <QuestionImageUpload
            questionId={editQuestion?.id}
            imageType="QUESTION"
            label="Question Image(s)"
            existingImages={editQuestion ? (editQuestion.images ?? []).filter((i: any) => i.imageType === "QUESTION") : []}
            onUpload={(file) => setPendingQImages(p => [...p, file])}
          />

          {/* Comprehension passage */}
          {form.type === "COMPREHENSION" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passage / Case Study (English)</label>
              <RichTextEditor
                value={(form as any).passageEn ?? ""}
                onChange={v => setForm(f => ({ ...f, passageEn: v } as any))}
                placeholder="Enter the shared passage or case study text…"
                minHeight="110px"
              />
            </div>
          )}

          {/* Numerical answer */}
          {form.type === "NUMERICAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Numerical Answer *</label>
              <input
                type="number"
                step="any"
                className="input-field"
                placeholder="e.g. 7.5"
                value={form.numericalAnswer}
                onChange={e => setForm(f => ({ ...f, numericalAnswer: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Student must enter this exact number (± tolerance)</p>
            </div>
          )}

          {/* Options A–F */}
          {showOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Options {form.type === "MULTI_SELECT" ? "(check all correct)" : "(select one correct)"}
                </label>
                {canResizeOptions && options.length < 6 && (
                  <button type="button" onClick={addOption} className="text-xs text-primary-600 font-semibold hover:underline">
                    + Add Option
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${opt.isCorrect ? "border-emerald-400 bg-emerald-50" : "border-gray-200"}`}>
                    {/* Correct toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCorrect(i)}
                      className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        opt.isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"
                      }`}
                    >
                      {opt.isCorrect && <span className="text-xs">✓</span>}
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {OPTION_LABELS[i]}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        className="input-field py-1.5 text-sm"
                        placeholder={`Option ${OPTION_LABELS[i]} (English)`}
                        value={opt.textEn}
                        onChange={e => setOptionField(i, "textEn", e.target.value)}
                      />
                      <input
                        className="input-field py-1.5 text-sm font-marathi"
                        placeholder={`पर्याय ${OPTION_LABELS[i]} (मराठी)`}
                        value={opt.textMr}
                        onChange={e => setOptionField(i, "textMr", e.target.value)}
                      />
                      <QuestionImageUpload
                        questionId={editQuestion?.id}
                        imageType="OPTION"
                        optionIndex={i}
                        label={`Option ${OPTION_LABELS[i]} image (optional)`}
                        existingImages={editQuestion ? (editQuestion.images ?? []).filter((img: any) => img.imageType === "OPTION" && img.optionIndex === i) : []}
                        onUpload={(file) => setPendingOptImages(p => [...p, { optionIndex: i, file }])}
                        className="mt-1"
                      />
                    </div>

                    {canResizeOptions && options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="mt-1 p-1 hover:bg-red-100 rounded text-red-500 flex-shrink-0">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (English)</label>
            <RichTextEditor
              value={form.explanationEn}
              onChange={v => setForm(f => ({ ...f, explanationEn: v }))}
              placeholder="Detailed explanation with reasoning…"
              minHeight="80px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Marathi)</label>
            <RichTextEditor
              value={form.explanationMr}
              onChange={v => setForm(f => ({ ...f, explanationMr: v }))}
              placeholder="मराठी स्पष्टीकरण…"
              minHeight="80px"
              className="font-marathi"
            />
          </div>
          <QuestionImageUpload
            questionId={editQuestion?.id}
            imageType="SOLUTION"
            label="Solution / Explanation Image (optional)"
            existingImages={editQuestion ? (editQuestion.images ?? []).filter((i: any) => i.imageType === "SOLUTION") : []}
            onUpload={(file) => setPendingSolImages(p => [...p, file])}
          />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Source</label>
              <input className="input-field" placeholder="Book name, page, URL…" value={form.referenceSource} onChange={e => setForm(f => ({ ...f, referenceSource: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="input-field" placeholder="history, mughal, akbar" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PYQ Year</label>
              <input type="number" className="input-field" placeholder="e.g. 2023" value={form.pyqYear} onChange={e => setForm(f => ({ ...f, pyqYear: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PYQ Exam Name</label>
              <input className="input-field" placeholder="e.g. Rajyaseva Pre 2023" value={form.pyqExam} onChange={e => setForm(f => ({ ...f, pyqExam: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !form.textMr.trim() || form.textMr === "<p></p>"}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {isPending ? "Saving…" : isEdit ? "Update Question" : isClone ? "Save Clone" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
