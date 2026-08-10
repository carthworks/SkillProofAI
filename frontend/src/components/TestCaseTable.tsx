import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Code2,
  FileDiff,
} from 'lucide-react';

export interface TestCaseResult {
  id: number | string;
  status: 'passed' | 'failed' | 'error';
  input: string;
  expected: string;
  actual: string;
  timeMs: number;
  memoryMb: number;
  description?: string;
}

interface TestCaseTableProps {
  testCases: TestCaseResult[];
}

export default function TestCaseTable({ testCases }: TestCaseTableProps) {
  const [expandedDiffId, setExpandedDiffId] = useState<number | string | null>(null);

  const toggleDiff = (id: number | string) => {
    setExpandedDiffId((prev) => (prev === id ? null : id));
  };

  if (!testCases || testCases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileDiff className="h-3.5 w-3.5 text-brand-400" /> Test-Case Execution Matrix ({testCases.length} Cases)
        </h4>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 select-none">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Result Status</th>
              <th className="py-2.5 px-4">Time (ms)</th>
              <th className="py-2.5 px-4">Memory (MB)</th>
              <th className="py-2.5 px-4 text-right">Output Comparison</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80 font-medium">
            {testCases.map((tc, index) => {
              const isPassed = tc.status === 'passed';
              const isExpanded = expandedDiffId === tc.id;

              return (
                <tbody key={tc.id} className="group">
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-center font-bold">
                      {index + 1}
                    </td>

                    <td className="py-3 px-4">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold text-red-400 border border-red-500/30">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{tc.timeMs} ms</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1 text-slate-400">
                        <HardDrive className="h-3 w-3 text-slate-500" />
                        <span>{tc.memoryMb} MB</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleDiff(tc.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition border ${
                          isExpanded
                            ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            Hide Diff <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Compare Diff <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Expected vs. Actual Diff Container */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-950 p-4 border-t border-slate-800">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Code2 className="h-3.5 w-3.5 text-brand-400" /> Input (stdin):
                            </span>
                            <span className="font-mono text-slate-500">{tc.description || `Case #${index + 1}`}</span>
                          </div>

                          <pre className="rounded-lg bg-slate-900 p-2.5 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
                            {tc.input}
                          </pre>

                          {/* Diff Comparison Grid */}
                          <div className="grid gap-3 sm:grid-cols-2 pt-2">
                            {/* Expected Output */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase">
                                <span>Expected Output</span>
                                <span>Target</span>
                              </div>
                              <pre className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                                {tc.expected}
                              </pre>
                            </div>

                            {/* Actual Output */}
                            <div className="space-y-1">
                              <div className={`flex items-center justify-between text-[10px] font-bold uppercase ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                                <span>Actual Output</span>
                                <span>Sandbox Result</span>
                              </div>
                              <pre className={`rounded-lg border p-3 font-mono text-xs overflow-x-auto ${
                                isPassed
                                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                                  : 'border-red-500/40 bg-red-950/30 text-red-300'
                              }`}>
                                {tc.actual}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
