import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  ShieldCheck,
  Award,
  Zap,
  BarChart3,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import { toast } from 'sonner';
import RadarChart, { TraitScore } from '../components/RadarChart';

interface Question {
  id: number;
  type: 'likert' | 'mcq';
  trait: 'logical' | 'detail' | 'persistence' | 'learning' | 'architecture';
  traitName: string;
  category: string;
  question: string;
  options?: { label: string; value: string; isCorrect?: boolean }[];
}

const QUESTIONS: Question[] = [
  // ── 5 Likert Scale Questions ──────────────────────────────────────────────
  {
    id: 1,
    type: 'likert',
    trait: 'logical',
    traitName: 'Logical Reasoning',
    category: 'Psychometric Profile',
    question: 'When approaching a complex problem, I systematically break down edge cases and inputs before writing code.',
  },
  {
    id: 2,
    type: 'likert',
    trait: 'detail',
    traitName: 'Attention to Detail',
    category: 'Psychometric Profile',
    question: 'I thoroughly review memory bounds, null checks, and boundary conditions during software development.',
  },
  {
    id: 3,
    type: 'likert',
    trait: 'persistence',
    traitName: 'Persistence & Resilience',
    category: 'Psychometric Profile',
    question: 'When facing difficult algorithmic bugs or test failures, I systematically debug without losing momentum.',
  },
  {
    id: 4,
    type: 'likert',
    trait: 'learning',
    traitName: 'Learning Speed & Agility',
    category: 'Psychometric Profile',
    question: 'I rapidly absorb new API specifications, design patterns, and architectural frameworks in fast-paced projects.',
  },
  {
    id: 5,
    type: 'likert',
    trait: 'architecture',
    traitName: 'System Architecture',
    category: 'Psychometric Profile',
    question: 'I prioritize clean code separation, modular abstractions, and standard formatting over quick hacky fixes.',
  },

  // ── 5 Timed MCQ Questions ──────────────────────────────────────────────────
  {
    id: 6,
    type: 'mcq',
    trait: 'logical',
    traitName: 'Logical Reasoning',
    category: 'Data Structures Aptitude',
    question: 'What is the worst-case time complexity of searching for an element in a Balanced Binary Search Tree (Red-Black / AVL)?',
    options: [
      { label: 'O(1)', value: 'A' },
      { label: 'O(log N)', value: 'B', isCorrect: true },
      { label: 'O(N)', value: 'C' },
      { label: 'O(N log N)', value: 'D' },
    ],
  },
  {
    id: 7,
    type: 'mcq',
    trait: 'detail',
    traitName: 'Attention to Detail',
    category: 'Algorithmic Execution',
    question: 'In a Hash Table with open addressing and linear probing, what sequence is probed when a collision occurs at index i?',
    options: [
      { label: 'Sequential index: (i + 1) mod M', value: 'A', isCorrect: true },
      { label: 'Quadratic step: (i + k^2) mod M', value: 'B' },
      { label: 'Resizes table instantly', value: 'C' },
      { label: 'Appends to a linked list chain', value: 'D' },
    ],
  },
  {
    id: 8,
    type: 'mcq',
    trait: 'persistence',
    traitName: 'Persistence & Resilience',
    category: 'Concurrency & OS',
    question: 'Which of the following is NOT one of Coffman’s four necessary conditions for multi-threaded deadlock?',
    options: [
      { label: 'Mutual Exclusion', value: 'A' },
      { label: 'Hold and Wait', value: 'B' },
      { label: 'Preemption of Resources', value: 'C', isCorrect: true },
      { label: 'Circular Wait', value: 'D' },
    ],
  },
  {
    id: 9,
    type: 'mcq',
    trait: 'learning',
    traitName: 'Learning Speed & Agility',
    category: 'Language Evaluation',
    question: 'What does [1, 2, 3].map(parseInt) evaluate to in JavaScript runtime?',
    options: [
      { label: '[1, 2, 3]', value: 'A' },
      { label: '[1, NaN, NaN]', value: 'B', isCorrect: true },
      { label: 'TypeError: invalid radix', value: 'C' },
      { label: '[1, 2, 0]', value: 'D' },
    ],
  },
  {
    id: 10,
    type: 'mcq',
    trait: 'architecture',
    traitName: 'System Architecture',
    category: 'System Design',
    question: 'Which caching strategy synchronously writes data to both cache and underlying database simultaneously before completing request?',
    options: [
      { label: 'Write-Through', value: 'A', isCorrect: true },
      { label: 'Write-Back (Write-Behind)', value: 'B' },
      { label: 'Cache-Aside', value: 'C' },
      { label: 'Refresh-Ahead', value: 'D' },
    ],
  },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const INITIAL_TIMER_SECONDS = 15 * 60; // 15 Minutes = 900 Seconds

export default function Assessment() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIMER_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Dynamic questions loaded from AI (or static fallback)
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [questionsSource, setQuestionsSource] = useState<'loading' | 'ai' | 'static'>('loading');

  // Dynamic AI Model Adapter State
  const [aiInterpretation, setAiInterpretation] = useState<{
    cognitiveAnalysis?: string;
    architecturalCraftsmanship?: string;
    careerRecommendation?: string;
  } | null>(null);
  const [aiProviderName, setAiProviderName] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 0. Load AI-generated questions on mount (fallback to static QUESTIONS)
  useEffect(() => {
    api.get('/students/assessment/questions')
      .then(res => {
        if (res.data?.questions && Array.isArray(res.data.questions)) {
          setQuestions(res.data.questions);
          setQuestionsSource(res.data.source === 'ai' ? 'ai' : 'static');
        } else {
          setQuestionsSource('static');
        }
      })
      .catch(() => {
        setQuestionsSource('static');
      });
  }, []);

  // 1. Restore answers & timer from sessionStorage on mount
  useEffect(() => {
    try {
      const savedAnswers = sessionStorage.getItem('talentforge_assessment_answers');
      const savedTime = sessionStorage.getItem('talentforge_assessment_time');
      const savedDone = sessionStorage.getItem('talentforge_assessment_done');

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
      if (savedTime) {
        const parsedTime = parseInt(savedTime, 10);
        if (!isNaN(parsedTime) && parsedTime > 0) {
          setTimeLeft(parsedTime);
        }
      }
      if (savedDone === 'true') {
        setIsCompleted(true);
      }
    } catch (e) {
      console.warn('Failed to load assessment state from sessionStorage:', e);
    }
  }, []);

  // 2. 15-Minute Countdown Timer logic
  useEffect(() => {
    if (isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sessionStorage.setItem('talentforge_assessment_done', 'true');
          setIsCompleted(true);
          toast.warning('Time expired! Assessment submitted automatically.');
          return 0;
        }
        const nextTime = prev - 1;
        sessionStorage.setItem('talentforge_assessment_time', String(nextTime));
        return nextTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  // 3. Handle selecting an answer + Autosave to sessionStorage
  const handleSelectAnswer = (qId: number, val: any) => {
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);
    try {
      sessionStorage.setItem('talentforge_assessment_answers', JSON.stringify(updated));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 1500);
    } catch (e) {
      console.warn('Failed to autosave answers:', e);
    }
  };

  // Submit / Finish Assessment
  const handleSubmitAssessment = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Do you want to submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setIsCompleted(true);
    sessionStorage.setItem('talentforge_assessment_done', 'true');
    toast.success('Assessment completed! Psychometric radar report generated.');

    // Auto-save to DB using trait short keys
    try {
      const scoresMap: Record<string, number> = {};
      questions.forEach(q => {
        if (!scoresMap[q.trait]) scoresMap[q.trait] = 0;
        const answer = answers[q.id];
        if (answer !== undefined) {
          if (q.type === 'likert') {
            scoresMap[q.trait] = Math.max(scoresMap[q.trait], Math.round((answer / 5) * 100));
          } else if (q.type === 'mcq') {
            const correct = q.options?.find(o => o.isCorrect);
            scoresMap[q.trait] = Math.max(scoresMap[q.trait], correct?.value === answer ? 100 : 0);
          }
        }
      });
      await api.post('/students/assessment/save', { scores: scoresMap });
    } catch (err) {
      console.warn('Auto-save assessment failed (will retry via Save Proof button):', err);
    }
  };

  // Reset Assessment
  const handleReset = () => {
    sessionStorage.removeItem('talentforge_assessment_answers');
    sessionStorage.removeItem('talentforge_assessment_time');
    sessionStorage.removeItem('talentforge_assessment_done');
    setAnswers({});
    setTimeLeft(INITIAL_TIMER_SECONDS);
    setCurrentIdx(0);
    setIsCompleted(false);
    toast.info('Assessment reset.');
  };

  // Format Time (mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // Calculate 5-Trait Scores for RadarChart — use trait short keys
  const traitScores: TraitScore[] = [
    { trait: 'Logical Reasoning',    value: calculateTraitScore('logical', answers, questions),      fullMark: 100 },
    { trait: 'Attention to Detail',  value: calculateTraitScore('detail', answers, questions),        fullMark: 100 },
    { trait: 'Persistence',          value: calculateTraitScore('persistence', answers, questions),   fullMark: 100 },
    { trait: 'Learning Speed',       value: calculateTraitScore('learning', answers, questions),      fullMark: 100 },
    { trait: 'System Architecture',  value: calculateTraitScore('architecture', answers, questions),  fullMark: 100 },
  ];

  const overallAvg = Math.round(
    traitScores.reduce((acc, t) => acc + t.value, 0) / traitScores.length
  );

  // 3b. Fetch dynamic AI model interpretation when assessment is completed
  useEffect(() => {
    if (isCompleted && !aiInterpretation && !isGeneratingAI) {
      const fetchAIInterpretation = async () => {
        try {
          setIsGeneratingAI(true);
          const scoresMap: Record<string, number> = {};
          traitScores.forEach((t) => {
            scoresMap[t.trait] = t.value;
          });

          const res = await axios.post(`${apiUrl}/students/assessment/interpret`, { scores: scoresMap });
          if (res.data?.interpretation) {
            setAiInterpretation(res.data.interpretation);
            setAiProviderName(res.data.provider || 'Active AI Model');
          }
        } catch (err) {
          console.warn('Failed to fetch AI interpretation from backend adapter:', err);
        } finally {
          setIsGeneratingAI(false);
        }
      };

      fetchAIInterpretation();
    }
  }, [isCompleted]);

  const handleSaveProof = async () => {
    try {
      const scoresMap: Record<string, number> = {};
      traitScores.forEach((t) => {
        scoresMap[t.trait] = t.value;
      });
      await api.post('/students/assessment/save', { scores: scoresMap });
      toast.success('Psychometric assessment proof saved to candidate profile!');
    } catch (err) {
      toast.error('Failed to save assessment proof');
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 midnight:border-line bg-white dark:bg-slate-900 midnight:bg-panel p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/30 uppercase">
                Diagnostic Assessment
              </span>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 animate-pulse">
                  <Check className="h-3 w-3" /> Autosaved to Session
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Brain className="h-7 w-7 text-purple-400" /> TalentForge Psychometric & Aptitude Suite
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates cognitive reasoning, attention to boundary conditions, and technical craftsmanship.
            </p>
          </div>

          {/* 15-Min Timer Widget */}
          {!isCompleted && (
            <div
              className={`flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-lg transition-all ${
                timeLeft < 120
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
                  : timeLeft < 300
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-950/80 midnight:bg-slate-950/80 border-slate-200 dark:border-slate-800 midnight:border-slate-800 text-purple-600 dark:text-purple-300 midnight:text-purple-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Time Remaining</span>
                <span className="font-mono text-xl font-black tracking-wider">{formatTime(timeLeft)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar Component */}
        {!isCompleted && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>
                Progress: <strong className="text-white">{answeredCount} of {QUESTIONS.length} Answered</strong>
              </span>
              <span>{progressPercent}% Completed</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Container: Question Mode vs Results Mode */}
      {!isCompleted ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 midnight:border-line bg-white dark:bg-slate-900 midnight:bg-panel p-8 shadow-xl space-y-8">
          {/* Question Category & Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 midnight:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Question {currentIdx + 1} of {QUESTIONS.length} • {activeQuestion.category}
                </span>
                <h3 className="text-sm font-bold text-white">{activeQuestion.traitName} Dimension</h3>
              </div>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
              {activeQuestion.type === 'likert' ? 'Likert Rating (1-5)' : 'Timed MCQ'}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {activeQuestion.question}
            </h2>

            {/* Answer Controls: Likert Scale vs MCQ Options */}
            {activeQuestion.type === 'likert' ? (
              <div className="grid gap-3 sm:grid-cols-5 pt-4">
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = answers[activeQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectAnswer(activeQuestion.id, opt.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-purple-900 dark:text-white midnight:text-white shadow-lg shadow-purple-500/10 font-bold scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-950/60 midnight:bg-slate-950/60 border-slate-200 dark:border-slate-800 midnight:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 midnight:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xl font-extrabold mb-1">{opt.value}</span>
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 pt-2">
                {activeQuestion.options?.map((opt) => {
                  const isSelected = answers[activeQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectAnswer(activeQuestion.id, opt.value)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-purple-900 dark:text-white midnight:text-white shadow-lg shadow-purple-500/10 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950/60 midnight:bg-slate-950/60 border-slate-200 dark:border-slate-800 midnight:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 midnight:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.value}
                      </div>
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Question Selector & Navigation Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            {/* Direct Dot Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              {QUESTIONS.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 border-transparent'
                        : isAnswered
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 midnight:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 midnight:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800 midnight:border-slate-800 hover:bg-slate-200 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next / Submit Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 midnight:border-slate-800 bg-white dark:bg-slate-950 midnight:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              {currentIdx < QUESTIONS.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => Math.min(QUESTIONS.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
                >
                  Next Question <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAssessment}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" /> Submit Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Results View: Recharts-style RadarChart & Interpretation ──────── */
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Header Score Overview Banner */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/60 p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner">
                  <Award className="h-8 w-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">Diagnostic Results & Psychometric Proof</h2>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Evaluated across 5 core cognitive and engineering competency dimensions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overall Score</span>
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">{overallAvg}%</span>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aptitude Tier</span>
                  <span className="text-xs font-bold text-purple-300 block">Elite Pioneer (Top 5%)</span>
                </div>
              </div>
            </div>

            {/* RadarChart + 5-Trait Breakdown Grid */}
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              {/* Left SVG RadarChart */}
              <div className="lg:col-span-6 flex justify-center bg-slate-950/80 rounded-3xl p-6 border border-slate-800/80 shadow-inner">
                <RadarChart data={traitScores} width={420} height={350} />
              </div>

              {/* Right Trait Progress List */}
              <div className="lg:col-span-6 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" /> 5-Trait Dimension Scores
                </h3>
                {traitScores.map((t, idx) => (
                  <div key={idx} className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{t.trait}</span>
                      <span className="text-purple-400 font-mono text-sm">{t.value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full"
                        style={{ width: `${t.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Psychometric AI Interpretation Copy */}
            <div className="rounded-2xl bg-slate-950/90 p-6 border border-slate-800 space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> AI Psychometric Fingerprint & Interpretation
                </h3>
                {aiProviderName && (
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                    Provider: {aiProviderName}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2.5">
                {isGeneratingAI ? (
                  <div className="flex items-center gap-2 text-purple-300 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" /> Generating dynamic analysis via active AI adapter ({aiProviderName || 'Ollama'})...
                  </div>
                ) : (
                  <>
                    <p>
                      <strong>Cognitive & Algorithmic Fingerprint:</strong>{' '}
                      {aiInterpretation?.cognitiveAnalysis || `Candidate demonstrates strong proficiency in Logical Reasoning (${traitScores[0].value}%) and Attention to Detail (${traitScores[1].value}%). Answers reflect systematic boundary checking and linear array decomposition before coding.`}
                    </p>
                    <p>
                      <strong>Architectural Craftsmanship:</strong>{' '}
                      {aiInterpretation?.architecturalCraftsmanship || `Demonstrates disciplined modular design habits with an architecture score of ${traitScores[4].value}%. Exceptional awareness of data structure trade-offs.`}
                    </p>
                    <p className="text-slate-400 italic">
                      Recommendation: {aiInterpretation?.careerRecommendation || 'Highly recommended for High-Scale Backend Systems, Algorithmic Engineering, and Infrastructure roles.'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4" /> Retake / Reset Assessment
              </button>

              <button
                onClick={handleSaveProof}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition"
              >
                <CheckCircle2 className="h-4 w-4" /> Save Proof to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Helper: Calculate score for a trait (0-100) based on Likert & MCQ responses */
function calculateTraitScore(traitKey: string, answers: Record<number, any>, questions: Question[]): number {
  const traitQuestions = questions.filter((q) => q.trait === traitKey);
  let totalPoints = 0;
  let maxPoints = 0;

  traitQuestions.forEach((q) => {
    const val = answers[q.id];
    if (q.type === 'likert') {
      maxPoints += 5;
      totalPoints += typeof val === 'number' ? val : 4; // default rating 4 if unanswered
    } else if (q.type === 'mcq') {
      maxPoints += 5;
      const correctOpt = q.options?.find((o) => o.isCorrect);
      if (val === correctOpt?.value) {
        totalPoints += 5;
      }
    }
  });

  if (maxPoints === 0) return 85;
  return Math.min(100, Math.round((totalPoints / maxPoints) * 100));
}
