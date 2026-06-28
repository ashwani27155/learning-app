export type SeriesType   = "GROUP_WISE" | "SUBJECT_WISE" | "PYQ" | "LIVE" | "MOCK" | "SPEED_TEST";
export type Group        = "A" | "B" | "C" | "D" | null;
export type SeriesStatus = "published" | "draft" | "scheduled" | "live" | "ended";
export type Difficulty   = "easy" | "medium" | "hard" | "expert";

export interface Series {
  id:          string;
  titleEn:     string;
  titleMr?:    string;
  groupType:   Group;
  type:        SeriesType;
  examType?:   string;
  examId?:     string | null;
  testCount?:  number;
  enrolledCount: number;
  duration:    number;
  totalMarks:  number;
  status:      SeriesStatus;
  isPremium:   boolean;
  price:       number;
  createdAt:   string;
}

export interface TestItem {
  id:         string;
  titleEn:    string;
  titleMr?:   string;
  status:     SeriesStatus;
  duration:   number;
  totalMarks: number;
  passingPct: number;
  attemptCount: number;
  scheduledAt?: string;
  negativeMarking: boolean;
  isFree: boolean;
}

export interface ConfirmState {
  title:   string;
  message: string;
  onConfirm: () => void;
}

export const STATUS_BADGE: Record<SeriesStatus, string> = {
  published:"badge-success", draft:"badge-warning", scheduled:"badge-info",
  live:"badge-error", ended:"bg-gray-100 text-gray-500",
};

export const GROUP_META: Record<string, { label:string; color:string; border:string; desc:string }> = {
  A: { label:"Group A", color:"bg-primary-50",  border:"border-primary-300",  desc:"Gazetted Officers · Class I & II" },
  B: { label:"Group B", color:"bg-sky-50",       border:"border-sky-300",      desc:"Non-Gazetted · PSI · STI · ASO" },
  C: { label:"Group C", color:"bg-primary-50",    border:"border-purple-300",   desc:"Technical & Engineering Posts" },
  D: { label:"Group D", color:"bg-emerald-50",   border:"border-emerald-300",  desc:"Class IV Support Staff" },
};

export const DIFF_BADGE: Record<Difficulty, string> = {
  easy:"bg-emerald-100 text-emerald-700", medium:"bg-amber-100 text-amber-700",
  hard:"bg-red-100 text-red-700", expert:"bg-purple-100 text-purple-700",
};
