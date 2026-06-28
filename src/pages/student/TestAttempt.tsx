import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { testService, flattenTestQuestions, type TestQuestion, type Test } from "../../services/testService";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { getAccessToken } from "../../lib/api";
import {
  connectToLiveTest, disconnectLiveTest,
  onTestEnded, onTimeSync, onTimeWarning, onForceSubmit,
} from "../../lib/liveSocket";
import LiveLeaderboard from "../../components/live/LiveLeaderboard";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DEMO_MODE } from "@/lib/demoMode";


const DEMO_TEST: Test = {
  id: "demo-test",
  titleEn: "MPSC Rajyaseva Demo Mock Test",
  titleMr: "एमपीएससी राज्यसेवा डेमो मॉक टेस्ट",
  duration: 30,
  totalMarks: 10,
  passingPct: 50,
  negativeMarking: true,
  sections: [{
    id: "s1",
    titleEn: "General Studies",
    subject: { nameEn: "General Studies" },
    questions: [
      { orderIndex:1, marks:1, negativeMarks:0.33, question:{ id:"dq1", textEn:"Which Article of the Indian Constitution abolishes untouchability?", textMr:"भारतीय राज्यघटनेतील कोणते कलम अस्पृश्यता नष्ट करते?", type:"SINGLE", orderIndex:1, marks:1, negativeMarks:0.33, subject:{ nameEn:"Political Science" }, explanationEn:"Article 17 abolishes untouchability in all its forms.", options:[{id:"dq1a",textEn:"Article 14",textMr:"अनुच्छेद १४",orderIndex:1,isCorrect:false},{id:"dq1b",textEn:"Article 17",textMr:"अनुच्छेद १७",orderIndex:2,isCorrect:true},{id:"dq1c",textEn:"Article 21",textMr:"अनुच्छेद २१",orderIndex:3,isCorrect:false},{id:"dq1d",textEn:"Article 23",textMr:"अनुच्छेद २३",orderIndex:4,isCorrect:false}]}},
      { orderIndex:2, marks:1, negativeMarks:0.33, question:{ id:"dq2", textEn:"The Chipko Movement of 1973 was related to which state?", textMr:"1973 चळवळ कोणत्या राज्याशी संबंधित होती?", type:"SINGLE", orderIndex:2, marks:1, negativeMarks:0.33, subject:{ nameEn:"History" }, explanationEn:"The Chipko Movement started in 1973 in Chamoli district of Uttarakhand.", options:[{id:"dq2a",textEn:"Himachal Pradesh",textMr:"हिमाचल प्रदेश",orderIndex:1,isCorrect:false},{id:"dq2b",textEn:"Kerala",textMr:"केरळ",orderIndex:2,isCorrect:false},{id:"dq2c",textEn:"Uttarakhand",textMr:"उत्तराखंड",orderIndex:3,isCorrect:true},{id:"dq2d",textEn:"Rajasthan",textMr:"राजस्थान",orderIndex:4,isCorrect:false}]}},
      { orderIndex:3, marks:1, negativeMarks:0.33, question:{ id:"dq3", textEn:"What is the chemical formula of baking soda?", textMr:"बेकिंग सोड्याचे रासायनिक सूत्र काय आहे?", type:"SINGLE", orderIndex:3, marks:1, negativeMarks:0.33, subject:{ nameEn:"Science" }, explanationEn:"Baking soda is sodium bicarbonate (NaHCO₃).", options:[{id:"dq3a",textEn:"Na₂CO₃",textMr:"Na₂CO₃",orderIndex:1,isCorrect:false},{id:"dq3b",textEn:"NaHCO₃",textMr:"NaHCO₃",orderIndex:2,isCorrect:true},{id:"dq3c",textEn:"NaCl",textMr:"NaCl",orderIndex:3,isCorrect:false},{id:"dq3d",textEn:"NaOH",textMr:"NaOH",orderIndex:4,isCorrect:false}]}},
      { orderIndex:4, marks:1, negativeMarks:0.33, question:{ id:"dq4", textEn:"Who wrote the book 'Discovery of India'?", textMr:"'भारताचा शोध' हे पुस्तक कोणी लिहिले?", type:"SINGLE", orderIndex:4, marks:1, negativeMarks:0.33, subject:{ nameEn:"History" }, explanationEn:"'The Discovery of India' was written by Jawaharlal Nehru in 1946.", options:[{id:"dq4a",textEn:"Mahatma Gandhi",textMr:"महात्मा गांधी",orderIndex:1,isCorrect:false},{id:"dq4b",textEn:"B. R. Ambedkar",textMr:"डॉ. बाबासाहेब आंबेडकर",orderIndex:2,isCorrect:false},{id:"dq4c",textEn:"Jawaharlal Nehru",textMr:"जवाहरलाल नेहरू",orderIndex:3,isCorrect:true},{id:"dq4d",textEn:"Subhas Chandra Bose",textMr:"सुभाषचंद्र बोस",orderIndex:4,isCorrect:false}]}},
      { orderIndex:5, marks:1, negativeMarks:0.33, question:{ id:"dq5", textEn:"Which planet is known as the 'Red Planet'?", textMr:"कोणत्या ग्रहाला 'लाल ग्रह' म्हणतात?", type:"SINGLE", orderIndex:5, marks:1, negativeMarks:0.33, subject:{ nameEn:"Science" }, explanationEn:"Mars is called the 'Red Planet' because of iron oxide on its surface.", options:[{id:"dq5a",textEn:"Venus",textMr:"शुक्र",orderIndex:1,isCorrect:false},{id:"dq5b",textEn:"Saturn",textMr:"शनि",orderIndex:2,isCorrect:false},{id:"dq5c",textEn:"Jupiter",textMr:"गुरू",orderIndex:3,isCorrect:false},{id:"dq5d",textEn:"Mars",textMr:"मंगळ",orderIndex:4,isCorrect:true}]}},
      { orderIndex:6, marks:1, negativeMarks:0.33, question:{ id:"dq6", textEn:"In which year did India get independence?", textMr:"भारताला स्वातंत्र्य कोणत्या वर्षी मिळाले?", type:"SINGLE", orderIndex:6, marks:1, negativeMarks:0.33, subject:{ nameEn:"History" }, explanationEn:"India gained independence on 15 August 1947.", options:[{id:"dq6a",textEn:"1945",textMr:"१९४५",orderIndex:1,isCorrect:false},{id:"dq6b",textEn:"1947",textMr:"१९४७",orderIndex:2,isCorrect:true},{id:"dq6c",textEn:"1950",textMr:"१९५०",orderIndex:3,isCorrect:false},{id:"dq6d",textEn:"1952",textMr:"१९५२",orderIndex:4,isCorrect:false}]}},
      { orderIndex:7, marks:1, negativeMarks:0.33, question:{ id:"dq7", textEn:"What is the capital of Australia?", textMr:"ऑस्ट्रेलियाची राजधानी कोणती आहे?", type:"SINGLE", orderIndex:7, marks:1, negativeMarks:0.33, subject:{ nameEn:"Geography" }, explanationEn:"Canberra is the capital of Australia.", options:[{id:"dq7a",textEn:"Sydney",textMr:"सिडनी",orderIndex:1,isCorrect:false},{id:"dq7b",textEn:"Melbourne",textMr:"मेलबर्न",orderIndex:2,isCorrect:false},{id:"dq7c",textEn:"Canberra",textMr:"कॅनबेरा",orderIndex:3,isCorrect:true},{id:"dq7d",textEn:"Brisbane",textMr:"ब्रिस्बेन",orderIndex:4,isCorrect:false}]}},
      { orderIndex:8, marks:1, negativeMarks:0.33, question:{ id:"dq8", textEn:"Article 370 revoked in 2019 was related to which region?", textMr:"2019 मध्ये रद्द केलेले कलम 370 कोणत्या राज्याशी संबंधित होते?", type:"SINGLE", orderIndex:8, marks:1, negativeMarks:0.33, subject:{ nameEn:"Political Science" }, explanationEn:"Article 370 granted special status to Jammu & Kashmir, revoked on 5 August 2019.", options:[{id:"dq8a",textEn:"Himachal Pradesh",textMr:"हिमाचल प्रदेश",orderIndex:1,isCorrect:false},{id:"dq8b",textEn:"Uttarakhand",textMr:"उत्तराखंड",orderIndex:2,isCorrect:false},{id:"dq8c",textEn:"Jammu & Kashmir",textMr:"जम्मू आणि काश्मीर",orderIndex:3,isCorrect:true},{id:"dq8d",textEn:"Sikkim",textMr:"सिक्कीम",orderIndex:4,isCorrect:false}]}},
      { orderIndex:9, marks:1, negativeMarks:0.33, question:{ id:"dq9", textEn:"Which is the longest river in the world?", textMr:"जगातील सर्वात लांब नदी कोणती आहे?", type:"SINGLE", orderIndex:9, marks:1, negativeMarks:0.33, subject:{ nameEn:"Geography" }, explanationEn:"The Nile (6,650 km) is generally considered the longest river in the world.", options:[{id:"dq9a",textEn:"Amazon",textMr:"अमेझॉन",orderIndex:1,isCorrect:false},{id:"dq9b",textEn:"Nile",textMr:"नाईल",orderIndex:2,isCorrect:true},{id:"dq9c",textEn:"Yangtze",textMr:"यांग्त्से",orderIndex:3,isCorrect:false},{id:"dq9d",textEn:"Mississippi",textMr:"मिसिसिपी",orderIndex:4,isCorrect:false}]}},
      { orderIndex:10, marks:1, negativeMarks:0.33, question:{ id:"dq10", textEn:"Who composed the Indian National Anthem?", textMr:"भारताचे राष्ट्रगीत कोणी रचले?", type:"SINGLE", orderIndex:10, marks:1, negativeMarks:0.33, subject:{ nameEn:"History" }, explanationEn:"'Jana Gana Mana' was composed by Rabindranath Tagore, adopted on 24 January 1950.", options:[{id:"dq10a",textEn:"Bankim Chandra Chattopadhyay",textMr:"बंकिमचंद्र चट्टोपाध्याय",orderIndex:1,isCorrect:false},{id:"dq10b",textEn:"Rabindranath Tagore",textMr:"रबींद्रनाथ टागोर",orderIndex:2,isCorrect:true},{id:"dq10c",textEn:"Sarojini Naidu",textMr:"सरोजिनी नायडू",orderIndex:3,isCorrect:false},{id:"dq10d",textEn:"Subramanya Bharati",textMr:"सुब्रमण्य भारती",orderIndex:4,isCorrect:false}]}},
    ],
  }],
};

type Status = "not-visited" | "answered" | "skipped" | "review";

export default function TestAttempt() {
  const { testId } = useParams<{ testId: string }>();
  const navigate    = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isGuestMode = !isAuthenticated && !DEMO_MODE && !authLoading;

  // ── Load state ──────────────────────────────────────────────────────────────
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg,  setErrorMsg]  = useState("");

  // ── Test data ────────────────────────────────────────────────────────────────
  const [questions,     setQuestions]     = useState<TestQuestion[]>([]);
  const [testSections,  setTestSections]  = useState<Array<{ titleEn: string; questionIds: string[] }>>([]);
  const [testTitle,     setTestTitle]     = useState("");
  const [duration,      setDuration]      = useState(30 * 60); // seconds
  const attemptIdRef                      = useRef<string>("");

  // ── Exam state ───────────────────────────────────────────────────────────────
  const [current,    setCurrent]    = useState(0);
  const [lang,       setLang]       = useState<"en" | "mr">("mr");
  const [responses,  setResponses]  = useState<Record<string, string[]>>({}); // questionId → selected optionIds
  const [status,     setStatus]     = useState<Record<string, Status>>({}); // questionId → status
  const [bookmarks,  setBookmarks]  = useState<Set<string>>(new Set());
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [timePerQ,   setTimePerQ]   = useState<Record<string, number>>({});
  const [showSubmit,    setShowSubmit]    = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [isLiveTest,    setIsLiveTest]    = useState(false);
  const [saveStatus,    setSaveStatus]    = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const saveFailCountRef = useRef(0);

  const qStartRef       = useRef<number>(Date.now());
  const autoSaveRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtRef       = useRef<number | null>(null);
  const tabSwitchesRef  = useRef(0);

  // ── Guard: redirect if already submitted ────────────────────────────────────
  useEffect(() => {
    const storedAttemptId = localStorage.getItem(`attemptId_${testId}`);
    if (localStorage.getItem(`submittedTest_${testId}`) && storedAttemptId) {
      navigate(`/test/${testId}/result/${storedAttemptId}`, { replace: true });
    }
  }, [testId, navigate]);

  // ── Block browser back button (only while an attempt is actually in progress —
  // otherwise a candidate stuck on the login-required/already-completed/error
  // screens above can't navigate away) ─────────────────────────────────────────
  useEffect(() => {
    if (loadState !== "ready") return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loadState]);

  // ── Load test + start attempt ────────────────────────────────────────────────
  useEffect(() => {
    if (!testId) return;
    if (authLoading) return; // wait for auth state to resolve

    if (DEMO_MODE) {
      const qs = flattenTestQuestions(DEMO_TEST);
      setQuestions(qs);
      setTestSections(DEMO_TEST.sections.map(s => ({
        titleEn: s.titleEn,
        questionIds: s.questions.map(tq => tq.question.id),
      })));
      setTestTitle(DEMO_TEST.titleEn);
      setDuration(DEMO_TEST.duration * 60);
      setTimeLeft(DEMO_TEST.duration * 60);
      attemptIdRef.current = "demo-attempt";
      localStorage.setItem(`attemptId_${testId}`, "demo-attempt");
      setStatus(Object.fromEntries(qs.map(q => [q.id, "not-visited"])));
      setLoadState("ready");
      return;
    }

    (async () => {
      try {
        if (isGuestMode) {
          // Guest mode: load test without starting a server-side attempt
          const test = await testService.getTest(testId);
          const qs = flattenTestQuestions(test);
          setQuestions(qs);
          setTestSections((test.sections ?? []).map((s: any) => ({
            titleEn: s.titleEn,
            questionIds: (s.questions ?? []).map((tq: any) => tq.question?.id ?? tq.id),
          })));
          setTestTitle(test.titleEn);
          setDuration(test.duration * 60);
          setTimeLeft(test.duration * 60);
          attemptIdRef.current = "guest-attempt";
          localStorage.setItem(`attemptId_${testId}`, "guest-attempt");
          setStatus(Object.fromEntries(qs.map(q => [q.id, "not-visited"])));
          setLoadState("ready");
          return;
        }

        const [test, attempt] = await Promise.all([
          testService.getTest(testId),
          testService.startAttempt(testId),
        ]);

        const qs = flattenTestQuestions(test);
        setQuestions(qs);
        setTestSections((test.sections ?? []).map((s: any) => ({
          titleEn: s.titleEn,
          questionIds: (s.questions ?? []).map((tq: any) => tq.question?.id ?? tq.id),
        })));
        setTestTitle(test.titleEn);
        const isLive = (test as any).status === "live";
        setIsLiveTest(isLive);
        if (isLive && (test as any).endsAt) {
          const endsAt = new Date((test as any).endsAt).getTime();
          endsAtRef.current = endsAt;
          const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
          setDuration(remaining);
          setTimeLeft(remaining);
        } else {
          setDuration(test.duration * 60);
          setTimeLeft(test.duration * 60);
        }
        attemptIdRef.current = attempt.id;

        // Persist attemptId so back-navigation guard can redirect properly
        localStorage.setItem(`attemptId_${testId}`, attempt.id);

        // If resuming, mark all previously not-visited questions
        setStatus(Object.fromEntries(qs.map(q => [q.id, "not-visited"])));
        setLoadState("ready");
      } catch (e: any) {
        if (e.status === 401 || e.status === 403) {
          setErrorMsg("loginRequired");
        } else if (e.code === "RETAKE_LIMIT_REACHED") {
          setErrorMsg("alreadyCompleted");
        } else if (e.status === 402 || e.code === "PAYMENT_REQUIRED") {
          setErrorMsg("subscriptionRequired");
        } else {
          setErrorMsg(e.message ?? "Failed to load test. Please try again.");
        }
        setLoadState("error");
      }
    })();
  }, [testId, isGuestMode, authLoading]);

  // ── Live test socket connection ──────────────────────────────────────────────
  useEffect(() => {
    if (loadState !== "ready" || isGuestMode || DEMO_MODE || !testId || !isLiveTest) return;
    const token = getAccessToken() ?? undefined;
    connectToLiveTest(testId, token);

    const offEnded = onTestEnded(() => {
      toast("⏱ Time's up! Auto-submitting…", { icon: "🔴" });
      handleSubmit(true);
    });

    const offForceSubmit = onForceSubmit(({ reason }) => {
      toast.error(`Your test was ended by the administrator: ${reason}`, { duration: 6000 });
      handleSubmit(true);
    });

    const offSync = onTimeSync(({ serverTime, endsAt }) => {
      endsAtRef.current = endsAt;
      const remaining = Math.max(0, Math.floor((endsAt - serverTime) / 1000));
      setTimeLeft(remaining);
    });

    const offWarn = onTimeWarning(({ minutesLeft }) => {
      toast(`⏰ ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""} remaining!`, {
        duration: 4000,
        icon: minutesLeft <= 5 ? "🚨" : "⏳",
      });
    });

    return () => {
      offEnded(); offForceSubmit(); offSync(); offWarn();
      disconnectLiveTest(testId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, isLiveTest, testId]);

  // ── Track tab/window switches + fullscreen exits (integrity signal for live tests) ──
  // Both count toward the same browserTabSwitches counter — admins see one
  // combined "integrity violations" number on the live monitor rather than
  // two separate, easily-confused counters.
  useEffect(() => {
    if (loadState !== "ready" || isGuestMode || DEMO_MODE || !isLiveTest) return;

    // Best-effort: browsers require a user gesture for this, which a route
    // navigation from a button click usually still counts as; if it's
    // rejected, the test still proceeds — fullscreen is enforced, not required.
    document.documentElement.requestFullscreen?.().catch(() => {});

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") tabSwitchesRef.current += 1;
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) tabSwitchesRef.current += 1;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [loadState, isGuestMode, isLiveTest]);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadState !== "ready") return;
    const timer = setInterval(() => {
      // If live test with server endsAt, sync from server reference
      if (isLiveTest && endsAtRef.current) {
        const remaining = Math.max(0, Math.floor((endsAtRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) { clearInterval(timer); handleSubmit(true); }
        return;
      }
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, isLiveTest]);

  // ── Auto-save every 30 seconds ───────────────────────────────────────────────
  const buildPayload = useCallback((
    currentResponses: Record<string, string[]>,
    currentStatus: Record<string, Status>,
    currentTimePerQ: Record<string, number>,
    currentQuestions: TestQuestion[],
  ) => {
    return currentQuestions.map(q => ({
      questionId:        q.id,
      selectedOptionIds: currentResponses[q.id] ?? [],
      isMarkedForReview: currentStatus[q.id] === "review",
      timeSpent:         currentTimePerQ[q.id] ?? 0,
    }));
  }, []);

  useEffect(() => {
    if (loadState !== "ready") return;
    autoSaveRef.current = setInterval(async () => {
      if (DEMO_MODE || isGuestMode || !attemptIdRef.current || !testId) return;
      setSaveStatus("saving");
      const payload = buildPayload(responses, status, timePerQ, questions);
      try {
        await testService.saveResponses(testId, attemptIdRef.current, payload, isLiveTest ? tabSwitchesRef.current : undefined);
        saveFailCountRef.current = 0;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        saveFailCountRef.current++;
        setSaveStatus("failed");
      }
    }, 30_000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, responses, status, timePerQ, questions]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const switchTo = (next: number) => {
    const q = questions[current];
    if (!q) return;
    const elapsed = Math.round((Date.now() - qStartRef.current) / 1000);
    setTimePerQ(prev => ({ ...prev, [q.id]: (prev[q.id] ?? 0) + elapsed }));
    qStartRef.current = Date.now();
    setCurrent(next);
  };

  const selectOption = (optId: string) => {
    const q = questions[current];
    if (!q) return;
    const qId = q.id;
    if (q.type === "MULTI_SELECT") {
      const prev = responses[qId] ?? [];
      const next = prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId];
      setResponses(r => ({ ...r, [qId]: next }));
      setStatus(s => ({ ...s, [qId]: next.length > 0 ? "answered" : "skipped" }));
    } else {
      setResponses(r => ({ ...r, [qId]: [optId] }));
      setStatus(s  => ({ ...s, [qId]: "answered" }));
    }
  };

  const markReview = () => {
    const qId = questions[current]?.id;
    if (!qId) return;
    setStatus(s => ({ ...s, [qId]: "review" }));
    if (current < questions.length - 1) switchTo(current + 1);
  };

  const clearResponse = () => {
    const qId = questions[current]?.id;
    if (!qId) return;
    setStatus(s  => ({ ...s, [qId]: "skipped" }));
    setResponses(r => { const n = { ...r }; delete n[qId]; return n; });
  };

  const toggleBookmark = (qId: string) => {
    const isBookmarked = bookmarks.has(qId);
    setBookmarks(b => {
      const next = new Set(b);
      if (isBookmarked) next.delete(qId); else next.add(qId);
      return next;
    });
    if (DEMO_MODE || isGuestMode) return;
    if (isBookmarked) userService.removeBookmark(qId).catch(console.error);
    else              userService.addBookmark(qId).catch(console.error);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (_autoSubmit = false) => {
    if (submitting || !testId || !attemptIdRef.current) return;
    setSubmitting(true);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

    const q = questions[current];
    const elapsed = q ? Math.round((Date.now() - qStartRef.current) / 1000) : 0;
    const finalTimePerQ = q
      ? { ...timePerQ, [q.id]: (timePerQ[q.id] ?? 0) + elapsed }
      : timePerQ;

    if (isGuestMode) {
      try {
        const payload = buildPayload(responses, status, finalTimePerQ, questions);
        const result = await testService.guestSubmit(testId, payload);
        sessionStorage.setItem(`guestResult_${testId}`, JSON.stringify(result));
        localStorage.setItem(`submittedTest_${testId}`, "true");
        localStorage.setItem(`attemptId_${testId}`, "guest-attempt");
        navigate(`/test/${testId}/result/guest-attempt`, { replace: true });
      } catch (e: any) {
        setSubmitting(false);
        setShowSubmit(false);
        toast.error(e.message ?? "Submission failed. Please try again.");
      }
      return;
    }

    if (DEMO_MODE) {
      const isFullyCorrect = (ql: TestQuestion) => {
        const sel = responses[ql.id] ?? [];
        if (sel.length === 0) return false;
        const correctIds = ql.options.filter(o => o.isCorrect).map(o => o.id);
        return sel.length === correctIds.length && sel.every(id => correctIds.includes(id));
      };
      const skipped   = questions.filter(ql => (responses[ql.id] ?? []).length === 0).length;
      const correct   = questions.filter(ql => isFullyCorrect(ql)).length;
      const incorrect = questions.length - correct - skipped;
      const score     = Math.max(0, correct * 1 - incorrect * 0.33);
      const maxScore  = questions.length;
      const elapsed = DEMO_TEST.duration * 60 - timeLeft;
      const demoResult = {
        id: "demo-result", attemptId: "demo-attempt", testId,
        correct, incorrect, skipped,
        score, maxScore, percentage: (score / maxScore) * 100,
        timeTaken: elapsed,
        isPassed: (score / maxScore) * 100 >= 50,
        subjectResults: [],
        test: { titleEn: testTitle, passingPct: 50 },
        attempt: {
          startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
          submittedAt: new Date().toISOString(),
          responses: questions.map(ql => ({
            questionId: ql.id,
            selectedOptionIds: responses[ql.id] ?? [],
            isMarkedForReview: status[ql.id] === "review",
            isSkipped: (responses[ql.id] ?? []).length === 0,
            isCorrect: isFullyCorrect(ql),
            timeSpent: finalTimePerQ[ql.id] ?? 0,
            question: { id: ql.id, textEn: ql.textEn, textMr: ql.textMr, explanationEn: ql.explanationEn, subject: ql.subject, options: ql.options },
          })),
        },
      };
      localStorage.setItem(`demoResult_${testId}_demo-attempt`, JSON.stringify(demoResult));
      localStorage.setItem(`submittedTest_${testId}`, "true");
      localStorage.setItem(`attemptId_${testId}`, "demo-attempt");
      navigate(`/test/${testId}/result/demo-attempt`, { replace: true });
      return;
    }

    try {
      // Final save then submit
      const payload = buildPayload(responses, status, finalTimePerQ, questions);
      await testService.saveResponses(testId, attemptIdRef.current, payload);
      const result = await testService.submitTest(testId, attemptIdRef.current);

      localStorage.setItem(`submittedTest_${testId}`, "true");
      navigate(`/test/${testId}/result/${result.attemptId}`, { replace: true });
    } catch (e: any) {
      setSubmitting(false);
      setShowSubmit(false);
      toast.error(e.message ?? "Submission failed. Please try again.");
    }
  };

  // ── Palette helpers ──────────────────────────────────────────────────────────
  const paletteBg = (i: number) => {
    const q = questions[i];
    if (!q) return "bg-gray-100 text-gray-600";
    const s = status[q.id];
    if (i === current) return "ring-2 ring-primary-500 bg-white font-bold";
    if (s === "answered") return "bg-emerald-500 text-white";
    if (s === "review")   return "bg-primary-500 text-white";
    if (s === "skipped")  return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const timePct = duration > 0 ? (timeLeft / duration) * 100 : 100;
  const timerTone =
    timePct <= 10 ? "bg-red-500 text-white animate-pulse"
    : timePct <= 25 ? "bg-amber-500 text-white"
    : "bg-white/20 text-white";

  const answeredCount   = Object.values(status).filter(s => s === "answered").length;
  const reviewCount     = Object.values(status).filter(s => s === "review").length;
  const skippedCount    = Object.values(status).filter(s => s === "skipped").length;
  const notVisited      = questions.length - Object.values(status).filter(s => s !== "not-visited").length;
  const unansweredCount = questions.length - answeredCount;
  const WARN_THRESHOLD  = Math.max(3, Math.ceil(questions.length * 0.2));
  const showUnansweredWarning = unansweredCount >= WARN_THRESHOLD;

  const q          = questions[current];
  const isBookmark = q ? bookmarks.has(q.id) : false;

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="exam-container flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading test...</p>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    if (errorMsg === "loginRequired") {
      return (
        <div className="exam-container flex items-center justify-center bg-white">
          <div className="text-center max-w-sm p-8">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-500 text-sm mb-6">Please login to access this test.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/auth/login" className="btn-primary">Login</Link>
              <Link to="/auth/register" className="btn-ghost border border-gray-200">Register Free</Link>
            </div>
          </div>
        </div>
      );
    }
    if (errorMsg === "alreadyCompleted") {
      return (
        <div className="exam-container flex items-center justify-center bg-white">
          <div className="text-center max-w-sm p-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Test Already Completed</h2>
            <p className="text-gray-500 text-sm mb-6">You've already submitted this test and have no retake attempts remaining.</p>
            <Link to="/dashboard/my-tests" className="btn-primary">Go to My Tests</Link>
          </div>
        </div>
      );
    }
    if (errorMsg === "subscriptionRequired") {
      return (
        <div className="exam-container flex items-center justify-center bg-white">
          <div className="text-center max-w-sm p-8">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
            <p className="text-gray-500 text-sm mb-6">This test is part of a premium series. Upgrade your plan to unlock it.</p>
            <Link to={`/dashboard/subscription?returnTo=/test/${testId}/instructions`} className="btn-primary">View Plans</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="exam-container flex items-center justify-center bg-white">
        <div className="text-center max-w-sm p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Test</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-container flex flex-col bg-white">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-primary-100 flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#1e1b4b 0%,#6d28d9 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-white text-sm hidden sm:inline truncate max-w-xs">{testTitle || "MPSC Sadhak"}</span>
          {isLiveTest && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-save indicator */}
          {saveStatus !== "idle" && (
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
              saveStatus === "saving" ? "bg-white/20 text-white/70"
              : saveStatus === "saved" ? "bg-emerald-500/30 text-emerald-200"
              : "bg-red-500/30 text-red-200"
            }`}>
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "⚠ Save failed"}
            </span>
          )}

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button onClick={() => setLang("mr")} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${lang==="mr"?"bg-primary-500 text-white":"text-gray-500 hover:text-gray-700"}`}>मराठी</button>
            <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${lang==="en"?"bg-primary-500 text-white":"text-gray-500 hover:text-gray-700"}`}>English</button>
          </div>

          {/* Fullscreen toggle */}
          <button
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
              } else {
                document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
              }
            }}
            className="text-white/70 hover:text-white transition-colors text-sm px-1.5"
          >
            {isFullscreen ? "⊡" : "⛶"}
          </button>

          <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-sm transition-colors ${timerTone}`}>
            ⏱️ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
          <button onClick={() => setShowSubmit(true)} disabled={submitting} className="btn-primary text-sm py-1.5">
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </div>

      {/* ── Live leaderboard panel ── */}
      {isLiveTest && !isGuestMode && !DEMO_MODE && (
        <LiveLeaderboard userName={user?.name} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Question area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{answeredCount} of {questions.length} answered</span>
              <span className="font-semibold text-primary-600">{Math.round((answeredCount / Math.max(questions.length,1)) * 100)}% complete</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(answeredCount / Math.max(questions.length,1)) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {q && (
            <div className="max-w-3xl mx-auto">
              {/* Meta row */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-semibold">
                  Question {current+1} of {questions.length}
                </span>
                {q.subject && <span className="badge badge-info">{q.subject.nameEn}</span>}
                <span className="text-xs text-gray-400">+{q.marks} mark · −{q.negativeMarks} negative</span>
                <button
                  onClick={() => toggleBookmark(q.id)}
                  className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    isBookmark ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"
                  }`}
                >
                  {isBookmark ? "🔖 Bookmarked" : "🔖 Bookmark"}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {lang==="en"?"🇬🇧 Showing in English":"🇮🇳 मराठीत दाखवत आहे"}
                </span>
              </div>

              <h2 className={`text-lg font-semibold text-gray-900 mb-6 leading-relaxed ${lang==="mr"?"font-marathi":""}`}>
                {lang==="en" ? q.textEn : q.textMr}
              </h2>

              {q.type === "MULTI_SELECT" && (
                <p className="text-xs text-primary-600 font-semibold mb-2">Select all that apply</p>
              )}

              {/* Options */}
              <div className="space-y-3">
                {q.options.map(opt => {
                  const isSelected = (responses[q.id] ?? []).includes(opt.id);
                  return (
                  <button key={opt.id} onClick={() => selectOption(opt.id)}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-800"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      q.type === "MULTI_SELECT" ? "rounded-md" : "rounded-lg"
                    } ${
                      isSelected ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {String.fromCharCode(65 + q.options.indexOf(opt))}
                    </div>
                    <span className={lang==="mr"?"font-marathi":""}>{lang==="en" ? opt.textEn : opt.textMr}</span>
                  </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center mt-8">
                <div className="flex items-center gap-4">
                  <button disabled={current===0} onClick={() => switchTo(current-1)} className="btn-ghost border border-gray-200 disabled:opacity-40">← Previous</button>
                  <button onClick={markReview} className="btn-ghost border border-purple-300 text-purple-600 hover:bg-primary-50">🔖 Mark for Review</button>
                  <button onClick={clearResponse} className="btn-ghost border border-gray-200">Clear Response</button>
                </div>
                <button disabled={current===questions.length-1} onClick={() => switchTo(current+1)} className="btn-primary ml-auto disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ── Question Palette ── */}
        <div className="w-64 border-l border-gray-200 p-5 overflow-y-auto flex-shrink-0 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Question Palette</h3>

          <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
            {[
              {color:"bg-emerald-500",label:"Answered"},
              {color:"bg-red-100 border border-red-200",label:"Skipped"},
              {color:"bg-primary-500",label:"For Review"},
              {color:"bg-gray-100",label:"Not Visited"},
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${l.color}`} />
                <span className="text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Jump to first unanswered */}
          <button
            onClick={() => {
              const idx = questions.findIndex(q => status[q.id] !== "answered");
              if (idx >= 0) switchTo(idx);
            }}
            className="w-full mb-3 text-[11px] font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-xl py-1.5 hover:bg-primary-100 transition-colors"
          >
            → Jump to first unanswered
          </button>

          {/* Section-grouped palette */}
          {testSections.length > 1 ? (
            testSections.map((section, si) => {
              const sectionQs = section.questionIds
                .map(id => questions.findIndex(q => q.id === id))
                .filter(i => i >= 0);
              if (sectionQs.length === 0) return null;
              return (
                <div key={si} className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{section.titleEn}</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {sectionQs.map(i => {
                      const ql = questions[i];
                      return (
                        <button key={ql.id} onClick={() => switchTo(i)}
                          className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-all relative ${paletteBg(i)}`}>
                          {i + 1}
                          {bookmarks.has(ql.id) && <span className="absolute -top-1 -right-1 text-amber-500 text-[9px]">🔖</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-5 gap-2 mb-5">
              {questions.map((ql, i) => (
                <button key={ql.id} onClick={() => switchTo(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all relative ${paletteBg(i)}`}>
                  {i + 1}
                  {bookmarks.has(ql.id) && <span className="absolute -top-1 -right-1 text-amber-500 text-xs">🔖</span>}
                </button>
              ))}
            </div>
          )}

          {bookmarks.size > 0 && (
            <div className="mb-4 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <span className="text-amber-700 font-semibold">🔖 {bookmarks.size} bookmarked</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1.5">
            <div className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Answered</span><strong>{answeredCount}</strong></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary-500 rounded-full" />For Review</span><strong>{reviewCount}</strong></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-200 rounded-full" />Skipped</span><strong>{skippedCount}</strong></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full" />Not Visited</span><strong>{notVisited}</strong></div>
          </div>

          <button onClick={() => setShowSubmit(true)} disabled={submitting} className="btn-primary w-full justify-center mt-5 text-sm">
            🏁 Submit Test
          </button>
        </div>
      </div>

      {/* Submit confirmation */}
      <ConfirmDialog
        open={showSubmit}
        title={showUnansweredWarning ? "Are you sure?" : "Submit Test?"}
        message={
          <div className="space-y-2">
            <p>
              <strong className="text-gray-700">{answeredCount}</strong> answered ·{" "}
              <strong className="text-gray-700">{unansweredCount}</strong> unanswered ·{" "}
              <strong className="text-gray-700">{reviewCount}</strong> for review
            </p>
            <p>
              ⏱️ Time remaining:{" "}
              <strong className="text-gray-700">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</strong>
            </p>
            {showUnansweredWarning && (
              <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}.
                Unanswered questions count as incorrect.
              </p>
            )}
            {bookmarks.size > 0 && (
              <p className="text-xs text-amber-600">🔖 {bookmarks.size} bookmarked question(s) saved.</p>
            )}
            <p className="text-xs text-gray-400">You cannot go back after submitting.</p>
          </div>
        }
        confirmLabel={showUnansweredWarning ? "Submit Anyway" : "Submit ✓"}
        cancelLabel={showUnansweredWarning ? "Go Back" : "Cancel"}
        tone={showUnansweredWarning ? "danger" : "default"}
        isLoading={submitting}
        onConfirm={() => handleSubmit(false)}
        onCancel={() => setShowSubmit(false)}
      />
    </div>
  );
}
