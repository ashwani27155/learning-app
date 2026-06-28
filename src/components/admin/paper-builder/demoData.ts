import type { Question, Subject } from "./types";

export const DEMO_QS: Question[] = [
  { id: "d1", textEn: "In which year was Maharashtra formed?", textMr: "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?", type: "MCQ", difficulty: "easy", usageCount: 5, subject: { nameEn: "History" }, options: [{ id: "a", textEn: "1956", textMr: "1956", isCorrect: false }, { id: "b", textEn: "1960", textMr: "1960", isCorrect: true }, { id: "c", textEn: "1947", textMr: "1947", isCorrect: false }, { id: "d", textEn: "1972", textMr: "1972", isCorrect: false }] },
  { id: "d2", textEn: "Which Article abolishes untouchability?", textMr: "अस्पृश्यता नष्ट करणारा अनुच्छेद कोणता?", type: "MCQ", difficulty: "medium", usageCount: 2, subject: { nameEn: "Polity" }, options: [{ id: "a", textEn: "Article 14", textMr: "अनुच्छेद 14", isCorrect: false }, { id: "b", textEn: "Article 17", textMr: "अनुच्छेद 17", isCorrect: true }, { id: "c", textEn: "Article 21", textMr: "अनुच्छेद 21", isCorrect: false }, { id: "d", textEn: "Article 25", textMr: "अनुच्छेद 25", isCorrect: false }] },
  { id: "d3", textEn: "Chipko Movement is associated with which state?", textMr: "चिपको आंदोलन कोणत्या राज्याशी संबंधित आहे?", type: "MCQ", difficulty: "easy", usageCount: 0, subject: { nameEn: "Environment" }, options: [{ id: "a", textEn: "Himachal Pradesh", textMr: "हिमाचल प्रदेश", isCorrect: false }, { id: "b", textEn: "Uttarakhand", textMr: "उत्तराखंड", isCorrect: true }, { id: "c", textEn: "Rajasthan", textMr: "राजस्थान", isCorrect: false }, { id: "d", textEn: "MP", textMr: "मध्य प्रदेश", isCorrect: false }] },
  { id: "d4", textEn: "Which planet is known as the Red Planet?", textMr: "लाल ग्रह कोणता?", type: "MCQ", difficulty: "easy", usageCount: 8, subject: { nameEn: "Science" }, options: [{ id: "a", textEn: "Venus", textMr: "शुक्र", isCorrect: false }, { id: "b", textEn: "Jupiter", textMr: "गुरू", isCorrect: false }, { id: "c", textEn: "Mars", textMr: "मंगळ", isCorrect: true }, { id: "d", textEn: "Saturn", textMr: "शनी", isCorrect: false }] },
  { id: "d5", textEn: "Who wrote 'Discovery of India'?", textMr: "'डिस्कव्हरी ऑफ इंडिया' कोणी लिहिले?", type: "MCQ", difficulty: "medium", usageCount: 3, subject: { nameEn: "History" }, options: [{ id: "a", textEn: "Gandhi", textMr: "गांधी", isCorrect: false }, { id: "b", textEn: "Nehru", textMr: "नेहरू", isCorrect: true }, { id: "c", textEn: "Ambedkar", textMr: "आंबेडकर", isCorrect: false }, { id: "d", textEn: "Bose", textMr: "बोस", isCorrect: false }] },
  { id: "d6", textEn: "What is the capital of Maharashtra?", textMr: "महाराष्ट्राची राजधानी कोणती?", type: "MCQ", difficulty: "easy", usageCount: 12, subject: { nameEn: "Geography" }, options: [{ id: "a", textEn: "Pune", textMr: "पुणे", isCorrect: false }, { id: "b", textEn: "Nagpur", textMr: "नागपूर", isCorrect: false }, { id: "c", textEn: "Mumbai", textMr: "मुंबई", isCorrect: true }, { id: "d", textEn: "Nashik", textMr: "नाशिक", isCorrect: false }] },
  { id: "d7", textEn: "Which river is called 'Dakshin Ganga'?", textMr: "'दक्षिण गंगा' कोणत्या नदीला म्हणतात?", type: "MCQ", difficulty: "hard", usageCount: 1, subject: { nameEn: "Geography" }, options: [{ id: "a", textEn: "Godavari", textMr: "गोदावरी", isCorrect: true }, { id: "b", textEn: "Krishna", textMr: "कृष्णा", isCorrect: false }, { id: "c", textEn: "Kaveri", textMr: "कावेरी", isCorrect: false }, { id: "d", textEn: "Narmada", textMr: "नर्मदा", isCorrect: false }] },
  { id: "d8", textEn: "First Five Year Plan was launched in?", textMr: "पहिली पंचवार्षिक योजना कधी सुरू झाली?", type: "MCQ", difficulty: "medium", usageCount: 0, subject: { nameEn: "Economy" }, pyqYear: 2019, options: [{ id: "a", textEn: "1951", textMr: "1951", isCorrect: true }, { id: "b", textEn: "1947", textMr: "1947", isCorrect: false }, { id: "c", textEn: "1952", textMr: "1952", isCorrect: false }, { id: "d", textEn: "1956", textMr: "1956", isCorrect: false }] },
];

export const DEMO_SUBJECTS: Subject[] = [
  { id: "s1", nameEn: "History" }, { id: "s2", nameEn: "Geography" },
  { id: "s3", nameEn: "Polity" }, { id: "s4", nameEn: "Economy" },
  { id: "s5", nameEn: "Science" }, { id: "s6", nameEn: "Environment" },
  { id: "s7", nameEn: "Current Affairs" },
];

export const FALLBACK_EXAM_TYPES = ["MPSC", "UPSC", "PSI", "STI", "ASO", "CDPO", "Talathi"];

// Canonical list — keep in sync with the QuestionType enum in schema.prisma.
export const QUESTION_TYPES = [
  { value: "MCQ",                 label: "Single Correct (MCQ)" },
  { value: "MULTI_SELECT",        label: "Multiple Correct" },
  { value: "TRUE_FALSE",          label: "True / False" },
  { value: "ASSERTION_REASON",    label: "Assertion Reasoning" },
  { value: "FILL_IN_BLANK",       label: "Fill in the Blank" },
  { value: "NUMERICAL",           label: "Numerical Answer" },
  { value: "MATCH_THE_FOLLOWING", label: "Match the Following" },
  { value: "COMPREHENSION",       label: "Comprehension / Passage" },
];
