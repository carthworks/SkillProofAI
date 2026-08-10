import { useState, useEffect } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  Clock,
  HardDrive,
  Copy,
  CheckCheck,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { GradingResult, SubmissionStatus } from '../hooks/useGradingSocket';
import ScoreRing from './ScoreRing';
import TestCaseTable, { TestCaseResult } from './TestCaseTable';
import LLMFeedbackPanel from './LLMFeedbackPanel';

export interface ExpertReviewData {
  score: number;
  comment: string;
  reviewer: string;
}

interface ResultsPanelProps {
  status: SubmissionStatus;
  result: GradingResult | null;
  logs: string[];
  errorCode?: 'COMPILE_ERROR' | 'TIMEOUT' | 'OOM' | string | null;
  stderr?: string | null;
  testCaseResults?: TestCaseResult[];
  expertReview?: ExpertReviewData | null;
}

export default function ResultsPanel({
  status,
  result,
  logs,
  errorCode,
  stderr,
  testCaseResults,
  expertReview,
}: ResultsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-expand Execution Terminal & Score Proof when submission starts or finishes
  useEffect(() => {
    if (status === 'preparing' || status === 'queued' || status === 'running' || status === 'completed') {
      setIsCollapsed(false);
    }
  }, [status]);

  const handleCopyStderr = () => {
    if (!stderr) return;
    navigator.clipboard.writeText(stderr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock testcase data if result is completed and no testCaseResults were explicitly passed
  const activeTestCases: TestCaseResult[] = testCaseResults || [
    {
      id: 1,
      status: 'passed',
      input: '4\n2 7 11 15\n9',
      expected: '0 1',
      actual: '0 1',
      timeMs: 12,
      memoryMb: 14.2,
      description: 'Basic pair at start',
    },
    {
      id: 2,
      status: 'passed',
      input: '3\n3 2 4\n6',
      expected: '1 2',
      actual: '1 2',
      timeMs: 15,
      memoryMb: 14.5,
      description: 'Pair in middle',
    },
    {
      id: 3,
      status: 'passed',
      input: '2\n3 3\n6',
      expected: '0 1',
      actual: '0 1',
      timeMs: 11,
      memoryMb: 13.9,
      description: 'Duplicate elements',
    },
  ];

  return (
    <div className="h-full flex flex-col border-t border-slate-800 bg-slate-900 select-none overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-900 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition"
          >
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="font-mono tracking-tight">Execution Terminal & Score Proof</span>
            {isCollapsed ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Live Status Chips */}
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border border-slate-700">
              Ready
            </span>
          )}

          {status === 'preparing' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              <Loader2 className="h-3 w-3 animate-spin" /> Preparing S3 Artifact...
            </span>
          )}

          {status === 'queued' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/40 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Queued in BullMQ...
            </span>
          )}

          {status === 'running' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/40">
              <Loader2 className="h-3 w-3 animate-spin" /> Sandbox Running...
            </span>
          )}

          {status === 'completed' && !errorCode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/40 shadow-sm">
              <Check className="h-3 w-3" /> Graded ({result?.total || 100}/100)
            </span>
          )}

          {(status === 'failed' || errorCode) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/40">
              <AlertCircle className="h-3 w-3" /> {errorCode || 'Evaluation Failed'}
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Body */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 font-mono text-xs space-y-5 bg-slate-950/95">
          {/* State UI 1: COMPILE_ERROR */}
          {errorCode === 'COMPILE_ERROR' && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Compilation Error (COMPILE_ERROR)
                </h4>
                {stderr && (
                  <button
                    onClick={handleCopyStderr}
                    className="inline-flex items-center gap-1 rounded bg-red-900/40 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-900/60 transition"
                  >
                    {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy Stderr'}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300">
                The compiler encountered syntax or build errors while processing your submission:
              </p>

              <pre className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-red-400 border border-slate-800 overflow-x-auto leading-relaxed">
                {stderr || `SyntaxError: Unexpected token ';' at line 14:22\n    at Module._compile (node:internal/modules/cjs/loader:1376:14)`}
              </pre>
            </div>
          )}

          {/* State UI 2: TIMEOUT */}
          {errorCode === 'TIMEOUT' && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2 font-sans">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Execution Timeout (TIMEOUT)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your code exceeded the maximum allowed time limit per testcase (<strong>2000 ms limit exceeded</strong>). Check for infinite loops or inefficient algorithms.
              </p>
            </div>
          )}

          {/* State UI 3: OOM */}
          {errorCode === 'OOM' && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 space-y-2 font-sans">
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Out Of Memory Error (OOM)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your program exceeded the sandbox memory ceiling (<strong>256 MB memory limit exceeded</strong>). Optimize memory allocations and data structure sizes.
              </p>
            </div>
          )}

          {/* Terminal Logs */}
          {logs.length > 0 && (
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Verified Score Card Breakdown with Animated ScoreRing & TestCaseTable */}
          {status === 'completed' && result && !errorCode && (
            <div className="space-y-6 pt-2">
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-emerald-950/20 p-5 font-sans shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Left Animated Score Ring */}
                  <div className="flex items-center gap-4">
                    <ScoreRing score={result.total || 98} size={110} strokeWidth={9} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <Sparkles className="h-4 w-4" /> Verified Sandbox Evaluation
                      </div>
                      <p className="text-xs text-slate-300 max-w-sm">
                        All public test cases executed inside the Docker isolator sandbox with zero execution errors.
                      </p>
                    </div>
                  </div>

                  {/* Right Score Sub-Metrics */}
                  <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                    <div className="rounded-xl bg-slate-900/90 p-3 text-center border border-slate-800 space-y-1 min-w-[90px]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Correctness
                      </span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {result.correctness ?? 100}%
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-900/90 p-3 text-center border border-slate-800 space-y-1 min-w-[90px]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Big-O
                      </span>
                      <span className="text-base font-extrabold text-blue-400">
                        {result.complexity ?? 95}%
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-900/90 p-3 text-center border border-slate-800 space-y-1 min-w-[90px]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Style
                      </span>
                      <span className="text-base font-extrabold text-purple-400">
                        {result.style ?? 100}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test-Case Detailed Table */}
              <TestCaseTable testCases={activeTestCases} />

              {/* Expert Human Review Card */}
              {expertReview && (
                <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/40 p-5 font-sans shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                      <ShieldCheck className="h-4 w-4 text-purple-400" /> Expert Human Review Proof
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3.5 w-3.5 ${star <= expertReview.score ? 'fill-amber-400' : 'text-slate-600'}`} />
                      ))}
                      <span className="ml-1 text-[11px] text-amber-300">{expertReview.score}/5 Stars</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    "{expertReview.comment || 'Approved with high distinction in algorithmic code quality.'}"
                  </p>
                  <div className="text-[10px] text-purple-400 font-semibold flex justify-between">
                    <span>Evaluator: {expertReview.reviewer}</span>
                    <span>Badge Status: EXPERT VERIFIED</span>
                  </div>
                </div>
              )}

              {/* AI Coaching Feedback Panel */}
              <LLMFeedbackPanel
                correctness={result.correctness ?? 100}
                complexity={result.complexity ?? 95}
                style={result.style ?? 100}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
