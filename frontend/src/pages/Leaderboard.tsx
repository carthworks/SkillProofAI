import { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  Users,
} from 'lucide-react';
import { getLeaderboard, LeaderboardResponse, toggleAnonymize } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Leaderboard() {
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'cohort' | 'friends' | 'weekly'>('cohort');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isAnonymizing, setIsAnonymizing] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

  useEffect(() => {
    fetchLeaderboard();
  }, [page, limit, activeTab]);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      const res = await getLeaderboard(page, limit, activeTab);
      setData(res);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAnonymize = async () => {
    try {
      setIsAnonymizing(true);
      const targetState = !user?.isAnonymized;
      await toggleAnonymize(targetState);
      toast.success(
        targetState
          ? 'Profile anonymized on public leaderboard'
          : 'Profile name visible on leaderboard'
      );
      await checkAuth();
      await fetchLeaderboard();
    } catch (err) {
      console.error('Failed to toggle anonymize:', err);
      toast.error('Failed to update privacy preference');
    } finally {
      setIsAnonymizing(false);
    }
  };

  const handleTabChange = (newTab: 'global' | 'cohort' | 'friends' | 'weekly') => {
    setActiveTab(newTab);
    setPage(1);
  };

  const podium = data?.podium || [];
  const rank1 = podium.find((p) => p.rank === 1) || { name: 'Priya Shah', score: 9840 };
  const rank2 = podium.find((p) => p.rank === 2) || { name: 'Marcus Chen', score: 9612 };
  const rank3 = podium.find((p) => p.rank === 3) || { name: 'Aarav Mehta', score: 9405, isUser: true };

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      {/* Header Section with Anonymized Profile Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1 text-[11px] font-bold text-slate-400 border border-slate-800 uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            COHORT 2026-Q2
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Leaderboard
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Top performers ranked by verified XP & AI badge achievements this season.
          </p>
        </div>

        {/* Anonymized Toggle Button */}
        <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">Leaderboard Privacy</span>
            <span className="text-[10px] text-slate-400">
              {user?.isAnonymized ? 'Anonymized Mode' : 'Public Name Mode'}
            </span>
          </div>

          <button
            onClick={handleToggleAnonymize}
            disabled={isAnonymizing}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
              user?.isAnonymized
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600 hover:text-white'
            }`}
          >
            {user?.isAnonymized ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {user?.isAnonymized ? 'Anonymized' : 'Make Anonymous'}
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards Grid matching screenshot */}
      <div className="grid gap-6 md:grid-cols-3 items-end pt-4">
        {/* Rank 2 (Left Silver Card) */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center space-y-4 shadow-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-slate-400" /> RANK 2
          </div>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 shadow-md">
            <div className="h-14 w-14 rounded-full bg-slate-300 flex items-center justify-center font-extrabold text-slate-900 text-lg">
              {rank2.name.charAt(0)}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{rank2.name}</h3>
            <p className="text-xl font-extrabold text-white mt-1 tracking-tight">
              {rank2.score.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rank 1 (Center Gold Card with glowing border) */}
        <div className="relative rounded-3xl border-2 border-amber-500/70 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 p-8 text-center space-y-5 shadow-2xl shadow-amber-500/10 hover:border-amber-400 transition">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-extrabold text-slate-950 shadow-md uppercase tracking-wider flex items-center gap-1">
            <Crown className="h-3 w-3" /> RANK 1
          </div>

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/20 mt-2">
            <div className="h-18 w-18 rounded-full bg-amber-400 flex items-center justify-center font-extrabold text-slate-950 text-2xl">
              {rank1.name.charAt(0)}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white">{rank1.name}</h3>
            <p className="text-2xl font-black text-amber-400 mt-1 tracking-tight">
              {rank1.score.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rank 3 (Right Bronze/Blue Card with YOU badge) */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center space-y-4 shadow-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-amber-700" /> RANK 3
          </div>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 text-white shadow-md">
            <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center font-extrabold text-white text-lg">
              {rank3.name.charAt(0)}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{rank3.name}</h3>
            {rank3.isUser && (
              <span className="inline-block mt-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-widest border border-blue-500/30">
                YOU
              </span>
            )}
            <p className="text-xl font-extrabold text-white mt-1 tracking-tight">
              {rank3.score.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs matching screenshot */}
      <div className="flex items-center gap-6 border-b border-slate-800/80 pb-3">
        {(['global', 'cohort', 'friends', 'weekly'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`text-xs font-bold capitalize transition pb-1 relative ${
              activeTab === tab
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {/* Leaderboard Data Table matching screenshot */}
      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 overflow-hidden shadow-2xl">
        <table className="hidden md:table w-full text-left text-xs select-none">
          <thead className="bg-slate-950/90 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
            <tr>
              <th className="py-4 px-6 w-20">RANK</th>
              <th className="py-4 px-6">CANDIDATE</th>
              <th className="py-4 px-6">SCORE</th>
              <th className="py-4 px-6">PASS RATE</th>
              <th className="py-4 px-6 text-right">Δ 7D</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                    <span>Fetching live leaderboard state...</span>
                  </div>
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                  No candidates listed for this filter view.
                </td>
              </tr>
            ) : (
              data?.items?.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/50 transition ${
                    item.isUser ? 'bg-blue-950/20' : ''
                  }`}
                >
                  {/* Rank Column */}
                  <td className="py-4 px-6 font-mono text-slate-500 font-bold">
                    {String(item.rank).padStart(2, '0')}
                  </td>

                  {/* Candidate Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                        {item.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white tracking-tight">{item.name}</span>
                    </div>
                  </td>

                  {/* Score Column */}
                  <td className="py-4 px-6 font-extrabold text-white font-mono">
                    {item.score.toLocaleString()}
                  </td>

                  {/* Pass Rate Progress Bar Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3 max-w-md">
                      <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${item.passRate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 w-8 text-right font-mono">
                        {item.passRate}%
                      </span>
                    </div>
                  </td>

                  {/* 7-Day Trend Column */}
                  <td className="py-4 px-6 text-right font-mono font-bold">
                    {item.trend >= 0 ? (
                      <span className="text-emerald-500">+{item.trend}</span>
                    ) : (
                      <span className="text-red-500">{item.trend}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-800/60 font-medium select-none">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span>Fetching live leaderboard state...</span>
              </div>
            </div>
          ) : data?.items?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No candidates listed for this filter view.
            </div>
          ) : (
            data?.items?.map((item) => (
              <div
                key={item.id}
                className={`p-5 space-y-4 hover:bg-slate-800/50 transition ${
                  item.isUser ? 'bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold text-sm">
                      #{String(item.rank).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                        {item.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white tracking-tight text-sm">{item.name}</span>
                    </div>
                  </div>
                  <div className="font-extrabold text-white font-mono text-sm">
                    {item.score.toLocaleString()} XP
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 max-w-[60%]">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${item.passRate}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right font-mono">
                      {item.passRate}%
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs">
                    {item.trend >= 0 ? (
                      <span className="text-emerald-500">+{item.trend}</span>
                    ) : (
                      <span className="text-red-500">{item.trend}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Pagination Controls matching screenshot requirements */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-white">{page}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span> ({data?.pagination?.totalItems || 0} total candidates)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
