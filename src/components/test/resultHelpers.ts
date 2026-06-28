import type { AttemptResult } from "../../services/testService";

export type FilterType = "all" | "correct" | "wrong" | "unattempted";
export type ResponseRow = AttemptResult["attempt"]["responses"][number];

export function diffBadge(diff?: string) {
  if (diff === "easy") return "badge-success";
  if (diff === "hard") return "badge-error";
  return "badge-warning";
}

export function formatSecs(s: number) {
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

export function getStatus(r: ResponseRow): "correct" | "wrong" | "unattempted" {
  if (r.isSkipped || r.selectedOptionIds.length === 0) return "unattempted";
  return r.isCorrect ? "correct" : "wrong";
}

export function computeSubjectResults(responses: AttemptResult["attempt"]["responses"]) {
  const map = new Map<string, { subjectId: string; correct: number; incorrect: number; skipped: number; score: number; total: number }>();
  for (const r of responses) {
    const subjectId = r.question.subject?.nameEn ?? "General";
    if (!map.has(subjectId)) map.set(subjectId, { subjectId, correct: 0, incorrect: 0, skipped: 0, score: 0, total: 0 });
    const row = map.get(subjectId)!;
    row.total++;
    if (r.isSkipped || r.selectedOptionIds.length === 0) row.skipped++;
    else if (r.isCorrect === true) row.correct++;
    else row.incorrect++;
  }
  for (const row of map.values()) row.score = row.correct - row.incorrect * 0.33;
  return Array.from(map.values());
}
