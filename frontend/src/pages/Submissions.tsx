import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  FileCode2,
  Sparkles,
  Zap,
  Code2,
  ChevronRight,
  RefreshCw,
  X,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSubmissions, Submission } from '../services/api';

export default function Submissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Cooldown countdown state (seconds remaining)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Fetch submissions from API or mock fallback
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getSubmissions();
        setSubmissions(res.data || []);
      } catch (err) {
        toast.error('Failed to load submission history');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cooldown timer tick effect
  useEffect(() => {
    if (submissions.length === 0) return;

    // Find latest nextAllowedAt timestamp across submissions
    const latestSub = submissions[0];
    if (!latestSub.nextAllowedAt) return;

    const targetTime = new Date(latestSub.nextAllowedAt).getTime();

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setCooldownSeconds(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submissions]);

  // Compute stats for score trend sparkline
  const completedSubs = [...submissions]
    .filter((s) => s.status === 'completed' && s.score !== undefined)
    .reverse();

  // Generate SVG Sparkline Points (0 to 100 y-scale mapped to 0 to 40 height)
  const sparklinePoints = completedSubs
    .map((sub, i) => {
      const x = (i / Math.max(1, completedSubs.length - 1)) * 360 + 10;
      const y = 50 - ( (sub.score ?? 0) / 100 ) * 40;
      return `${x},${y}`;
    })
    .join(' ');

  const averageScore = completedSubs.length
    ? Math.round(completedSubs.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedSubs.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Banner & Cooldown Rate-Limit Chip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Submission History & Score Trends
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit past problem attempts, execution metrics, and live resubmit cooldown status.
              </p>
            </div>
          </div>
        </div>

        {/* Server Resubmit Cooldown Chip */}
        <div className="flex items-center gap-3">
          {cooldownSeconds > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-sm animate-pulse">
              <Timer className="h-4 w-4" /> Cooldown Active: {cooldownSeconds}s remaining
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500 border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="h-4 w-4" /> Ready for Resubmission
            </div>
          )}
        </div>
      </div>

      {/* Score Trend Sparkline Hero Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Candidate Performance Sparkline
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total Attempts: </span>
              <span className="font-bold text-slate-900 dark:text-white">{submissions.length}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Avg Score: </span>
              <span className="font-extrabold text-emerald-400">{averageScore} / 100</span>
            </div>
          </div>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="pt-6 pb-2">
          {completedSubs.length > 0 ? (
            <div className="relative w-full h-24">
              <svg viewBox="0 0 380 60" className="w-full h-full overflow-visible">
                {/* Gradient Fill under path */}
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Baseline */}
                <line x1="0" y1="50" x2="380" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />

                {/* Score Trend Line */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />

                {/* Data Points */}
                {completedSubs.map((sub, i) => {
                  const x = (i / Math.max(1, completedSubs.length - 1)) * 360 + 10;
                  const y = 50 - ((sub.score ?? 0) / 100) * 40;
                  return (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="4" className="fill-brand-500 stroke-white dark:stroke-slate-900 stroke-2 group-hover:r-6 transition-all" />
                      <title>{`Attempt #${i + 1}: ${sub.problem?.title} - ${sub.score} pts`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No completed score samples available for sparkline generation.
            </div>
          )}
        </div>
      </div>

      {/* Attempts Table */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-brand-500" /> Recent Submission Attempts
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {submissions.length} results
          </span>
        </div>

        <div className="overflow-x-auto">
          {/* Desktop Table View */}
          <table className="hidden md:table w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 uppercase font-bold text-[10px] tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Problem</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  {/* Timestamp */}
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(sub.createdAt).toLocaleString()}
                    </div>
                  </td>

                  {/* Problem Title */}
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <Link to={`/problems/${sub.problem?.slug}`} className="hover:text-brand-500 transition">
                      {sub.problem?.title || 'Algorithm Challenge'}
                    </Link>
                  </td>

                  {/* Language */}
                  <td className="px-6 py-4 uppercase font-semibold text-[10px] text-slate-500">
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                      {sub.language || 'python'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    {sub.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> GRADED
                      </span>
                    )}
                    {sub.status === 'running' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 animate-pulse">
                        <RefreshCw className="h-3 w-3 animate-spin" /> RUNNING
                      </span>
                    )}
                    {sub.status === 'queued' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                        <Clock className="h-3 w-3" /> QUEUED
                      </span>
                    )}
                    {(sub.status === 'failed' || sub.status === 'BLOCKED') && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-500 border border-red-500/20">
                        <XCircle className="h-3 w-3" /> {sub.status}
                      </span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4 font-bold text-sm">
                    {sub.score !== undefined ? (
                      <span className={sub.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                        {sub.score} / 100
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-600 hover:text-white transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-5 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    <Link to={`/problems/${sub.problem?.slug}`} className="hover:text-brand-500 transition">
                      {sub.problem?.title || 'Algorithm Challenge'}
                    </Link>
                  </div>
                  <div className="font-bold text-sm">
                    {sub.score !== undefined ? (
                      <span className={sub.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                        {sub.score}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700 uppercase font-semibold text-slate-500">
                      {sub.language || 'python'}
                    </span>
                    {sub.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500 border border-emerald-500/20">
                        GRADED
                      </span>
                    )}
                    {sub.status === 'running' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 font-bold text-blue-400 border border-blue-500/20 animate-pulse">
                        RUNNING
                      </span>
                    )}
                    {sub.status === 'queued' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-bold text-amber-500 border border-amber-500/20">
                        QUEUED
                      </span>
                    )}
                    {(sub.status === 'failed' || sub.status === 'BLOCKED') && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-500 border border-red-500/20">
                        {sub.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-2">
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-600 hover:text-white transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Detail
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Result Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Submission Attempt #{selectedSub.id.slice(-6)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSub.problem?.title} • {new Date(selectedSub.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scorecard Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Correctness</span>
                <span className="text-lg font-extrabold text-emerald-400">100%</span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Complexity</span>
                <span className="text-lg font-extrabold text-blue-400">95%</span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Code Style</span>
                <span className="text-lg font-extrabold text-purple-400">100%</span>
              </div>
            </div>

            {/* Code Snapshot */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Submitted Solution Code ({selectedSub.language || 'python'})
              </span>
              <pre className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs text-purple-200/90 overflow-x-auto max-h-48">
                {`def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
