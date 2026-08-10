import { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Search,
  ShieldCheck,
  Star,
  Bookmark,
  BookmarkCheck,
  Eye,
  Sparkles,
  Filter,
  ArrowUpDown,
  Bot,
  Code2,
  Cpu,
  BrainCircuit
} from 'lucide-react';
import { toast } from 'sonner';
import CandidateDrawer, { CandidateData } from '../components/CandidateDrawer';
import api from '../services/api';

export default function EmployerDiscover() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters State
  const [minScore, setMinScore] = useState<number>(75);
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | 'AI_VERIFIED' | 'EXPERT_VERIFIED'>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'score' | 'name'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drawer State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Smart Match State
  const [roleText, setRoleText] = useState('');
  const [isSmartMatching, setIsSmartMatching] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch candidates and current shortlist
        const [candidatesRes, shortlistRes] = await Promise.all([
          api.get(`/employers/candidates`, {
            params: {
              minScore,
              badge: badgeFilter,
              language: languageFilter,
            },
          }),
          api.get(`/employers/shortlist`).catch(() => ({ data: [] })),
        ]);

        const cData: CandidateData[] = candidatesRes.data || [];
        const sData: any[] = shortlistRes.data || [];
        const sIds = new Set(sData.map((s) => s.id));

        setShortlistedIds(sIds);
        setCandidates(cData);
      } catch (err) {
        console.warn('Failed to fetch candidates from backend, using fallback data:', err);
        // Fallback sample data for demonstration
        const sampleCandidates: CandidateData[] = [
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
            bestCodeSample: `# Two Sum Solution in Python 3\ndef twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n`,
          },
          {
            id: 'usr-2',
            name: 'Priya Shah',
            email: 'priya@tech.org',
            domain: 'CSE',
            tier: 'Architect',
            score: 95,
            badges: [{ status: 'EXPERT_VERIFIED', title: 'LRU Cache Verified' }],
            profilePublic: true,
            psychProfile: { logical: 94, detail: 96, persistence: 90, learning: 92 },
            bestProblem: 'LRU Cache System',
            bestLanguage: 'javascript',
            bestCodeSample: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n}`,
          },
          {
            id: 'usr-3',
            name: 'Arjun Mehta',
            email: 'arjun@pioneer.edu',
            domain: 'ECE',
            tier: 'Builder',
            score: 88,
            badges: [{ status: 'AI_VERIFIED', title: 'Rate Limiter Verified' }],
            profilePublic: false,
            psychProfile: { logical: 88, detail: 85, persistence: 90, learning: 89 },
            bestProblem: 'Rate Limiter',
            bestLanguage: 'python',
            bestCodeSample: `// [PRIVACY PROTECTED]`,
          },
        ];
        setCandidates(sampleCandidates);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [minScore, badgeFilter, languageFilter]);

  // Handle Shortlist Toggle
  const handleToggleShortlist = async (candidateId: string) => {
    const isCurrentlyShortlisted = shortlistedIds.has(candidateId);

    try {
      if (isCurrentlyShortlisted) {
        await api.delete(`/employers/shortlist/${candidateId}`);
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(candidateId);
          return next;
        });
        toast.info('Candidate removed from shortlist.');
      } else {
        await api.post(`/employers/shortlist`, { candidateId });
        setShortlistedIds((prev) => new Set(prev).add(candidateId));
        toast.success('Candidate added to shortlist!');
      }
    } catch (e) {
      // Local fallback state update
      if (isCurrentlyShortlisted) {
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(candidateId);
          return next;
        });
        toast.info('Candidate removed from shortlist.');
      } else {
        setShortlistedIds((prev) => new Set(prev).add(candidateId));
        toast.success('Candidate added to shortlist!');
      }
    }
  };

  const handleSmartMatch = async () => {
    if (!roleText.trim()) {
      toast.error('Please paste a Job Description first.');
      return;
    }
    try {
      setIsSmartMatching(true);
      
      const res = await api.post(`/employers/smart-match`, { roleText });
      setCandidates(res.data);
      toast.success('AI Smart Match complete! Candidates sorted by vector similarity.');
    } catch (err) {
      console.error(err);
      toast.error('Smart match failed. Check backend console.');
    } finally {
      setIsSmartMatching(false);
    }
  };

  const handleOpenDrawer = (c: CandidateData) => {
    setSelectedCandidate({
      ...c,
      isShortlisted: shortlistedIds.has(c.id),
    });
    setIsDrawerOpen(true);
  };

  // Filter & Sort Candidate rows
  const filteredCandidates = candidates
    .filter((c) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      } else {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-inner">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Employer Talent Discover</h1>
                <p className="text-xs text-slate-400">
                  Filter candidates by verified score thresholds, psychometric profiles, and expert badges.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 text-xs font-bold text-slate-300">
              Shortlisted: <strong className="text-amber-400 font-mono text-sm ml-1">{shortlistedIds.size} Candidates</strong>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Matching Block */}
      <div className="rounded-3xl border border-purple-500/30 bg-purple-950/20 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-black text-white">AI Smart Match (pgvector)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Paste your Job Description below. We'll embed it into a vector and use cosine similarity to find the best candidate matches.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <textarea
            value={roleText}
            onChange={(e) => setRoleText(e.target.value)}
            placeholder="e.g. We need a backend engineer proficient in Node.js, Python, and system design for distributed architectures..."
            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[80px]"
          />
          <button
            onClick={handleSmartMatch}
            disabled={isSmartMatching}
            className="shrink-0 h-[80px] rounded-xl bg-purple-600 hover:bg-purple-500 px-6 font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 disabled:opacity-50"
          >
            {isSmartMatching ? (
              <>
                <Cpu className="h-5 w-5 animate-pulse" /> Matching...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> Smart Match
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtering Control Bar Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-purple-400" /> Search & Criteria Filters
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-12 items-center">
          {/* Search Input (4 Cols) */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or domain..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Min Score Slider (4 Cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Minimum Score Threshold</span>
              <span className="text-purple-400 font-mono font-black">{minScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Badge Filter Toggle Buttons (4 Cols) */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block uppercase">Verification Status</label>
            <div className="flex items-center gap-1 text-xs">
              {(['ALL', 'AI_VERIFIED', 'EXPERT_VERIFIED'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadgeFilter(b)}
                  className={`rounded-xl px-3 py-1.5 font-bold transition text-[11px] ${
                    badgeFilter === b
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  {b === 'ALL' ? 'All' : b === 'AI_VERIFIED' ? 'AI Verified' : 'Expert Verified'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language Filter Row */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Code2 className="h-3.5 w-3.5 text-purple-400" /> Language:
          </span>
          {(['ALL', 'python', 'javascript', 'cpp'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguageFilter(lang)}
              className={`rounded-lg px-3 py-1 font-mono font-bold text-[11px] transition uppercase ${
                languageFilter === lang
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-4">Domain & Tier</th>
                <th className="py-4 px-4 cursor-pointer" onClick={() => { setSortField('score'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    Aggregate Score <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-4 px-4">Badges & Verification</th>
                <th className="py-4 px-4">Language</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No candidates match the selected min-score ({minScore}%) and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const isShortlisted = shortlistedIds.has(c.id);
                  const hasExpert = c.badges?.some((b) => b.status === 'EXPERT_VERIFIED');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-purple-600/20 text-purple-400 font-black flex items-center justify-center border border-purple-500/30">
                            {c.name[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                            <span className="text-[10px] text-slate-400">{c.email}</span>
                            {c.matchPercent !== undefined && (
                              <div className="mt-1 inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-400 border border-purple-500/20">
                                <BrainCircuit className="h-3 w-3" /> {c.matchPercent}% Match
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-300">
                        <span className="rounded font-mono bg-slate-800 px-2 py-0.5 text-[10px]">
                          {c.domain} • {c.tier}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-black text-sm text-emerald-400">{c.score} / 100</span>
                      </td>

                      <td className="py-4 px-4">
                        {hasExpert ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-300 border border-purple-500/30">
                            <ShieldCheck className="h-3 w-3 text-purple-400" /> Expert Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            <Bot className="h-3 w-3 text-emerald-400" /> AI Verified
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono uppercase text-[10px] font-bold text-purple-300">
                        {c.bestLanguage}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleShortlist(c.id)}
                            className={`p-2 rounded-xl border transition ${
                              isShortlisted
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title={isShortlisted ? 'In Shortlist' : 'Add to Shortlist'}
                          >
                            {isShortlisted ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(c)}
                            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-purple-500 transition shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect Drawer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sliding Side Candidate Drawer */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        candidate={selectedCandidate}
        onClose={() => setIsDrawerOpen(false)}
        onToggleShortlist={handleToggleShortlist}
      />
    </div>
  );
}
