import type { Question } from "./types";

export function uid() { return Math.random().toString(36).slice(2); }

export function DiffBadge({ d }: { d: string }) {
  const c: Record<string, string> = {
    easy: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700", expert: "bg-purple-100 text-purple-700",
  };
  return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${c[d] ?? "bg-gray-100 text-gray-500"}`}>{d}</span>;
}

export function UsageBadge({ count }: { count?: number }) {
  if (count === undefined) return null;
  const c = count === 0 ? "bg-emerald-50 text-emerald-600" : count <= 3 ? "bg-primary-50 text-primary-600" : "bg-orange-50 text-orange-600";
  const label = count === 0 ? "Fresh" : `${count}×`;
  return <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${c}`}>{label}</span>;
}

// Quality bar for difficulty distribution
export function DiffDistBar({ questions }: { questions: Question[] }) {
  const n = questions.length;
  if (n === 0) return <p className="text-xs text-gray-400 text-center py-2">No questions selected</p>;
  const counts = { easy: 0, medium: 0, hard: 0, expert: 0 };
  questions.forEach(q => { if (q.difficulty in counts) (counts as any)[q.difficulty]++; });
  const bars: { k: string; pct: number; color: string }[] = [
    { k: "Easy", pct: Math.round((counts.easy / n) * 100), color: "bg-emerald-500" },
    { k: "Medium", pct: Math.round((counts.medium / n) * 100), color: "bg-amber-500" },
    { k: "Hard", pct: Math.round((counts.hard / n) * 100), color: "bg-red-500" },
    { k: "Expert", pct: Math.round((counts.expert / n) * 100), color: "bg-purple-600" },
  ];
  return (
    <div className="space-y-1.5">
      {bars.map(b => (
        <div key={b.k} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-12 text-right">{b.k}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${b.pct}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-gray-600 w-8">{b.pct}%</span>
        </div>
      ))}
    </div>
  );
}
