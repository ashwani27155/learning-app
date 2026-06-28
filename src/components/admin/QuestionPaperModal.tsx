import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ChevronLeft, FileText } from "lucide-react";

// ── Types (mirrored from QuestionBank) ────────────────────────────────────────
interface Option {
  id:        string;
  textEn:    string;
  textMr:    string;
  isCorrect: boolean;
}

interface Question {
  id:            string;
  textEn:        string;
  textMr:        string;
  type:          string;
  difficulty:    string;
  subject?:      { nameEn: string };
  options:       Option[];
  marks?:        number;
  negativeMarks?: number;
  pyqYear?:      number;
  pyqExam?:      string;
  explanationEn?: string;
}

interface PaperConfig {
  title:       string;
  subtitle:    string;
  examName:    string;
  date:        string;
  duration:    number;
  instructions: string;
  watermark:   string;
  wmOpacity:   "light" | "medium" | "dark";
  language:    "en" | "mr" | "both";
  showAnswerKey: boolean;
  showMarks:   boolean;
  showDifficulty: boolean;
  showSubject: boolean;
  numbering:   "1" | "Q1" | "01";
}

const DEFAULT_INSTRUCTIONS = `1. Read each question carefully before answering.
2. Each correct answer carries marks as indicated.
3. Negative marking applies where mentioned.
4. All questions are compulsory.
5. Use blue or black ballpoint pen only.`;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const WM_OPACITY_MAP = {
  light:  "rgba(88,28,135,0.06)",
  medium: "rgba(88,28,135,0.10)",
  dark:   "rgba(88,28,135,0.16)",
};

function formatNum(n: number): string {
  const s = String(n);
  if (s.length === 1) return `0${s}`;
  return s;
}

function getLabel(q: Question, idx: number, style: PaperConfig["numbering"]): string {
  if (style === "Q1") return `Q${idx + 1}.`;
  if (style === "01") return `${formatNum(idx + 1)}.`;
  return `${idx + 1}.`;
}

// One complete language block for a question — the statement (with line
// breaks preserved, so multi-line sub-statements like अ./ब./क. or a./b./c.
// stay on their own lines) followed by that same language's full option
// grid. In "both" mode two of these stack vertically (Marathi block, then
// the English block right after) — matching how real MPSC papers print a
// full Marathi question followed by its full English translation, rather
// than interleaving the two languages line-by-line.
function LangBlock({ text, options, lang, secondary }: {
  text: string; options: Option[]; lang: "mr" | "en"; secondary?: boolean;
}) {
  const optionText = (opt: Option) => lang === "mr" ? (opt.textMr || opt.textEn) : (opt.textEn || opt.textMr);
  return (
    <div
      className={lang === "mr" ? "qp-mr" : undefined}
      style={{
        fontStyle: secondary ? "italic" : "normal",
        color: secondary ? "#444" : "#000",
        fontWeight: secondary ? 400 : 500,
      }}
    >
      <div style={{ whiteSpace: "pre-line" }}>{text}</div>
      {options.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px",
          marginTop: "5px", fontSize: "10.5pt", fontStyle: "normal",
        }}>
          {options.map((opt, oi) => (
            <div key={opt.id} style={{ display: "flex", gap: "6px" }}>
              <span style={{ fontWeight: 600, minWidth: "20px", color: "#000" }}>({OPTION_LABELS[oi]})</span>
              <span className={lang === "mr" ? "qp-mr" : undefined} style={{ color: secondary ? "#444" : "#000" }}>
                {optionText(opt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Paper Preview ──────────────────────────────────────────────────────────────
// `rootId` defaults to the id the print stylesheet targets (#qp-paper-root).
// The on-screen copy inside the modal uses a different id (see below) so the
// two simultaneous renders — one for live preview, one portaled for print —
// don't collide as duplicate DOM ids.
function PaperPreview({ questions, config, rootId = "qp-paper-root" }: { questions: Question[]; config: PaperConfig; rootId?: string }) {
  const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 1), 0);
  const wmColor = WM_OPACITY_MAP[config.wmOpacity];

  const correctLabel = (q: Question): string => {
    const sorted = [...q.options].sort((a, b) => {
      const ai = q.options.indexOf(a);
      const bi = q.options.indexOf(b);
      return ai - bi;
    });
    const correct = sorted
      .map((o, i) => (o.isCorrect ? OPTION_LABELS[i] : null))
      .filter(Boolean);
    return correct.join(", ") || "—";
  };

  return (
    <div id={rootId} className="qp-paper bg-white" style={{ fontFamily: "'Times New Roman', serif", fontSize: "12pt", color: "#000" }}>

      {/* Diagonal watermark — visible on screen AND in print */}
      <div
        className={`qp-watermark qp-wm-${config.wmOpacity}`}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          fontSize: "72pt",
          fontWeight: 900,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 9999,
          letterSpacing: "0.15em",
          color: wmColor,
          userSelect: "none",
        }}
      >
        {config.watermark || "MPSC Sadhak"}
      </div>

      <div className="qp-paper-inner" style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 40px" }}>

        {/* ── Header ── */}
        <div style={{ borderBottom: "3px double #000", paddingBottom: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "8px",
                background: "#7c3aed", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22pt", fontWeight: 900,
              }}>M</div>
              <div>
                <div style={{ fontSize: "16pt", fontWeight: 700 }}>MPSC Sadhak</div>
                <div style={{ fontSize: "9pt", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {config.examName} Exam Preparation Platform
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "9pt", color: "#444" }}>
              <div>Date: {config.date}</div>
              <div>Duration: {config.duration} min</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <div style={{ fontSize: "17pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {config.title}
            </div>
            {config.subtitle && (
              <div style={{ fontSize: "11pt", color: "#333", marginTop: "3px" }}>{config.subtitle}</div>
            )}
          </div>
        </div>

        {/* ── Meta strip ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "10pt", border: "1px solid #ccc",
          padding: "6px 14px", borderRadius: "4px",
          background: "#f9f9f9", marginBottom: "14px",
        }}>
          <span><strong>Total Questions:</strong> {questions.length}</span>
          <span><strong>Total Marks:</strong> {totalMarks}</span>
          <span><strong>Exam:</strong> {config.examName}</span>
          <span><strong>Duration:</strong> {config.duration} minutes</span>
        </div>

        {/* ── Instructions ── */}
        <div style={{
          border: "1px solid #888", borderRadius: "4px",
          padding: "10px 16px", marginBottom: "20px",
          background: "#fffdf5",
        }}>
          <div style={{ fontWeight: 700, fontSize: "11pt", marginBottom: "6px", textDecoration: "underline" }}>
            GENERAL INSTRUCTIONS:
          </div>
          <div style={{ fontSize: "10pt", lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {config.instructions}
          </div>
        </div>

        {/* ── Questions ── */}
        <div>
          {questions.map((q, idx) => {
            const label = getLabel(q, idx, config.numbering);
            const sortedOpts = [...q.options].sort((a, b) => {
              return q.options.indexOf(a) - q.options.indexOf(b);
            });

            return (
              <div
                key={q.id}
                className="qp-question"
                style={{ marginBottom: "20px", breakInside: "avoid", pageBreakInside: "avoid" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <span style={{ fontWeight: 700, minWidth: "28px", flexShrink: 0 }}>{label}</span>

                  <div style={{ flex: 1 }}>
                    {/* Complete Marathi block (statement + its own options) — primary */}
                    {(config.language === "mr" || config.language === "both") && q.textMr && (
                      <LangBlock text={q.textMr} options={sortedOpts} lang="mr" />
                    )}
                    {/* Complete English block — secondary in "both" mode, or primary
                        on its own / as a fallback when a question has no Marathi text */}
                    {(config.language === "en" || config.language === "both" || (config.language === "mr" && !q.textMr)) && q.textEn && (
                      <div style={{ marginTop: config.language === "both" && q.textMr ? "10px" : "0" }}>
                        <LangBlock text={q.textEn} options={sortedOpts} lang="en" secondary={config.language === "both"} />
                      </div>
                    )}
                  </div>

                  {/* Right badges */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0, fontSize: "9pt", marginLeft: "8px" }}>
                    {config.showMarks && (
                      <span style={{ border: "1px solid #888", borderRadius: "3px", padding: "1px 6px" }}>
                        [{q.marks ?? 1} mark{(q.marks ?? 1) !== 1 ? "s" : ""}]
                      </span>
                    )}
                    {config.showDifficulty && (
                      <span style={{ border: "1px solid #bbb", borderRadius: "3px", padding: "1px 6px", color: "#555" }}>
                        {q.difficulty}
                      </span>
                    )}
                    {config.showSubject && q.subject && (
                      <span style={{ border: "1px solid #bbb", borderRadius: "3px", padding: "1px 6px", color: "#555" }}>
                        {q.subject.nameEn}
                      </span>
                    )}
                    {q.pyqYear && (
                      <span style={{ border: "1px solid #aab", borderRadius: "3px", padding: "1px 6px", color: "#446", fontSize: "8pt" }}>
                        PYQ {q.pyqYear}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Answer Key ── */}
        {config.showAnswerKey && (
          <div className="qp-answer-key" style={{ marginTop: "32px", pageBreakBefore: "always" }}>
            <div style={{
              borderTop: "3px double #000", paddingTop: "16px",
              marginTop: "16px",
            }}>
              <div style={{ fontWeight: 700, fontSize: "13pt", textAlign: "center", marginBottom: "14px", textDecoration: "underline" }}>
                ANSWER KEY — {config.title}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "8px 12px",
                fontSize: "10.5pt",
              }}>
                {questions.map((q, idx) => (
                  <div key={q.id} style={{
                    border: "1px solid #ccc", borderRadius: "3px",
                    padding: "4px 8px", textAlign: "center",
                  }}>
                    <span style={{ fontWeight: 600 }}>{idx + 1}.</span>{" "}
                    <span style={{ color: "#1a5c2e", fontWeight: 700 }}>{correctLabel(q)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: "32px", borderTop: "1px solid #ccc",
              paddingTop: "8px", fontSize: "8pt", color: "#888",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>Generated by MPSC Sadhak — {config.examName} Platform</span>
              <span>{config.date}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
interface Props {
  questions: Question[];
  onClose:   () => void;
  onPrinted?: () => void;
}

export default function QuestionPaperModal({ questions, onClose, onPrinted }: Props) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const [step, setStep] = useState<"config" | "preview">("config");
  const [config, setConfig] = useState<PaperConfig>({
    title:        "MPSC Mock Test",
    subtitle:     "General Studies — Paper I",
    examName:     "MPSC",
    date:         today,
    duration:     60,
    instructions: DEFAULT_INSTRUCTIONS,
    watermark:    "MPSC Sadhak",
    wmOpacity:    "medium",
    language:     "both",
    showAnswerKey: true,
    showMarks:    true,
    showDifficulty: false,
    showSubject:  false,
    numbering:    "1",
  });

  const set = <K extends keyof PaperConfig>(k: K, v: PaperConfig[K]) =>
    setConfig(prev => ({ ...prev, [k]: v }));

  const handlePrint = () => {
    onPrinted?.();
    document.body.classList.add("qp-printing");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("qp-printing"), 500);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === "preview" && (
              <button onClick={() => setStep("config")}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <FileText className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-bold text-gray-900">
                {step === "config" ? "Configure Question Paper" : "Preview Question Paper"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {questions.length} question{questions.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── STEP 1: Config ── */}
        {step === "config" && (
          <>
            <div className="p-6 overflow-y-auto flex-1 max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Paper Title *</label>
                    <input className="input-field" value={config.title}
                      onChange={e => set("title", e.target.value)}
                      placeholder="e.g. MPSC Rajyaseva Mock Test 2026" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                    <input className="input-field" value={config.subtitle}
                      onChange={e => set("subtitle", e.target.value)}
                      placeholder="e.g. General Studies — Paper I" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Exam / Board</label>
                      <input className="input-field" value={config.examName}
                        onChange={e => set("examName", e.target.value)}
                        placeholder="MPSC" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                      <input className="input-field" value={config.date}
                        onChange={e => set("date", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (minutes)</label>
                    <input type="number" className="input-field" value={config.duration}
                      onChange={e => set("duration", parseInt(e.target.value) || 60)} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Instructions</label>
                    <textarea rows={6} className="input-field resize-none font-mono text-xs" value={config.instructions}
                      onChange={e => set("instructions", e.target.value)} />
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Watermark Text</label>
                    <input className="input-field" value={config.watermark}
                      onChange={e => set("watermark", e.target.value)}
                      placeholder="MPSC Sadhak" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Watermark Opacity</label>
                    <div className="flex gap-2">
                      {(["light","medium","dark"] as const).map(op => (
                        <button key={op}
                          onClick={() => set("wmOpacity", op)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                            config.wmOpacity === op
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-gray-200 text-gray-600 hover:border-primary-300"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                    <div className="flex gap-2">
                      {([["mr","Marathi"],["en","English"],["both","Both"]] as const).map(([val, label]) => (
                        <button key={val}
                          onClick={() => set("language", val)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            config.language === val
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-gray-200 text-gray-600 hover:border-primary-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Question Numbering</label>
                    <div className="flex gap-2">
                      {([["1","1. 2. 3."],["Q1","Q1. Q2."],["01","01. 02."]] as const).map(([val, label]) => (
                        <button key={val}
                          onClick={() => set("numbering", val)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            config.numbering === val
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-gray-200 text-gray-600 hover:border-primary-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display Options</p>
                    {([
                      ["showAnswerKey", "Include Answer Key (last page)"],
                      ["showMarks",     "Show marks per question"],
                      ["showDifficulty","Show difficulty badge"],
                      ["showSubject",   "Show subject tag"],
                    ] as [keyof PaperConfig, string][]).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox"
                          checked={config[key] as boolean}
                          onChange={e => set(key, e.target.checked as any)}
                          className="w-4 h-4 rounded accent-primary-600" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Summary card */}
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl text-sm">
                    <p className="font-semibold text-primary-800 mb-2">Paper Summary</p>
                    <div className="space-y-1 text-primary-700 text-xs">
                      <div>{questions.length} questions · {questions.reduce((s,q)=>s+(q.marks??1),0)} total marks</div>
                      <div>Language: {config.language === "both" ? "Marathi + English" : config.language === "en" ? "English only" : "Marathi only"}</div>
                      <div>Watermark: "{config.watermark}" ({config.wmOpacity} opacity)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button onClick={onClose} className="btn-ghost border border-gray-200 px-5">Cancel</button>
              <button
                onClick={() => setStep("preview")}
                disabled={!config.title.trim()}
                className="btn-primary px-6 disabled:opacity-50"
              >
                Preview Paper →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && (
          <>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 qp-no-print">
              <div className="bg-white shadow-md rounded-lg overflow-hidden mx-auto" style={{ maxWidth: "820px" }}>
                <PaperPreview questions={questions} config={config} rootId="qp-paper-preview-onscreen" />
              </div>
            </div>

            {/* Print target — portaled directly onto <body> so it's a true
                sibling of the app root, not buried inside this modal's own
                div tree. The print stylesheet hides everything else under
                <body> and shows only #qp-paper-root; that only works if
                #qp-paper-root is itself a direct child of <body>. */}
            {createPortal(<PaperPreview questions={questions} config={config} />, document.body)}

            <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 qp-no-print">
              <p className="text-xs text-gray-400">
                Tip: In the print dialog, select "Save as PDF" to download. Set margins to "None" or "Minimum" for best results.
              </p>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all">
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
