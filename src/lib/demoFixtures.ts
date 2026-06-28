import type { PracticeQuestion } from "./usePracticeQuestions";

// ── Daily Practice ───────────────────────────────────────────────────────────

export const DAILY_QUESTIONS: PracticeQuestion[] = [
  { id:1, text:"Which Article of the Indian Constitution abolishes untouchability?", subject:"Political Science",
    options:[{id:"a",text:"Article 14"},{id:"b",text:"Article 17"},{id:"c",text:"Article 21"},{id:"d",text:"Article 23"}], correct:"b",
    explanation:"Article 17 abolishes untouchability and its practice in any form is forbidden." },
  { id:2, text:"The Chipko Movement of 1973 was related to which state?", subject:"History",
    options:[{id:"a",text:"Himachal Pradesh"},{id:"b",text:"Kerala"},{id:"c",text:"Uttarakhand (then UP)"},{id:"d",text:"Rajasthan"}], correct:"c",
    explanation:"The Chipko Movement started in 1973 in Chamoli district of Uttarakhand (then part of Uttar Pradesh) as a non-violent protest to protect trees." },
  { id:3, text:"What is the chemical formula of baking soda?", subject:"Science",
    options:[{id:"a",text:"Na₂CO₃"},{id:"b",text:"NaHCO₃"},{id:"c",text:"NaCl"},{id:"d",text:"NaOH"}], correct:"b",
    explanation:"Baking soda is sodium bicarbonate (NaHCO₃). Washing soda is Na₂CO₃." },
  { id:4, text:"Who wrote the book 'Discovery of India'?", subject:"History",
    options:[{id:"a",text:"Mahatma Gandhi"},{id:"b",text:"B. R. Ambedkar"},{id:"c",text:"Jawaharlal Nehru"},{id:"d",text:"Subhas Chandra Bose"}], correct:"c",
    explanation:"'The Discovery of India' was written by Jawaharlal Nehru in 1946 while imprisoned in Ahmednagar Fort." },
  { id:5, text:"Which planet is known as the 'Red Planet'?", subject:"Science",
    options:[{id:"a",text:"Venus"},{id:"b",text:"Saturn"},{id:"c",text:"Jupiter"},{id:"d",text:"Mars"}], correct:"d",
    explanation:"Mars is called the 'Red Planet' because of the iron oxide (rust) on its surface giving it a reddish appearance." },
  { id:6, text:"In which year did India get independence?", subject:"History",
    options:[{id:"a",text:"1945"},{id:"b",text:"1947"},{id:"c",text:"1950"},{id:"d",text:"1952"}], correct:"b",
    explanation:"India gained independence on 15 August 1947 from British colonial rule." },
  { id:7, text:"What is the capital of Australia?", subject:"Geography",
    options:[{id:"a",text:"Sydney"},{id:"b",text:"Melbourne"},{id:"c",text:"Canberra"},{id:"d",text:"Brisbane"}], correct:"c",
    explanation:"Canberra is the capital of Australia. It was purpose-built as a compromise between Sydney and Melbourne." },
  { id:8, text:"Article 370 that was revoked in 2019 was related to which state?", subject:"Political Science",
    options:[{id:"a",text:"Himachal Pradesh"},{id:"b",text:"Uttarakhand"},{id:"c",text:"Jammu & Kashmir"},{id:"d",text:"Sikkim"}], correct:"c",
    explanation:"Article 370 granted special autonomous status to Jammu & Kashmir. It was abrogated on 5 August 2019." },
  { id:9, text:"Which is the longest river in the world?", subject:"Geography",
    options:[{id:"a",text:"Amazon"},{id:"b",text:"Nile"},{id:"c",text:"Yangtze"},{id:"d",text:"Mississippi"}], correct:"b",
    explanation:"The Nile (6,650 km) is generally considered the longest river in the world, followed by the Amazon." },
  { id:10, text:"Who is the author of the Indian National Anthem?", subject:"History",
    options:[{id:"a",text:"Bankim Chandra Chattopadhyay"},{id:"b",text:"Rabindranath Tagore"},{id:"c",text:"Sarojini Naidu"},{id:"d",text:"Subramanya Bharati"}], correct:"b",
    explanation:"'Jana Gana Mana' was composed by Rabindranath Tagore. It was adopted as the national anthem on 24 January 1950." },
];

// ── Flashcards ───────────────────────────────────────────────────────────────

export interface Flashcard {
  id: number;
  subject: string;
  front: string;
  back: string;
  source: string;
}

export const FLASHCARDS: Flashcard[] = [
  { id:1, subject:"History",          front:"Who founded the Maratha Empire?",                         back:"Chhatrapati Shivaji Maharaj founded the Maratha Empire in 1674 CE.", source:"Modern India — Bipin Chandra, p. 45" },
  { id:2, subject:"Political Science", front:"What does the Preamble of the Indian Constitution begin with?", back:"'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC…'", source:"Indian Polity — M. Laxmikant, p. 1" },
  { id:3, subject:"Geography",        front:"What is the Tropic of Cancer?",                          back:"The Tropic of Cancer (23.5°N) passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.", source:"NCERT Geography Class 9, p. 2" },
  { id:4, subject:"History",          front:"When was the Constitution of India adopted?",             back:"The Constitution of India was adopted on 26 November 1949 and came into effect on 26 January 1950 (Republic Day).", source:"Indian Polity — M. Laxmikant, p. 3" },
  { id:5, subject:"Science",          front:"What is Newton's First Law of Motion?",                   back:"An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction, unless acted upon by an unbalanced force (Law of Inertia).", source:"NCERT Science Class 9, p. 100" },
  { id:6, subject:"Political Science", front:"What is the emergency provision under Article 356?",      back:"Article 356 (President's Rule) allows the President to take over administration of a state if constitutional governance fails. Also called 'State Emergency' or 'Constitutional Emergency'.", source:"Indian Polity — M. Laxmikant, p. 428" },
  { id:7, subject:"Geography",        front:"Which is the largest district in Maharashtra by area?",   back:"Ahmednagar (Ahilyanagar) is the largest district in Maharashtra by area (~17,048 sq km). Pune is the largest by population.", source:"Maharashtra Geography — MPSC Material, p. 12" },
  { id:8, subject:"History",          front:"What was the Dandi March of 1930?",                      back:"The Dandi March (Salt March) was led by Mahatma Gandhi from 12 March to 6 April 1930 — a 386 km march to Dandi village to protest British salt tax by making salt from seawater.", source:"Modern India — Bipin Chandra, p. 289" },
];
