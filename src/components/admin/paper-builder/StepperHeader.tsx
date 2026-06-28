import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Paper Setup" },
  { n: 2, label: "Add Questions" },
  { n: 3, label: "Review & Print" },
] as const;

export function StepperHeader({
  step, onStepChange, selectedCount, totalMarks,
}: {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  selectedCount: number;
  totalMarks: number;
}) {
  return (
    <div className="bg-white border-b border-primary-100 px-4 py-2.5 flex items-center gap-4 flex-wrap flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5">
            <button
              onClick={() => onStepChange(s.n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                step === s.n
                  ? "bg-primary-600 text-white shadow-purple-sm"
                  : step > s.n
                  ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                step === s.n ? "bg-white/25" : step > s.n ? "bg-primary-200" : "bg-gray-200"
              }`}>
                {step > s.n ? <Check className="w-2.5 h-2.5" /> : s.n}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="text-gray-300 text-xs">→</span>}
          </div>
        ))}
      </div>

      {/* Persistent paper status — visible no matter which step you're on */}
      <div className={`ml-auto flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${
        selectedCount === 0 ? "bg-gray-50 text-gray-400 border-gray-200" : "bg-primary-50 text-primary-700 border-primary-200"
      }`}>
        {selectedCount} Q · {totalMarks} marks
      </div>
    </div>
  );
}
