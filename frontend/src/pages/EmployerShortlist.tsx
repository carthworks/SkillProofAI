import { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Trash2,
  Eye,
  ShieldCheck,
  Bot,
  UserCheck,
  Sparkles,
  Building2,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import CandidateDrawer, { CandidateData } from '../components/CandidateDrawer';
import HiringStepper, { HiringStage } from '../components/HiringStepper';

export default function EmployerShortlist() {
  const [shortlist, setShortlist] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  // Track hiring stage per candidate locally for instant UI feedback
  const [stageMap, setStageMap] = useState<Record<string, HiringStage>>({});

  // Drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

  const fetchShortlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('talentforge_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${apiUrl}/employers/shortlist`, { headers });
      const data = res.data || [];
      setShortlist(data);
      // Seed stageMap from API response
      const map: Record<string, HiringStage> = {};
      data.forEach((c: any) => {
        map[c.id] = (c.hiringStage as HiringStage) ?? 'SHORTLISTED';
      });
      setStageMap(map);
    } catch (err) {
      console.warn('Failed to fetch shortlist:', err);
      // Fallback sample data
      const fallback = [
        {
          id: 'usr-1',
          name: 'Karthikeyan',
          email: 'karthik@talentforge.in',
          domain: 'CSE',
          tier: 'Explorer',
          score: 98,
          badges: [{ status: 'EXPERT_VERIFIED', title: 'Two Sum Verified' }],
          profilePublic: true,
          psychProfile: { logical: 98, detail: 92, persistence: 95, learning: 96 },
          bestProblem: 'Two Sum',
          bestLanguage: 'python',
          bestCodeSample: `# Two Sum\ndef twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i\n    return []`,
        } as CandidateData,
      ];
      setShortlist(fallback);
      setStageMap({ 'usr-1': 'SHORTLISTED' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, [apiUrl]);

  const handleRemoveShortlist = async (candidateId: string) => {
    try {
      const token = localStorage.getItem('talentforge_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${apiUrl}/employers/shortlist/${candidateId}`, { headers });
      setShortlist((prev) => prev.filter((c) => c.id !== candidateId));
      toast.info('Candidate removed from shortlist.');
    } catch (e) {
      setShortlist((prev) => prev.filter((c) => c.id !== candidateId));
      toast.info('Candidate removed from shortlist.');
    }
  };

  const handleOpenDrawer = (c: CandidateData) => {
    setSelectedCandidate({
      ...c,
      hiringStage: stageMap[c.id] ?? (c as any).hiringStage ?? 'SHORTLISTED',
      isShortlisted: true,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <BookmarkCheck className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Shortlisted Talent Pipeline</h1>
              <p className="text-xs text-slate-400">
                Your saved candidate pipeline for direct technical interviews and onboarding.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 px-4 py-2.5 border border-slate-800 text-xs font-bold text-slate-300">
            Total Shortlisted: <strong className="text-amber-400 font-mono text-sm ml-1">{shortlist.length}</strong>
          </div>
        </div>
      </div>

      {/* Shortlisted Candidates Grid */}
      {shortlist.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3 shadow-sm">
          <UserCheck className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Candidates Shortlisted Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Browse the Employer Talent Discover page to evaluate candidate scores, inspect psychometric radar charts, and add top performers to your shortlist.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shortlist.map((c) => {
            const hasExpert = c.badges?.some((b) => b.status === 'EXPERT_VERIFIED');

            return (
              <div
                key={c.id}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm hover:border-purple-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 font-black text-base border border-purple-500/30">
                        {c.name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                      </div>
                    </div>

                    <span className="font-mono font-black text-base text-emerald-400">{c.score}%</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-400">{c.domain} • {c.tier}</span>
                    {hasExpert ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-400">
                        <ShieldCheck className="h-3 w-3" /> Expert Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <Bot className="h-3 w-3" /> AI Verified
                      </span>
                    )}
                  </div>

                  {/* Horizontal Hiring Pipeline Stepper — wired to API */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <HiringStepper
                      candidateId={c.id}
                      currentStage={stageMap[c.id] ?? 'SHORTLISTED'}
                      compact
                      onStageChange={(newStage) =>
                        setStageMap((prev) => ({ ...prev, [c.id]: newStage }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleRemoveShortlist(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(c)}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> Inspect Drawer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Drawer Component */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        candidate={selectedCandidate}
        onClose={() => setIsDrawerOpen(false)}
        onToggleShortlist={(candidateId) => handleRemoveShortlist(candidateId)}
        onStageChange={(newStage) => {
          if (selectedCandidate) {
            setStageMap((prev) => ({ ...prev, [selectedCandidate.id]: newStage }));
            setSelectedCandidate((prev) => prev ? { ...prev, hiringStage: newStage } : null);
          }
        }}
      />
    </div>
  );

}
