import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { DEMO_MODE } from "./demoMode";

export interface PracticeOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: number | string;
  text: string;
  subject: string;
  options: PracticeOption[];
  correct: string;
  explanation: string;
  year?: number;
  exam?: string;
  difficulty?: string;
}

export interface PracticeFilters {
  subjectId?: string;
  topicId?: string;
  pyqYear?: string;
  examType?: string;
  limit?: number;
}

function mapLiveQuestion(q: any): PracticeQuestion {
  return {
    id:          q.id,
    year:        q.pyqYear ?? q.year ?? undefined,
    exam:        q.pyqExam ?? q.exam ?? q.examType ?? undefined,
    subject:     q.subject?.nameEn ?? q.subject ?? "General",
    difficulty:  q.difficulty ?? "medium",
    text:        q.textEn ?? q.text ?? "",
    options:     (q.options ?? []).map((o: any) => ({ id: o.id, text: o.textEn ?? o.text ?? "" })),
    correct:     (q.options ?? []).find((o: any) => o.isCorrect)?.id ?? "a",
    explanation: q.explanationEn ?? q.explanation ?? "",
  };
}

/**
 * Single place that decides real-vs-demo data for the three practice modes
 * backed by `GET /questions/practice`. Pages just consume `questions` and
 * never branch on DEMO_MODE themselves.
 */
export function usePracticeQuestions(
  type: "daily" | "pyq" | "topic",
  filters: PracticeFilters,
  demoFixture: PracticeQuestion[],
  queryEnabled = true,
) {
  const enabled = queryEnabled && !DEMO_MODE;

  const { data: liveData, isLoading } = useQuery({
    queryKey: ["practice-questions", type, filters],
    queryFn: () => {
      const params = new URLSearchParams({ type, limit: String(filters.limit ?? 20) });
      if (filters.subjectId) params.set("subjectId", filters.subjectId);
      if (filters.topicId)   params.set("topicId", filters.topicId);
      if (filters.pyqYear)   params.set("year", filters.pyqYear);
      if (filters.examType)  params.set("examType", filters.examType);
      return api.get<any[]>(`/questions/practice?${params}`);
    },
    enabled,
    staleTime: 300_000,
  });

  // liveData is referentially stable across renders (React Query only
  // produces a new reference when the query actually refetches), but
  // `.map()` is not — without memoizing here, every consumer effect keyed
  // on `questions` would re-fire on every render, looping forever.
  const live = useMemo(
    () => (Array.isArray(liveData) ? liveData.map(mapLiveQuestion) : null),
    [liveData],
  );
  const isLive    = !DEMO_MODE && !!live && live.length > 0;
  const questions = useMemo(
    () => (isLive ? (live as PracticeQuestion[]) : demoFixture),
    [isLive, live, demoFixture],
  );

  return { questions, isLoading: enabled && isLoading, isLive };
}
