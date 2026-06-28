import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FLASHCARDS } from "../../lib/demoFixtures";

type Rating = "knew" | "didnt";

// ── Leitner spaced-repetition system ────────────────────────────────────────

interface LeitnerState {
  box1: number[]; // shown every session
  box2: number[]; // shown every 2nd session
  box3: number[]; // shown every 3rd session
  sessionCount: number;
}

function leitnerKey(subjectKey: string) {
  return `flashcard_leitner_${subjectKey}`;
}

function loadLeitner(subjectKey: string, allIds: number[]): LeitnerState {
  try {
    const raw = localStorage.getItem(leitnerKey(subjectKey));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { box1: allIds, box2: [], box3: [], sessionCount: 0 };
}

function saveLeitner(subjectKey: string, state: LeitnerState) {
  localStorage.setItem(leitnerKey(subjectKey), JSON.stringify(state));
}

function getSessionCards(state: LeitnerState, allCards: typeof FLASHCARDS): typeof FLASHCARDS {
  const { box1, box2, box3, sessionCount } = state;
  const due = new Set<number>([
    ...box1,
    ...(sessionCount % 2 === 0 ? box2 : []),
    ...(sessionCount % 3 === 0 ? box3 : []),
  ]);
  if (due.size === 0) return allCards; // fallback: show all
  return allCards.filter(c => due.has(c.id));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FlashcardMode() {
  const [filter, setFilter] = useState("all");

  const subjectKey = filter;
  const allSubjectCards = filter === "all" ? FLASHCARDS : FLASHCARDS.filter(f => f.subject === filter);
  const allIds = allSubjectCards.map(c => c.id);

  const [leitner, setLeitner] = useState<LeitnerState>(() => loadLeitner(subjectKey, allIds));

  // Re-initialize Leitner state when subject filter changes
  useEffect(() => {
    setLeitner(loadLeitner(subjectKey, allSubjectCards.map(c => c.id)));
    setCurrent(0);
    setFlipped(false);
    setRatings({});
    setDone(false);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = getSessionCards(leitner, allSubjectCards);

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [done, setDone]       = useState(false);

  const card = cards[current];

  const handleRate = (r: Rating) => {
    setRatings(p => ({ ...p, [card.id]: r }));
    setFlipped(false);

    setLeitner(prev => {
      const next: LeitnerState = {
        box1: prev.box1.filter(id => id !== card.id),
        box2: prev.box2.filter(id => id !== card.id),
        box3: prev.box3.filter(id => id !== card.id),
        sessionCount: prev.sessionCount,
      };
      if (r === "knew") {
        // Promote one box up; stay in box3 once reached
        if (prev.box1.includes(card.id))      next.box2 = [...next.box2, card.id];
        else if (prev.box2.includes(card.id)) next.box3 = [...next.box3, card.id];
        else                                  next.box3 = [...next.box3, card.id];
      } else {
        // Demote back to box1
        next.box1 = [...next.box1, card.id];
      }
      saveLeitner(subjectKey, next);
      return next;
    });

    if (current < cards.length - 1) setCurrent(c => c + 1);
    else setDone(true);
  };

  const restart = () => {
    setLeitner(prev => {
      const next = { ...prev, sessionCount: prev.sessionCount + 1 };
      saveLeitner(subjectKey, next);
      return next;
    });
    setCurrent(0); setFlipped(false); setRatings({}); setDone(false);
  };

  const subjects = [...new Set(FLASHCARDS.map(f => f.subject))];

  if (done || cards.length === 0) {
    const knew  = Object.values(ratings).filter(r => r === "knew").length;
    const didnt = Object.values(ratings).filter(r => r === "didnt").length;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="page-header"><h1 className="page-title">🃏 Flashcard Result</h1></div>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{cards.length} cards reviewed</div>
          <div className="flex gap-4 justify-center mt-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center flex-1">
              <div className="text-2xl font-bold text-emerald-600">{knew}</div>
              <div className="text-xs text-gray-500 mt-1">Knew it ✓</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center flex-1">
              <div className="text-2xl font-bold text-red-600">{didnt}</div>
              <div className="text-xs text-gray-500 mt-1">Didn't Know</div>
            </div>
          </div>
          {didnt > 0 && <p className="text-xs text-amber-600 mt-4">Tip: Review the {didnt} cards you didn't know again.</p>}
          {/* Leitner box summary */}
          <p className="text-xs text-gray-400 mt-3">
            Progress — Box 1: {leitner.box1.length} · Box 2: {leitner.box2.length} · Box 3 (mastered): {leitner.box3.length}
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={restart} className="flex-1 btn-ghost border border-gray-200 justify-center">Next Session</button>
            <Link to="/dashboard" className="flex-1 btn-primary justify-center">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🃏 Flashcard Mode</h1>
          <p className="page-subtitle">Click the card to reveal the answer</p>
        </div>
        <Link to="/dashboard" className="btn-ghost border border-gray-200 text-sm">← Exit</Link>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...subjects].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === s ? "bg-primary-600 text-white border-primary-600" : "bg-white border-gray-200 text-gray-600 hover:border-primary-300"}`}>
            {s === "all" ? "All Subjects" : s}
          </button>
        ))}
      </div>

      {/* Leitner progress hint */}
      <p className="text-xs text-gray-400">
        Session {leitner.sessionCount + 1} · Due today: {cards.length} cards
        {leitner.box3.length > 0 && ` · ${leitner.box3.length} mastered`}
      </p>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Card {current + 1} of {cards.length}</span>
          <span className="text-emerald-600">{Object.values(ratings).filter(r => r === "knew").length} knew · {Object.values(ratings).filter(r => r === "didnt").length} didn't</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(current / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className="cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: "1000px" }}>
        <div style={{ transition: "transform 0.5s", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", position: "relative", height: "280px" }}>
          {/* Front */}
          <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
            className="card p-8 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <span className="badge badge-info mb-4">{card.subject}</span>
            <p className="text-lg font-bold text-gray-900 leading-relaxed">{card.front}</p>
            <p className="text-xs text-gray-400 mt-4">Tap to reveal answer</p>
          </div>
          {/* Back */}
          <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
            className="card p-8 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <p className="text-base text-gray-800 leading-relaxed mb-3">{card.back}</p>
            {card.source && <p className="text-xs text-primary-500">📖 {card.source}</p>}
          </div>
        </div>
      </div>

      {/* Rating buttons — only after flip */}
      {flipped ? (
        <div className="flex gap-3">
          <button onClick={() => handleRate("didnt")} className="flex-1 py-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-all">
            ✗ Didn't Know
          </button>
          <button onClick={() => handleRate("knew")} className="flex-1 py-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-all">
            ✓ Knew It
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button disabled={current === 0} onClick={() => { setCurrent(c => c - 1); setFlipped(false); }} className="btn-ghost border border-gray-200 disabled:opacity-40">← Prev</button>
          <button onClick={() => setFlipped(true)} className="flex-1 btn-primary justify-center">Reveal Answer</button>
        </div>
      )}
    </div>
  );
}
