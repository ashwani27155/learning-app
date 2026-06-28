export interface Option {
  id: string; textEn: string; textMr: string; isCorrect: boolean;
}
export interface Question {
  id: string; textEn: string; textMr: string;
  type: string; difficulty: string; status?: string; examType?: string;
  pyqYear?: number; pyqExam?: string; marks?: number; negativeMarks?: number;
  usageCount?: number; successRate?: number;
  subject?: { nameEn: string }; chapter?: { nameEn: string }; topic?: { nameEn: string };
  options: Option[]; explanationEn?: string;
}
export interface Subject { id: string; nameEn: string; nameMr?: string; }
export type UsagePref = "fresh" | "mixed" | "any";

export interface SmartSlot {
  _key: string; subjectId: string; subjectName: string;
  count: number; easyPct: number; medPct: number; hardPct: number;
  usagePref: UsagePref;
}
export interface PaperMeta {
  title: string; subtitle: string; examName: string;
  date: string; duration: number; marksPerQ: number; negMarks: number;
}
export interface BankFilters {
  search: string; examType: string; subjectId: string;
  difficulty: string; type: string; isPyq: boolean; pyqYear: string;
  usageMin: string; usageMax: string; sortBy: string; page: number;
}
