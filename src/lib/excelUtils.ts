import * as XLSX from "xlsx";

// ─── Shared types ─────────────────────────────────────────────────────────────
export type QType =
  | "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "ASSERTION_REASON"
  | "FILL_IN_BLANK" | "NUMERICAL" | "MATCH_THE_FOLLOWING" | "COMPREHENSION";
export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type Board      = "MPSC" | "UPSC" | "SSC" | "IBPS" | string;

export interface Question {
  id: number;
  board: Board;
  subject: string;
  topic: string;
  sourceBook: string;
  sourcePage: string;
  text: string;
  type: QType;
  options: { id: string; text: string }[];
  correctOptions: string[];
  difficulty: Difficulty;
  isPYQ: boolean;
  pyqYear?: number;
  pyqExam?: string;
  explanation: string;
  explanationBook: string;
  explanationPage: string;
  usedInTests: number;
  approved: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COL_WIDTHS = (widths: number[]) => widths.map((wch) => ({ wch }));

function addBoldRow(ws: XLSX.WorkSheet, data: (string | number)[], rowIdx: number) {
  data.forEach((val, col) => {
    const cell = XLSX.utils.encode_cell({ r: rowIdx, c: col });
    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
    ws[cell] = { t: typeof val === "number" ? "n" : "s", v: val };
  });
}

// Apply a fill color + bold to a range of cells (best-effort — xlsx doesn't require styles for basic use)
function styleHeader(ws: XLSX.WorkSheet, range: string, _fill: string) {
  void ws; void range; void _fill;
}

// ── CSV download helper ───────────────────────────────────────────────────────
function downloadCSVBlob(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? "");
      // Wrap in quotes if the cell contains comma, newline, or double-quote
      return (s.includes(",") || s.includes("\n") || s.includes('"'))
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    }).join(",")
  ).join("\r\n");

  // BOM (﻿) ensures Excel opens UTF-8 CSV correctly (needed for Marathi text)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: Question Bank
// ─────────────────────────────────────────────────────────────────────────────

const QB_HEADERS = [
  "Subject *",
  "Topic *",
  "Source Book",
  "Source Page",
  "Question (English)",
  "Question (Marathi) *",
  "Option A *",
  "Option B *",
  "Option C",
  "Option D",
  "Option E",
  "Option F",
  "Correct Option(s) *  →  e.g. B  or  A,C",
  "Type *  →  MCQ | MULTI_SELECT | TRUE_FALSE | ASSERTION_REASON",
  "Difficulty *  →  easy | medium | hard",
  "Is PYQ  →  yes | no",
  "PYQ Year",
  "PYQ Exam",
  "Explanation",
  "Explanation Book",
  "Explanation Page",
];

const QB_SAMPLE_ROWS = [
  [
    "History",
    "Maratha Empire",
    "Maharashtra Board History Std 12",
    "82",
    "In which year was the state of Maharashtra formed?",
    "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?",
    "1956",
    "1960",
    "1947",
    "1972",
    "",
    "",
    "B",
    "MCQ",
    "easy",
    "yes",
    "2022",
    "Rajyaseva Pre",
    "Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.",
    "Modern India — Bipin Chandra",
    "312",
  ],
  [
    "Political Science",
    "Constitution",
    "Laxmikant Indian Polity",
    "145",
    "How many articles are there in the Constitution of India (as amended)?",
    "भारताच्या संविधानात किती कलमे आहेत?",
    "350",
    "395",
    "448",
    "470",
    "",
    "",
    "C",
    "MCQ",
    "medium",
    "no",
    "",
    "",
    "After amendments, the Constitution now has 448 articles in 25 parts and 12 schedules.",
    "Indian Polity — M. Laxmikant",
    "2-3",
  ],
  [
    "History",
    "Mughal Period",
    "NCERT History Class 12",
    "34",
    "Which of the following about Akbar's Din-i-Ilahi are correct? (choose all that apply)",
    "अकबराच्या दिन-ए-इलाहीबद्दल खालीलपैकी कोणते विधान बरोबर आहेत?",
    "It was founded by Akbar",
    "It emphasised tolerance",
    "It replaced Islam",
    "It had very few followers",
    "It was abolished after Akbar's death",
    "",
    "A,B,D",
    "MULTI_SELECT",
    "hard",
    "yes",
    "2021",
    "UPSC Prelims",
    "Din-i-Ilahi was a syncretic religion blending Islam, Hinduism, Zoroastrianism, and Christianity — it emphasised tolerance but had very few followers.",
    "NCERT History Class 12",
    "34",
  ],
  [
    "Geography",
    "Rivers of Maharashtra",
    "Geography of Maharashtra",
    "45",
    "Which river is known as the 'Lifeline of Maharashtra'?",
    "महाराष्ट्राची 'जीवनरेखा' कोणत्या नदीला म्हणतात?",
    "Godavari",
    "Krishna",
    "Tapi",
    "Bhima",
    "",
    "",
    "A",
    "MCQ",
    "easy",
    "no",
    "",
    "",
    "The Godavari is the longest river in Maharashtra, often called the Lifeline of Maharashtra.",
    "Geography of Maharashtra",
    "45",
  ],
];

const QB_INSTRUCTIONS = [
  ["MPSC Sadhak — Question Bank Import Template"],
  [""],
  ["PURPOSE:", "Use this file to bulk-add questions to your Question Bank."],
  ["          Questions imported here go to the bank — pending admin approval."],
  ["          You can then select approved questions when creating a test."],
  [""],
  ["HOW TO USE:"],
  ["  Step 1 →", "Open the 'Questions' sheet."],
  ["  Step 2 →", "Delete the 3 sample rows (rows 2–4). Do NOT delete the header row (row 1)."],
  ["  Step 3 →", "Fill in your questions. Columns marked * are required. Question (Marathi) * is required; Question (English) is optional."],
  ["  Step 4 →", "Save the file and upload it in Admin → Question Bank → Import Excel."],
  [""],
  ["RULES:"],
  ["  • Subject     —", "Must match exactly one of the valid subjects listed below."],
  ["  • Type        —", "MCQ · MULTI_SELECT · TRUE_FALSE · ASSERTION_REASON · FILL_IN_BLANK · NUMERICAL · MATCH_THE_FOLLOWING · COMPREHENSION"],
  ["  • Difficulty  —", "easy · medium · hard · expert  (all lowercase)"],
  ["  • Correct     —", "Single letter for MCQ/TRUE_FALSE/ASSERTION_REASON (e.g. B)"],
  ["               —", "Comma-separated for MULTI_SELECT (e.g. A,C or B,D,E)"],
  ["  • Options     —", "MCQ: A–D required (4 options). TRUE_FALSE: A–B only."],
  ["               —", "MULTI_SELECT: 2–6 options. ASSERTION_REASON: A–D required."],
  ["  • Is PYQ      —", "yes or no  (lowercase)"],
  ["  • PYQ Year    —", "4-digit year, e.g. 2023. Leave blank if Is PYQ = no."],
  [""],
  ["VALID SUBJECTS (copy exactly — case-sensitive):"],
  ["  MPSC: History · Geography · Political Science · General Studies"],
  ["        Marathi Language · English · CSAT · Economics"],
  ["        Science & Technology · Environment"],
  ["  UPSC: History · Geography · Political Science · Economics"],
  ["        General Science · Current Affairs · Ethics · Environment"],
  ["  SSC:  General Intelligence · English Language · Quantitative Aptitude · General Awareness"],
  ["  IBPS: Reasoning · English Language · Quantitative Aptitude"],
  ["        General/Financial Awareness · Computer Knowledge"],
];

export function downloadQuestionBankTemplate(board: Board = "MPSC", subjects: string[] = []) {
  const wb = XLSX.utils.book_new();

  // ── Instructions sheet ──
  const wsInstr = XLSX.utils.aoa_to_sheet(QB_INSTRUCTIONS);
  wsInstr["!cols"] = COL_WIDTHS([18, 80]);
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

  // ── Questions sheet ──
  const wsQ = XLSX.utils.aoa_to_sheet([QB_HEADERS, ...QB_SAMPLE_ROWS]);
  wsQ["!cols"] = COL_WIDTHS([
    22, 22, 30, 10,
    52, 52,
    30, 30, 30, 30, 30, 30,
    28,
    40,
    22, 10, 10, 22,
    55, 32, 14,
  ]);
  // Freeze first row
  wsQ["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsQ, "Questions");

  // ── Valid Values reference sheet ──
  const validRows: string[][] = [
    ["VALID VALUES REFERENCE"],
    [""],
    ["Column", "Allowed values (copy exactly)"],
    ["Type", "MCQ"],
    ["", "MULTI_SELECT"],
    ["", "TRUE_FALSE"],
    ["", "ASSERTION_REASON"],
    [""],
    ["Difficulty", "easy"],
    ["", "medium"],
    ["", "hard"],
    [""],
    ["Is PYQ", "yes"],
    ["", "no"],
    [""],
    [`Subjects for ${board}`, ...subjects],
    ...subjects.slice(1).map((s) => ["", s]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(validRows);
  wsRef["!cols"] = COL_WIDTHS([22, 50]);
  XLSX.utils.book_append_sheet(wb, wsRef, "Valid Values");

  XLSX.writeFile(wb, `question_bank_template_${board.toLowerCase()}.xlsx`);
}

// ── Question Bank CSV template (same column order as Excel to share one parser) ─
export function downloadQuestionBankTemplateCSV(_board: Board = "MPSC") {
  // Column order MUST match QB_HEADERS exactly so parseImportedExcel works for both
  const headers = [
    "Subject *",
    "Topic *",
    "Source Book",
    "Source Page",
    "Question (English)",
    "Question (Marathi) *",
    "Option A *",
    "Option B *",
    "Option C",
    "Option D",
    "Option E",
    "Option F",
    "Correct Option(s) *  e.g. B or A,C",
    "Type *  MCQ|MULTI_SELECT|TRUE_FALSE|ASSERTION_REASON",
    "Difficulty *  easy|medium|hard",
    "Is PYQ  yes|no",
    "PYQ Year",
    "PYQ Exam",
    "Explanation",
    "Explanation Book",
    "Explanation Page",
  ];

  const sample1 = [
    "History", "Maratha Empire",
    "Maharashtra Board History Std 12", "82",
    "In which year was the state of Maharashtra formed?",
    "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?",
    "1956", "1960", "1947", "1972", "", "",
    "B", "MCQ", "easy",
    "yes", "2022", "Rajyaseva Pre",
    "Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.",
    "Modern India — Bipin Chandra", "312",
  ];

  const sample2 = [
    "Political Science", "Constitution",
    "Laxmikant Indian Polity", "145",
    "How many articles are there in the Constitution of India (as amended)?",
    "भारताच्या संविधानात किती कलमे आहेत?",
    "350", "395", "448", "470", "", "",
    "C", "MCQ", "medium",
    "no", "", "",
    "After amendments, the Constitution now has 448 articles in 25 parts and 12 schedules.",
    "Indian Polity — M. Laxmikant", "2-3",
  ];

  const sample3 = [
    "History", "Mughal Period",
    "NCERT History Class 12", "34",
    "Which of the following about Akbar's Din-i-Ilahi are correct? (choose all that apply)",
    "अकबराच्या दिन-ए-इलाहीबद्दल खालीलपैकी कोणते विधान बरोबर आहेत?",
    "It was founded by Akbar",
    "It emphasised tolerance",
    "It replaced Islam",
    "It had very few followers",
    "", "",
    "A,B,D", "MULTI_SELECT", "hard",
    "yes", "2021", "UPSC Prelims",
    "Din-i-Ilahi was syncretic — emphasising tolerance but having very few followers.",
    "NCERT History Class 12", "34",
  ];

  downloadCSVBlob("question_bank_template.csv", [headers, sample1, sample2, sample3]);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: Direct Test Series
// ─────────────────────────────────────────────────────────────────────────────

export function downloadTestSeriesTemplate() {
  const wb = XLSX.utils.book_new();

  // ── Instructions sheet ──
  const instrRows = [
    ["MPSC Sadhak — Direct Test Series Import Template"],
    [""],
    ["PURPOSE:", "Use this file to create a complete test with questions in one upload."],
    ["          Questions go directly into the test — they are also saved to the Question Bank."],
    [""],
    ["TWO SHEETS TO FILL:"],
    ["  Sheet 'Test Settings'  —", "Fill in the test configuration (title, duration, marks, etc.)"],
    ["  Sheet 'Questions'      —", "Add all test questions with their options and correct answers"],
    [""],
    ["WORKFLOW:"],
    ["  Step 1 →", "Fill the Test Settings sheet."],
    ["  Step 2 →", "Fill the Questions sheet (delete the 2 sample rows first)."],
    ["  Step 3 →", "Save and upload in Admin → Manage Test Series → [open a series] → Add Test → Upload Excel."],
    [""],
    ["QUESTION RULES:"],
    ["  • Type        —", "MCQ · MULTI_SELECT · TRUE_FALSE · ASSERTION_REASON"],
    ["  • Difficulty  —", "easy · medium · hard"],
    ["  • Correct     —", "Single letter for MCQ/TRUE_FALSE (e.g. B)"],
    ["               —", "Comma-separated for MULTI_SELECT (e.g. A,C)"],
    ["  • Marks/Q     —", "Leave blank to use the default from Test Settings"],
    ["  • Neg Marks   —", "Leave blank to use the default from Test Settings"],
    ["  • Order       —", "Enter 1, 2, 3… to control question sequence. Leave blank for auto."],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
  wsInstr["!cols"] = COL_WIDTHS([26, 80]);
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

  // ── Test Settings sheet ──
  const settingsRows = [
    ["TEST SETTINGS"],
    [""],
    ["Field", "Your Value", "Notes"],
    ["Test Title (English) *", "", "e.g. Mock Test 1 — Full Syllabus"],
    ["Test Title (Marathi)", "", "मराठी शीर्षक (optional)"],
    ["Series Title / ID", "", "Name of the test series this test belongs to"],
    ["Group (A / B / C / D)", "A", "A = Rajyaseva, B = PSI/STI/ASO, C = Technical, D = Class IV"],
    ["Exam Type", "", "e.g. Rajyaseva Pre, PSI Pre, STI Pre, ASO, Custom"],
    ["Duration (minutes) *", "60", "Minimum 10 minutes"],
    ["Marks per Correct Answer *", "1", "Default marks for every question"],
    ["Negative Marks per Wrong *", "0.33", "Set 0 for no negative marking"],
    ["Passing Percentage *", "40", "e.g. 40 means student needs ≥ 40% to pass"],
    ["Shuffle Questions (yes/no)", "yes", "Randomise question order for each student"],
    ["Shuffle Options (yes/no)", "no", "Randomise option order within each question"],
    ["Result Timing", "immediate", "immediate | after_all_submit | on_date"],
    ["Publish Status", "draft", "draft | publish | schedule"],
    ["Publish Date (if schedule)", "", "e.g. 2026-06-15"],
    ["Publish Time (if schedule)", "10:00", "24-hour format, e.g. 10:00"],
    ["Is Premium (yes/no)", "no", ""],
    ["Price (₹, if premium)", "", "Leave blank if free"],
    ["Certificate on Pass (yes/no)", "no", ""],
  ];
  const wsSettings = XLSX.utils.aoa_to_sheet(settingsRows);
  wsSettings["!cols"] = COL_WIDTHS([34, 26, 55]);
  addBoldRow(wsSettings, ["TEST SETTINGS"], 0);
  addBoldRow(wsSettings, ["Field", "Your Value", "Notes"], 2);
  styleHeader(wsSettings, "A3:C3", "4F46E5");
  XLSX.utils.book_append_sheet(wb, wsSettings, "Test Settings");

  // ── Questions sheet ──
  const qHeaders = [
    "Order",
    "Subject *",
    "Topic",
    "Question (English)",
    "Question (Marathi) *",
    "Option A *",
    "Option B *",
    "Option C",
    "Option D",
    "Option E",
    "Option F",
    "Correct Option(s) *  →  e.g. B  or  A,C",
    "Type *  →  MCQ | MULTI_SELECT | TRUE_FALSE | ASSERTION_REASON",
    "Difficulty *  →  easy | medium | hard",
    "Marks/Q  (blank = use default)",
    "Neg Marks  (blank = use default)",
    "Explanation",
    "Reference Book",
    "Page No.",
    "Is PYQ  →  yes | no",
    "PYQ Year",
    "PYQ Exam",
  ];

  const qSampleRows = [
    [
      "1",
      "History",
      "Maharashtra Formation",
      "In which year was the state of Maharashtra established?",
      "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?",
      "1 May 1956",
      "1 May 1960",
      "26 Jan 1960",
      "15 Aug 1958",
      "",
      "",
      "B",
      "MCQ",
      "easy",
      "",
      "",
      "Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.",
      "Modern India — Bipin Chandra",
      "312",
      "yes",
      "2022",
      "Rajyaseva Pre",
    ],
    [
      "2",
      "Political Science",
      "Fundamental Rights",
      "Which Article of the Constitution gives the Right to Constitutional Remedies?",
      "संवैधानिक उपायांचा अधिकार कोणत्या कलमाद्वारे मिळतो?",
      "Article 19",
      "Article 21",
      "Article 32",
      "Article 44",
      "",
      "",
      "C",
      "MCQ",
      "medium",
      "2",
      "0.5",
      "Article 32 provides the Right to Constitutional Remedies. Ambedkar called it the 'Heart and Soul of the Constitution'.",
      "Indian Polity — M. Laxmikant",
      "105",
      "yes",
      "2023",
      "Rajyaseva Pre",
    ],
  ];

  const wsQ = XLSX.utils.aoa_to_sheet([qHeaders, ...qSampleRows]);
  wsQ["!cols"] = COL_WIDTHS([
    7, 22, 22,
    52, 52,
    30, 30, 30, 30, 30, 30,
    30, 42, 22,
    20, 20,
    55, 32, 10,
    14, 10, 22,
  ]);
  wsQ["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsQ, "Questions");

  XLSX.writeFile(wb, "test_series_template.xlsx");
}

// ── Test Series CSV template ──────────────────────────────────────────────────
export function downloadTestSeriesTemplateCSV() {
  const headers = [
    "Order",
    "Subject *",
    "Topic",
    "Question (English)",
    "Question (Marathi) *",
    "Option A *",
    "Option B *",
    "Option C",
    "Option D",
    "Option E",
    "Option F",
    "Correct Option(s) *  e.g. B or A,C",
    "Type *  MCQ|MULTI_SELECT|TRUE_FALSE|ASSERTION_REASON",
    "Difficulty *  easy|medium|hard",
    "Marks/Q  blank=use default",
    "Neg Marks  blank=use default",
    "Explanation",
    "Reference Book",
    "Page No.",
    "Is PYQ  yes|no",
    "PYQ Year",
    "PYQ Exam",
  ];

  const note = [
    "NOTE: This CSV covers questions only.",
    "Set test title, duration, marks, and publish settings in the wizard after uploading.",
    "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
  ];

  const sample1 = [
    "1", "History", "Maharashtra Formation",
    "In which year was the state of Maharashtra established?",
    "महाराष्ट्र राज्याची स्थापना कोणत्या वर्षी झाली?",
    "1 May 1956", "1 May 1960", "26 Jan 1960", "15 Aug 1958", "", "",
    "B", "MCQ", "easy", "", "",
    "Maharashtra was formed on 1 May 1960 as a result of the Samyukta Maharashtra movement.",
    "Modern India — Bipin Chandra", "312",
    "yes", "2022", "Rajyaseva Pre",
  ];

  const sample2 = [
    "2", "Political Science", "Fundamental Rights",
    "Which Article gives the Right to Constitutional Remedies?",
    "संवैधानिक उपायांचा अधिकार कोणत्या कलमाद्वारे मिळतो?",
    "Article 19", "Article 21", "Article 32", "Article 44", "", "",
    "C", "MCQ", "medium", "2", "0.5",
    "Article 32 is called the Heart and Soul of the Constitution by Ambedkar.",
    "Indian Polity — M. Laxmikant", "105",
    "yes", "2023", "Rajyaseva Pre",
  ];

  downloadCSVBlob("test_series_questions_template.csv", [headers, note, sample1, sample2]);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: Question Bank → Excel
// ─────────────────────────────────────────────────────────────────────────────
export function exportQuestionsToExcel(questions: Question[], board: Board) {
  const rows = questions.map((q) => {
    const opts: string[] = q.options.map((o) => o.text);
    while (opts.length < 6) opts.push("");
    const correctLetters = q.correctOptions.map((id) => id.toUpperCase()).join(",");
    return [
      q.subject, q.topic, q.sourceBook, q.sourcePage,
      q.text, "",
      ...opts,
      correctLetters,
      q.type, q.difficulty,
      q.isPYQ ? "yes" : "no",
      q.pyqYear ?? "", q.pyqExam ?? "",
      q.explanation, q.explanationBook, q.explanationPage,
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([QB_HEADERS, ...rows]);
  ws["!cols"] = COL_WIDTHS([
    22, 22, 30, 10,
    52, 52,
    30, 30, 30, 30, 30, 30,
    28, 40, 22, 10, 10, 22,
    55, 32, 14,
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, `questions_${board.toLowerCase()}_${Date.now()}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE: Question Bank import
// ─────────────────────────────────────────────────────────────────────────────
export type ParsedQuestion = Omit<Question, "id" | "board" | "usedInTests" | "approved">;

export interface ImportResult {
  questions: ParsedQuestion[];
  errors: { row: number; message: string }[];
}

export function parseImportedExcel(file: File, _board: Board): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames.includes("Questions")
          ? "Questions"
          : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        }) as string[][];

        if (rows.length < 2)
          return resolve({
            questions: [],
            errors: [{ row: 0, message: "No data rows found." }],
          });

        const questions: ParsedQuestion[] = [];
        const errors: { row: number; message: string }[] = [];
        const optLetters = ["a", "b", "c", "d", "e", "f"];

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.every((c) => String(c).trim() === "")) continue;

          const rowNum      = i + 1;
          const subject     = String(r[0]  ?? "").trim();
          const topic       = String(r[1]  ?? "").trim();
          const sourceBook  = String(r[2]  ?? "").trim();
          const sourcePage  = String(r[3]  ?? "").trim();
          const textEn      = String(r[4]  ?? "").trim();   // English — optional
          const textMr      = String(r[5]  ?? "").trim();   // Marathi — required
          const text        = textMr || textEn;              // primary display text
          const optA        = String(r[6]  ?? "").trim();
          const optB        = String(r[7]  ?? "").trim();
          const optC        = String(r[8]  ?? "").trim();
          const optD        = String(r[9]  ?? "").trim();
          const optE        = String(r[10] ?? "").trim();
          const optF        = String(r[11] ?? "").trim();
          const correctRaw  = String(r[12] ?? "").trim().toUpperCase();
          const typeRaw     = String(r[13] ?? "").trim().toUpperCase() as QType;
          const difficulty  = String(r[14] ?? "").trim().toLowerCase() as Difficulty;
          const isPYQRaw    = String(r[15] ?? "").trim().toLowerCase();
          const pyqYearRaw  = String(r[16] ?? "").trim();
          const pyqExam     = String(r[17] ?? "").trim();
          const explanation     = String(r[18] ?? "").trim();
          const explanationBook = String(r[19] ?? "").trim();
          const explanationPage = String(r[20] ?? "").trim();

          const rowErrors: string[] = [];
          if (!subject) rowErrors.push("Subject is required");
          if (!textMr)  rowErrors.push("Question (Marathi) is required");

          const validTypes: QType[] = [
            "MCQ", "MULTI_SELECT", "TRUE_FALSE", "ASSERTION_REASON",
            "FILL_IN_BLANK", "NUMERICAL", "MATCH_THE_FOLLOWING", "COMPREHENSION",
          ];
          if (!validTypes.includes(typeRaw))
            rowErrors.push(`Invalid Type "${typeRaw}"`);

          const validDiffs: Difficulty[] = ["easy", "medium", "hard", "expert"];
          if (!validDiffs.includes(difficulty))
            rowErrors.push(`Invalid Difficulty "${difficulty}"`);

          if (!correctRaw) rowErrors.push("Correct option(s) required");

          if (rowErrors.length > 0) {
            errors.push({ row: rowNum, message: rowErrors.join("; ") });
            continue;
          }

          const options = [optA, optB, optC, optD, optE, optF]
            .map((t, idx) => ({ id: optLetters[idx], text: t }))
            .filter((o) => o.text !== "");

          if (options.length < 2) {
            errors.push({ row: rowNum, message: "At least 2 options required" });
            continue;
          }

          const correctOptions = correctRaw
            .split(",")
            .map((l) => l.trim().toLowerCase())
            .filter((l) => optLetters.includes(l));

          if (correctOptions.length === 0) {
            errors.push({
              row: rowNum,
              message: `No valid correct option found ("${correctRaw}") — use A, B, C, D, E, or F`,
            });
            continue;
          }

          const isPYQ  = isPYQRaw === "yes";
          const pyqYear = isPYQ && pyqYearRaw ? Number(pyqYearRaw) : undefined;

          questions.push({
            subject, topic, sourceBook, sourcePage, text,
            textMr,
            textEn: textEn || textMr,
            type: typeRaw,
            options: options.map(o => ({
              ...o,
              textEn: o.text, textMr: o.text,
              isCorrect: correctOptions.includes(o.id),
            })),
            correctOptions, difficulty,
            isPYQ,
            pyqYear: isNaN(pyqYear!) ? undefined : pyqYear,
            pyqExam: isPYQ ? pyqExam : undefined,
            explanation, explanationBook, explanationPage,
            explanationEn: explanation, explanationMr: "",
            referenceSource: explanationBook ? `${explanationBook}${explanationPage ? ` p.${explanationPage}` : ""}` : "",
          } as any);
        }
        resolve({ questions, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE: Test Series import
// ─────────────────────────────────────────────────────────────────────────────
export interface TestSettings {
  testTitle: string;
  testTitleMr: string;
  seriesTitle: string;
  group: "A" | "B" | "C" | "D";
  examType: string;
  duration: number;
  defaultMarksPerQ: number;
  defaultNegMarks: number;
  passingPct: number;
  shuffleQ: boolean;
  shuffleOpts: boolean;
  resultTiming: "immediate" | "after_all_submit" | "on_date";
  publishMode: "draft" | "publish" | "schedule";
  publishDate: string;
  publishTime: string;
  isPremium: boolean;
  price: number;
  certOnPass: boolean;
}

export interface TestSeriesQuestion {
  order: number;
  subject: string;
  topic: string;
  textEn: string;
  textMr: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  type: QType;
  difficulty: Difficulty;
  marksPerQ: number | null;
  negMarksPerQ: number | null;
  explanation: string;
  explanationBook: string;
  explanationPage: string;
  isPYQ: boolean;
  pyqYear?: number;
  pyqExam?: string;
  error?: string;
}

export interface TestSeriesImportResult {
  settings: Partial<TestSettings>;
  questions: TestSeriesQuestion[];
  errors: { row: number; message: string }[];
}

export function parseTestSeriesExcel(
  file: File
): Promise<TestSeriesImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });

        // ── Read Test Settings ──
        const settings: Partial<TestSettings> = {};
        const settingsSheet = wb.Sheets["Test Settings"];
        if (settingsSheet) {
          const sRows: string[][] = XLSX.utils.sheet_to_json(settingsSheet, {
            header: 1,
            defval: "",
          }) as string[][];

          const find = (label: string): string => {
            const row = sRows.find(
              (r) => String(r[0]).toLowerCase().includes(label.toLowerCase())
            );
            return row ? String(row[1] ?? "").trim() : "";
          };

          settings.testTitle     = find("Test Title (English)");
          settings.testTitleMr   = find("Test Title (Marathi)");
          settings.seriesTitle   = find("Series Title");
          const g = find("Group");
          settings.group         = (["A","B","C","D"].includes(g) ? g : "A") as TestSettings["group"];
          settings.examType      = find("Exam Type");
          settings.duration      = Number(find("Duration")) || 60;
          settings.defaultMarksPerQ = Number(find("Marks per Correct")) || 1;
          settings.defaultNegMarks  = Number(find("Negative Marks")) || 0;
          settings.passingPct    = Number(find("Passing Percentage")) || 40;
          settings.shuffleQ      = find("Shuffle Questions").toLowerCase() === "yes";
          settings.shuffleOpts   = find("Shuffle Options").toLowerCase() === "yes";
          const rt = find("Result Timing").toLowerCase();
          settings.resultTiming  = (["immediate","after_all_submit","on_date"].includes(rt)
            ? rt : "immediate") as TestSettings["resultTiming"];
          const pm = find("Publish Status").toLowerCase();
          settings.publishMode   = (["draft","publish","schedule"].includes(pm)
            ? pm : "draft") as TestSettings["publishMode"];
          settings.publishDate   = find("Publish Date");
          settings.publishTime   = find("Publish Time") || "10:00";
          settings.isPremium     = find("Is Premium").toLowerCase() === "yes";
          settings.price         = Number(find("Price")) || 0;
          settings.certOnPass    = find("Certificate on Pass").toLowerCase() === "yes";
        }

        // ── Read Questions ── (fall back to first non-settings sheet for CSV)
        const qSheetName =
          wb.SheetNames.includes("Questions")
            ? "Questions"
            : wb.SheetNames.find(n => n !== "Test Settings" && n !== "Instructions") ?? wb.SheetNames[0];
        const qSheet = wb.Sheets[qSheetName];
        if (!qSheet) {
          return resolve({
            settings,
            questions: [],
            errors: [{ row: 0, message: "No questions sheet found in file." }],
          });
        }

        const qRows: string[][] = XLSX.utils.sheet_to_json(qSheet, {
          header: 1,
          defval: "",
        }) as string[][];

        if (qRows.length < 2) {
          return resolve({
            settings,
            questions: [],
            errors: [{ row: 0, message: "No question rows found." }],
          });
        }

        const questions: TestSeriesQuestion[] = [];
        const errors: { row: number; message: string }[] = [];
        const optLetters = ["a", "b", "c", "d", "e", "f"];

        for (let i = 1; i < qRows.length; i++) {
          const r = qRows[i];
          if (r.every((c) => String(c).trim() === "")) continue;

          const rowNum        = i + 1;
          const orderRaw      = String(r[0]  ?? "").trim();
          const subject       = String(r[1]  ?? "").trim();
          const topic         = String(r[2]  ?? "").trim();
          const textEn        = String(r[3]  ?? "").trim();
          const textMr        = String(r[4]  ?? "").trim();
          const optA          = String(r[5]  ?? "").trim();
          const optB          = String(r[6]  ?? "").trim();
          const optC          = String(r[7]  ?? "").trim();
          const optD          = String(r[8]  ?? "").trim();
          const optE          = String(r[9]  ?? "").trim();
          const optF          = String(r[10] ?? "").trim();
          const correctRaw    = String(r[11] ?? "").trim().toUpperCase();
          const typeRaw       = String(r[12] ?? "").trim().toUpperCase() as QType;
          const difficulty    = String(r[13] ?? "").trim().toLowerCase() as Difficulty;
          const marksRaw      = String(r[14] ?? "").trim();
          const negMarksRaw   = String(r[15] ?? "").trim();
          const explanation       = String(r[16] ?? "").trim();
          const explanationBook   = String(r[17] ?? "").trim();
          const explanationPage   = String(r[18] ?? "").trim();
          const isPYQRaw      = String(r[19] ?? "").trim().toLowerCase();
          const pyqYearRaw    = String(r[20] ?? "").trim();
          const pyqExam       = String(r[21] ?? "").trim();

          const rowErrors: string[] = [];
          if (!subject) rowErrors.push("Subject required");
          if (!textMr)  rowErrors.push("Question (Marathi) required");
          if (!["MCQ","MULTI_SELECT","TRUE_FALSE","ASSERTION_REASON"].includes(typeRaw))
            rowErrors.push(`Invalid Type "${typeRaw}"`);
          if (!["easy","medium","hard"].includes(difficulty))
            rowErrors.push(`Invalid Difficulty "${difficulty}"`);
          if (!correctRaw) rowErrors.push("Correct option(s) required");

          if (rowErrors.length > 0) {
            errors.push({ row: rowNum, message: rowErrors.join("; ") });
            continue;
          }

          const allOpts = [optA, optB, optC, optD, optE, optF];
          const options = allOpts
            .map((t, idx) => ({
              id: optLetters[idx],
              text: t,
              isCorrect: false,
            }))
            .filter((o) => o.text !== "");

          if (options.length < 2) {
            errors.push({ row: rowNum, message: "At least 2 options required" });
            continue;
          }

          const correctIds = correctRaw
            .split(",")
            .map((l) => l.trim().toLowerCase())
            .filter((l) => optLetters.includes(l));

          if (correctIds.length === 0) {
            errors.push({
              row: rowNum,
              message: `No valid correct option found ("${correctRaw}")`,
            });
            continue;
          }

          options.forEach((o) => {
            o.isCorrect = correctIds.includes(o.id);
          });

          const isPYQ  = isPYQRaw === "yes";
          const pyqYear = isPYQ && pyqYearRaw ? Number(pyqYearRaw) : undefined;

          questions.push({
            order: orderRaw ? Number(orderRaw) : i,
            subject, topic, textEn, textMr, options,
            type: typeRaw, difficulty,
            marksPerQ: marksRaw ? Number(marksRaw) : null,
            negMarksPerQ: negMarksRaw ? Number(negMarksRaw) : null,
            explanation, explanationBook, explanationPage,
            isPYQ,
            pyqYear: isNaN(pyqYear!) ? undefined : pyqYear,
            pyqExam: isPYQ ? pyqExam : undefined,
          });
        }

        questions.sort((a, b) => a.order - b.order);
        resolve({ settings, questions, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
