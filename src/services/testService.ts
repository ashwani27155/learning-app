import { api } from "../lib/api";

export interface QuestionOption {
  id: string;
  textEn: string;
  textMr: string;
  orderIndex: number;
  isCorrect?: boolean;
}

export interface TestQuestion {
  id: string;
  textEn: string;
  textMr: string;
  type: string;
  options: QuestionOption[];
  explanationEn?: string;
  explanationBook?: string;
  explanationPage?: string;
  subject?: { nameEn: string };
  orderIndex: number;
  marks: number;
  negativeMarks: number;
  difficulty?: "easy" | "medium" | "hard" | "expert";
}

export interface TestSection {
  id: string;
  titleEn: string;
  subject?: { nameEn: string };
  questions: Array<{ orderIndex: number; marks: number; negativeMarks: number; question: TestQuestion }>;
}

export interface Test {
  id: string;
  titleEn: string;
  titleMr: string;
  duration: number;
  totalMarks: number;
  passingPct: number;
  negativeMarking: boolean;
  sections: TestSection[];
}

export interface Attempt {
  id: string;
  status: string;
  startedAt: string;
}

export interface SaveResponsePayload {
  questionId: string;
  selectedOptionIds: string[];
  isMarkedForReview: boolean;
  timeSpent: number;
}

export interface AttemptResult {
  id: string;
  attemptId: string;
  testId: string;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  timeTaken?: number;
  isPassed: boolean;
  subjectResults: Array<{
    subjectId: string;
    correct: number;
    incorrect: number;
    skipped: number;
    score: number;
    total: number;
  }>;
  strengthAreas?: string[];
  weakAreas?: string[];
  totalQuestions?: number;
  test: { titleEn: string; passingPct: number };
  attempt: {
    startedAt: string;
    submittedAt?: string;
    responses: Array<{
      questionId: string;
      selectedOptionIds: string[];
      isMarkedForReview: boolean;
      isSkipped: boolean;
      isCorrect?: boolean;
      marksObtained?: number;
      timeSpent?: number;
      question: {
        id: string;
        textEn: string;
        textMr: string;
        explanationEn?: string;
        explanationBook?: string;
        explanationPage?: string;
        subject?: { nameEn: string };
        options: QuestionOption[];
        difficulty?: "easy" | "medium" | "hard" | "expert";
      };
    }>;
  };
}

export const testService = {
  async getTest(testId: string): Promise<Test> {
    return api.get<Test>(`/tests/${testId}`);
  },

  async startAttempt(testId: string): Promise<Attempt> {
    return api.post<Attempt>(`/tests/${testId}/attempt/start`);
  },

  async saveResponses(testId: string, attemptId: string, responses: SaveResponsePayload[], tabSwitches?: number): Promise<void> {
    await api.put(`/tests/${testId}/attempt/${attemptId}/save`, { responses, tabSwitches });
  },

  async submitTest(testId: string, attemptId: string): Promise<AttemptResult> {
    return api.post<AttemptResult>(`/tests/${testId}/attempt/${attemptId}/submit`);
  },

  async getResult(testId: string, attemptId: string): Promise<AttemptResult> {
    return api.get<AttemptResult>(`/tests/${testId}/result/${attemptId}`);
  },

  async guestSubmit(testId: string, responses: SaveResponsePayload[]): Promise<AttemptResult> {
    return api.post<AttemptResult>(`/tests/${testId}/guest-submit`, { responses });
  },

  async reportQuestion(testId: string, questionId: string, reason: string): Promise<void> {
    try {
      await api.post(`/tests/${testId}/questions/${questionId}/report`, { reason });
    } catch { /* silently handle if endpoint not yet available */ }
  },
};

/** Flatten a test's sections into a single ordered question array */
export function flattenTestQuestions(test: Test): TestQuestion[] {
  return test.sections
    .flatMap(s =>
      s.questions.map(tq => ({
        ...tq.question,
        orderIndex: tq.orderIndex,
        marks: tq.marks,
        negativeMarks: tq.negativeMarks,
        subject: tq.question.subject ?? s.subject,
      }))
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);
}
