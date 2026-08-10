import { useState, useEffect, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Send,
  GripVertical,
  RotateCcw,
  FileCode2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import {
  getProblemBySlug,
  getPresignedUrl,
  uploadCodeToMinio,
  submitSolution,
  Problem,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useGradingSocket } from '../hooks/useGradingSocket';
import ResultsPanel from '../components/ResultsPanel';
import BadgeCelebrationModal from '../components/BadgeCelebrationModal';

const CODE_TEMPLATES: Record<string, string> = {
  python: `# Python 3 Solution Template
import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your logic here
    print("0 1")

if __name__ == "__main__":
    solve()
`,
  javascript: `// Node.js Solution Template
const fs = require('fs');

function solve() {
  const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
  if (!input || input.length === 0 || input[0] === '') return;

  // Write your logic here
  console.log("0 1");
}

solve();
`,
  java: `// Java Solution Template
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNext()) return;
        
        // Write your logic here
        System.out.println("0 1");
    }
}
`,
};

export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor & Tab State
  const [language, setLanguage] = useState<'python' | 'javascript' | 'java'>('python');
  const [code, setCode] = useState<string>(CODE_TEMPLATES['python']);
  const [activeTab, setActiveTab] = useState<'statement' | 'testcases'>('statement');

  // Submission State & Custom Socket Hook
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [expertReview, setExpertReview] = useState<any>(null);

  const { status, result, logs, resetGradingState } = useGradingSocket(submissionId);

  // Trigger Badge Celebration Modal when score >= 75
  useEffect(() => {
    if (status === 'completed' && ((result?.total ?? (result as any)?.scores?.total ?? 0) >= 75)) {
      setShowCelebrationModal(true);
    }
  }, [status, result]);

  // Load Problem Detail
  useEffect(() => {
    async function loadProblem() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await getProblemBySlug(slug);
        setProblem(data);
      } catch (err: any) {
        console.error('Failed to load problem:', err);
        setError('Problem not found or backend server unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [slug]);

  // Sync template on language change
  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'java') => {
    setLanguage(newLang);
    setCode(CODE_TEMPLATES[newLang] || '');
  };

  // Submit Handler: Uploads code to S3/MinIO and triggers BullMQ grading
  const handleSubmit = async () => {
    if (!problem) return;
    try {
      setIsSubmitting(true);
      setShowCelebrationModal(false);
      resetGradingState();

      // Submit solution directly to backend API
      const { submissionId: subId } = await submitSolution(problem.id, code, language);

      setSubmissionId(subId);
    } catch (err: any) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading problem environment...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-3xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-bold text-red-700 dark:text-red-300">Problem Load Error</h2>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error || 'Problem not found'}</p>
          <Link
            to="/problems"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Problem Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col -m-8 overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Workspace Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Board
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            {problem.title}
          </h1>

          <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-[11px] font-bold text-brand-400 border border-brand-500/30">
            {problem.tier}
          </span>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 uppercase">
            {problem.domain}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-slate-400" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="java">Java 17</option>
            </select>
          </div>

          <button
            onClick={() => setCode(CODE_TEMPLATES[language] || '')}
            className="rounded-lg border border-slate-800 bg-slate-800/60 p-1.5 text-slate-400 hover:text-white transition"
            title="Reset code template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Submit Button UX with Live State */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || status === 'queued' || status === 'running'}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition shadow-lg ${
              status === 'completed'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : status === 'failed'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/20'
            } disabled:opacity-75`}
          >
            {isSubmitting || status === 'preparing' || status === 'queued' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Queued...
              </>
            ) : status === 'running' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-300" /> Evaluating...
              </>
            ) : status === 'completed' ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" /> Graded ({result?.total || 100}/100)
              </>
            ) : status === 'failed' ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" /> Retry Solution
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit Solution
              </>
            )}
          </button>
        </div>
      </header>

      {/* Resizable Split Layout Pane */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Problem Statement & Test Cases */}
          <Panel defaultSize={45} minSize={25} className="flex flex-col bg-slate-900 border-r border-slate-800">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-slate-800 px-4 bg-slate-900/80">
              <button
                onClick={() => setActiveTab('statement')}
                className={`px-4 py-3 text-xs font-bold transition border-b-2 ${
                  activeTab === 'statement'
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Problem Description
              </button>
              <button
                onClick={() => setActiveTab('testcases')}
                className={`px-4 py-3 text-xs font-bold transition border-b-2 ${
                  activeTab === 'testcases'
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Public Testcases ({problem.publicTestCases?.length || 0})
              </button>
            </div>

            {/* Panel Content Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'statement' && (
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-headings:text-white leading-relaxed">
                  <ReactMarkdown>{problem.description}</ReactMarkdown>
                </div>
              )}

              {activeTab === 'testcases' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Public Testcase Suite
                  </h3>
                  {problem.publicTestCases?.map((tc, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>Testcase #{idx + 1}</span>
                        {tc.description && (
                          <span className="text-[11px] text-brand-400">{tc.description}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Input (stdin):</label>
                        <pre className="rounded-lg bg-slate-900 p-2.5 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto">
                          {tc.stdin ?? (tc as any).input ?? ''}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Output:</label>
                        <pre className="rounded-lg bg-slate-900 p-2.5 font-mono text-xs text-blue-400 border border-slate-800 overflow-x-auto">
                          {tc.expectedStdout ?? (tc as any).expected ?? ''}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {/* Resizable Separator Handle */}
          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-brand-500/50 flex items-center justify-center transition group cursor-col-resize">
            <GripVertical className="h-4 w-4 text-slate-600 group-hover:text-brand-400" />
          </PanelResizeHandle>

          {/* Right Panel: Monaco Editor & Execution Terminal split vertically */}
          <Panel defaultSize={55} minSize={30} className="flex flex-col bg-slate-950 overflow-hidden">
            <PanelGroup direction="vertical">
              {/* Top: Editor Area */}
              <Panel defaultSize={55} minSize={20} className="flex flex-col relative bg-slate-950">
                {/* Mobile Read-Only Banner */}
                <div className="md:hidden absolute inset-x-0 top-0 z-10 bg-amber-500/10 backdrop-blur-md border-b border-amber-500/30 p-2 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Mobile View: Read-Only Mode</span>
                </div>
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center bg-slate-950">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        <p className="text-xs text-slate-500">Loading editor...</p>
                      </div>
                    </div>
                  }
                >
                  <Editor
                    height="100%"
                    language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'java'}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: 'Fira Code, JetBrains Mono, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                      lineNumbersMinChars: 3,
                    }}
                  />
                </Suspense>
              </Panel>

              {/* Draggable Vertical Split Handle */}
              <PanelResizeHandle className="h-2 bg-slate-950 hover:bg-emerald-500/50 flex items-center justify-center transition group cursor-row-resize border-y border-slate-800">
                <div className="w-10 h-1 bg-slate-700 rounded-full group-hover:bg-emerald-400" />
              </PanelResizeHandle>

              {/* Bottom: Prominent Execution Terminal & Score Proof */}
              <Panel defaultSize={45} minSize={15} className="flex flex-col bg-slate-900 overflow-hidden">
                {showCelebrationModal && (
                  <BadgeCelebrationModal
                    onClose={() => setShowCelebrationModal(false)}
                    badgeTitle={`${problem.title} Verified Badge`}
                    score={result?.total ?? (result as any)?.scores?.total ?? 98}
                    badgeId={result?.badgeId || undefined}
                  />
                )}
                <ResultsPanel status={status} result={result} logs={logs} expertReview={expertReview} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
