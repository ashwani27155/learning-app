import type { Series, TestItem } from "./types";

export const MOCK_SERIES: Series[] = [
  { id:"s1", titleEn:"Group A — Rajyaseva Pre Full Mock Series 2026", groupType:"A", type:"GROUP_WISE", examType:"MPSC", testCount:3, enrolledCount:12400, duration:60, totalMarks:100, status:"published", isPremium:false, price:0, createdAt:"2026-01-10" },
  { id:"s2", titleEn:"Group B — PSI / STI / ASO Combined Mock Series 2026", groupType:"B", type:"GROUP_WISE", examType:"MPSC", testCount:2, enrolledCount:8920, duration:60, totalMarks:100, status:"published", isPremium:true, price:999, createdAt:"2026-01-12" },
  { id:"s3", titleEn:"Group C — Technical Services Mock Series 2026", groupType:"C", type:"GROUP_WISE", examType:"MPSC", testCount:1, enrolledCount:5640, duration:60, totalMarks:100, status:"draft", isPremium:true, price:799, createdAt:"2026-01-15" },
  { id:"s4", titleEn:"Group D — Class IV Posts Mock Series 2026", groupType:"D", type:"GROUP_WISE", examType:"MPSC", testCount:1, enrolledCount:3280, duration:45, totalMarks:75, status:"published", isPremium:false, price:0, createdAt:"2026-01-18" },
];

export const MOCK_TESTS: TestItem[] = [
  { id:"t1", titleEn:"Mock Test 1 — Full Syllabus", status:"published", duration:60, totalMarks:100, passingPct:40, attemptCount:12400, negativeMarking:false, isFree:false },
  { id:"t2", titleEn:"Mock Test 2 — GS Focus",      status:"published", duration:60, totalMarks:100, passingPct:40, attemptCount:9800,  negativeMarking:false, isFree:true },
  { id:"t3", titleEn:"Mock Test 3 — Marathi & English", status:"scheduled", duration:60, totalMarks:100, passingPct:40, attemptCount:0, negativeMarking:false, isFree:false },
];

export const MOCK_TQS = [
  { id:"tq1", orderIndex:1, marks:1, negativeMarks:0.33, question:{ id:"q1", textEn:"In which year was the state of Maharashtra formed?", textMr:"महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?", type:"MCQ", difficulty:"easy", subject:{nameEn:"History"}, topic:{nameEn:"Maharashtra Formation"}, options:[{id:"a",textEn:"1956",textMr:"१९५६",isCorrect:false,orderIndex:0},{id:"b",textEn:"1960",textMr:"१९६०",isCorrect:true,orderIndex:1},{id:"c",textEn:"1947",textMr:"१९४७",isCorrect:false,orderIndex:2},{id:"d",textEn:"1972",textMr:"१९७२",isCorrect:false,orderIndex:3}], explanationEn:"Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.", usageCount:14, successRate:72, pyqYear:2022 }},
  { id:"tq2", orderIndex:2, marks:1, negativeMarks:0.33, question:{ id:"q2", textEn:"How many articles are there in the Constitution of India?", type:"MCQ", difficulty:"medium", subject:{nameEn:"Political Science"}, topic:{nameEn:"Constitution"}, options:[{id:"a",textEn:"350",isCorrect:false,orderIndex:0},{id:"b",textEn:"395",isCorrect:false,orderIndex:1},{id:"c",textEn:"448",isCorrect:true,orderIndex:2},{id:"d",textEn:"470",isCorrect:false,orderIndex:3}], explanationEn:"After amendments, the Constitution now has 448 articles.", usageCount:22, successRate:58 }},
  { id:"tq3", orderIndex:3, marks:2, negativeMarks:0.5, question:{ id:"q3", textEn:"Which river is known as the 'Lifeline of Maharashtra'?", type:"MCQ", difficulty:"easy", subject:{nameEn:"Geography"}, topic:{nameEn:"Rivers"}, options:[{id:"a",textEn:"Godavari",isCorrect:true,orderIndex:0},{id:"b",textEn:"Krishna",isCorrect:false,orderIndex:1},{id:"c",textEn:"Tapi",isCorrect:false,orderIndex:2},{id:"d",textEn:"Bhima",isCorrect:false,orderIndex:3}], explanationEn:"The Godavari is the longest river in Maharashtra.", usageCount:9, successRate:81 }},
];

export const MOCK_BANK = [
  { id:"bq1", textEn:"Who was the first Chief Minister of Maharashtra?", textMr:"महाराष्ट्राचे पहिले मुख्यमंत्री कोण?", type:"MCQ", difficulty:"medium", usageCount:5, isApproved:true, subject:{nameEn:"History"}, topic:{nameEn:"Leaders"} },
  { id:"bq2", textEn:"Article 32 of the Indian Constitution deals with:", type:"MCQ", difficulty:"easy", usageCount:8, isApproved:true, subject:{nameEn:"Political Science"}, topic:{nameEn:"Fundamental Rights"} },
  { id:"bq3", textEn:"Kalsubai is the highest peak in Maharashtra. Its height is approximately:", type:"MCQ", difficulty:"hard", usageCount:2, isApproved:true, subject:{nameEn:"Geography"}, topic:{nameEn:"Physical Features"} },
  { id:"bq4", textEn:"The Chipko Movement was primarily associated with protection of:", type:"MCQ", difficulty:"medium", usageCount:3, isApproved:true, subject:{nameEn:"Environment"}, topic:{nameEn:"Movements"} },
  { id:"bq5", textEn:"Which Constitutional Amendment gave legal status to Panchayati Raj institutions?", type:"MCQ", difficulty:"hard", usageCount:0, isApproved:true, subject:{nameEn:"Political Science"}, topic:{nameEn:"Amendments"} },
];
