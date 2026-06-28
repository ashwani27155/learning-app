import { useState } from "react";

const SYLLABUS: Record<string, string[]> = {
  "History":        ["Ancient India", "Medieval India", "Modern India", "Maharashtra History", "Freedom Movement"],
  "Geography":      ["Physical Geography", "Indian Geography", "Maharashtra Geography", "Economic Geography"],
  "Polity":         ["Constitution Basics", "Fundamental Rights", "Parliament & Centre", "State Government", "Local Bodies"],
  "Economy":        ["Basic Economics", "Indian Economy", "Agriculture & Rural", "Budget & Finance"],
  "Science":        ["Physics Basics", "Chemistry Basics", "Biology & Health", "Environment & Ecology"],
  "Current Affairs":["National Events", "International Affairs", "Maharashtra Updates", "Awards & Sports"],
  "Marathi":        ["Marathi Grammar", "Literature & Poetry", "Comprehension"],
  "English":        ["English Grammar", "Vocabulary & Idioms", "Reading Comprehension"],
  "CSAT":           ["Logical Reasoning", "Quantitative Aptitude", "Data Interpretation"],
};

export interface StudyDay {
  date: string;       // ISO date string
  subject: string;
  topic: string;
  done: boolean;
}

function generatePlan(examDate: string, mode: "balanced" | "weak-first", weakSubjects: string[]): StudyDay[] {
  const topics: Array<{ subject: string; topic: string }> = [];

  if (mode === "weak-first" && weakSubjects.length > 0) {
    // Put weak subjects' topics first, then rest
    const weakSet = new Set(weakSubjects);
    Object.entries(SYLLABUS).forEach(([subj, tops]) => {
      if (weakSet.has(subj)) tops.forEach(t => topics.push({ subject: subj, topic: t }));
    });
    Object.entries(SYLLABUS).forEach(([subj, tops]) => {
      if (!weakSet.has(subj)) tops.forEach(t => topics.push({ subject: subj, topic: t }));
    });
  } else {
    // Interleave subjects for balanced coverage
    const allEntries = Object.entries(SYLLABUS);
    const maxLen = Math.max(...allEntries.map(([, t]) => t.length));
    for (let i = 0; i < maxLen; i++) {
      allEntries.forEach(([subj, tops]) => {
        if (tops[i]) topics.push({ subject: subj, topic: tops[i] });
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(examDate);
  end.setHours(0, 0, 0, 0);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - today.getTime()) / 86400000));

  const plan: StudyDay[] = [];
  for (let i = 0; i < totalDays && i < topics.length; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    plan.push({
      date:    d.toISOString().split("T")[0],
      subject: topics[i % topics.length].subject,
      topic:   topics[i % topics.length].topic,
      done:    false,
    });
  }
  return plan;
}

interface Props {
  examDate: string;
  userId: string;
  weakSubjects?: string[];
  onClose: () => void;
  onGenerated: () => void;
}

export default function StudyPlanModal({ examDate, userId, weakSubjects = [], onClose, onGenerated }: Props) {
  const [mode, setMode] = useState<"balanced" | "weak-first">("balanced");
  const [preview, setPreview] = useState<StudyDay[] | null>(null);

  const handleGenerate = () => {
    const plan = generatePlan(examDate, mode, weakSubjects);
    setPreview(plan);
  };

  const handleSave = () => {
    if (!preview) return;
    localStorage.setItem(`studyPlan_${userId}`, JSON.stringify(preview));
    onGenerated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">📅 Generate Study Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Day-by-day MPSC syllabus coverage until your exam</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Study Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "balanced",   label: "Balanced",    desc: "Covers all subjects equally, rotating daily" },
                { key: "weak-first", label: "Weak First",  desc: "Prioritises your weaker subjects first" },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    mode === opt.key
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-semibold ${mode === opt.key ? "text-primary-700" : "text-gray-800"}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {!preview ? (
            <button onClick={handleGenerate} className="w-full btn-primary py-3">
              Preview Plan →
            </button>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Preview — first 7 days of {preview.length} days
                </p>
                <div className="space-y-1.5">
                  {preview.slice(0, 7).map((day, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                        {new Date(day.date).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{day.topic}</p>
                        <p className="text-[10px] text-gray-400">{day.subject}</p>
                      </div>
                      <span className="text-[10px] text-gray-300">
                        {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                    </div>
                  ))}
                  {preview.length > 7 && (
                    <p className="text-xs text-center text-gray-400 py-1">… and {preview.length - 7} more days</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPreview(null)} className="flex-1 btn-ghost border border-gray-200">
                  Regenerate
                </button>
                <button onClick={handleSave} className="flex-1 btn-primary">
                  Save Plan ✓
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function getTodaysPlan(userId: string): StudyDay | null {
  const stored = localStorage.getItem(`studyPlan_${userId}`);
  if (!stored) return null;
  const plan: StudyDay[] = JSON.parse(stored);
  const today = new Date().toISOString().split("T")[0];
  return plan.find(d => d.date === today) ?? null;
}

export function markTodayDone(userId: string): void {
  const stored = localStorage.getItem(`studyPlan_${userId}`);
  if (!stored) return;
  const plan: StudyDay[] = JSON.parse(stored);
  const today = new Date().toISOString().split("T")[0];
  const updated = plan.map(d => d.date === today ? { ...d, done: true } : d);
  localStorage.setItem(`studyPlan_${userId}`, JSON.stringify(updated));
}

export function getPlanProgress(userId: string): { done: number; total: number } {
  const stored = localStorage.getItem(`studyPlan_${userId}`);
  if (!stored) return { done: 0, total: 0 };
  const plan: StudyDay[] = JSON.parse(stored);
  return { done: plan.filter(d => d.done).length, total: plan.length };
}
