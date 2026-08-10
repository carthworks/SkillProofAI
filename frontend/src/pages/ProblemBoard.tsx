import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Filter, Code2, Award, ArrowRight, Layers, CheckCircle2, Bot, Plus, X, Loader2, Lock } from 'lucide-react';
import { getProblems, Problem, generateAIProblem } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import TierUpgradeModal from '../components/TierUpgradeModal';
import api from '../services/api';

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Explorer: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'from-emerald-500/20 to-teal-500/10',
  },
  Apprentice: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    glow: 'from-blue-500/20 to-cyan-500/10',
  },
  Builder: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    glow: 'from-indigo-500/20 to-purple-500/10',
  },
  Master: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    glow: 'from-amber-500/20 to-orange-500/10',
  },
  Architect: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    glow: 'from-purple-500/20 to-indigo-500/10',
  },
};

// Tier access map: which paid tier unlocks which problem tiers
const TIER_ACCESS: Record<string, string[]> = {
  free:     ['Explorer'],
  basic:    ['Explorer', 'Builder', 'Apprentice'],
  advanced: ['Explorer', 'Builder', 'Apprentice', 'Architect', 'Master'],
};

export default function ProblemBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockedTier, setUnlockedTier] = useState<string>('free');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  // Tier Upgrade Modal
  const [tierModalConfig, setTierModalConfig] = useState<{ show: boolean; tier: 'basic' | 'advanced'; problemTitle: string }>({
    show: false, tier: 'basic', problemTitle: '',
  });

  // AI Problem Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('Distributed Rate Limiter');
  const [aiDifficulty, setAiDifficulty] = useState('Builder');
  const [aiDomain, setAiDomain] = useState('cse');
  const [generating, setGenerating] = useState(false);

  // Fetch user's unlocked tier from payments status
  useEffect(() => {
    api.get('/payments/status').then(res => {
      setUnlockedTier(res.data?.unlockedTier || 'free');
    }).catch(() => {});
  }, []);

  const canAccessTier = (problemTier: string): boolean => {
    const access = TIER_ACCESS[unlockedTier] || TIER_ACCESS.free;
    return access.includes(problemTier);
  };

  const handleCardClick = (problem: Problem, e: React.MouseEvent) => {
    if (canAccessTier(problem.tier)) {
      navigate(`/problems/${problem.slug}`);
    } else {
      e.preventDefault();
      const requiredTier = ['Architect', 'Master'].includes(problem.tier) ? 'advanced' : 'basic';
      setTierModalConfig({ show: true, tier: requiredTier, problemTitle: problem.title });
    }
  };

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        const data = await getProblems();
        
        // Remove duplicates by slug
        const uniqueProblems = data.filter((v, i, a) => a.findIndex(t => (t.slug === v.slug)) === i);
        
        setProblems(uniqueProblems);
      } catch (err: any) {
        console.error('Failed to load problems:', err);
        setError('Unable to connect to problem database.');
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  const handleGenerateAIProblem = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please specify a problem topic');
      return;
    }

    try {
      setGenerating(true);
      toast.info(`Requesting AI Adapter (Ollama/Claude) to craft problem on "${aiTopic}"...`);
      const created = await generateAIProblem(aiTopic, aiDifficulty, aiDomain);
      toast.success(`Successfully generated "${created.title}"!`);
      setIsAiModalOpen(false);
      navigate(`/problems/${created.slug}`);
    } catch (err: any) {
      console.error('Failed to generate AI problem:', err);
      toast.error('Failed to generate problem using AI model adapter.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain =
      selectedDomain === 'all' || problem.domain.toLowerCase() === selectedDomain.toLowerCase();

    const matchesTier =
      selectedTier === 'all' || problem.tier.toLowerCase() === selectedTier.toLowerCase();

    return matchesSearch && matchesDomain && matchesTier;
  });

  const tiers = ['all', 'Explorer', 'Apprentice', 'Builder', 'Architect', 'Master'];

  const quickTopics = [
    'Load Balancer Evictions',
    'LRU Cache O(1)',
    'Token Bucket Rate Limiter',
    'Trie Autocomplete',
    'Consistent Hashing Ring',
    'LSM Tree MemTable',
  ];

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Verified Execution Sandbox • 8 Seeded & AI Generated
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Problem Board & Execution Suite
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Choose an engineering challenge or generate a custom algorithmic problem using our pluggable AI model adapter.
          </p>
        </div>

        {/* AI Generator Trigger CTA */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-xs font-extrabold text-white shadow-xl shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95 border border-purple-400/30"
          >
            <Bot className="h-4 w-4 text-purple-200" /> ✨ Generate AI Problem
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title, topic, or keyword..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Domain Dropdown Filter */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDomain === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Domains
            </button>
            <button
              onClick={() => setSelectedDomain('cse')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDomain === 'cse'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CSE
            </button>
            <button
              onClick={() => setSelectedDomain('ece')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDomain === 'ece'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ECE
            </button>
          </div>

          {/* Tier Difficulty Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
            {tiers.map((tier) => {
              const active = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all border ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : tier}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-6 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {/* Tier Upgrade Modal */}
      {tierModalConfig.show && (
        <TierUpgradeModal
          tier={tierModalConfig.tier}
          problemTitle={tierModalConfig.problemTitle}
          onClose={() => setTierModalConfig(p => ({ ...p, show: false }))}
          onSuccess={(t) => {
            setUnlockedTier(t);
            setTierModalConfig(p => ({ ...p, show: false }));
            toast.success(`🎉 ${t === 'advanced' ? 'Advanced' : 'Basic'} tier unlocked! Access granted.`);
          }}
        />
      )}

      {/* Problems Grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((problem) => {
            const tierStyle = TIER_COLORS[problem.tier] || TIER_COLORS.Explorer;
            const isLocked = !canAccessTier(problem.tier);
            return (
              <div
                key={problem.id}
                onClick={(e) => handleCardClick(problem, e)}
                className={`group relative flex flex-col justify-between rounded-3xl border bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 overflow-hidden cursor-pointer ${
                  isLocked
                    ? 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-90'
                    : 'border-slate-200/80 dark:border-slate-800 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl dark:hover:border-brand-500/30'
                }`}
              >
                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-slate-900/60 backdrop-blur-[2px] gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
                      <Lock className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-extrabold text-white">Locked</p>
                    <p className="text-[10px] text-slate-400 text-center px-4">
                      {['Architect', 'Master'].includes(problem.tier) ? 'Requires ₹499 Advanced unlock' : 'Requires ₹199 Basic unlock'}
                    </p>
                    <button className="mt-1 rounded-full bg-brand-600 px-4 py-1.5 text-[11px] font-extrabold text-white hover:bg-brand-500 transition">
                      Unlock →
                    </button>
                  </div>
                )}

                <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl ${tierStyle.glow} opacity-30 blur-2xl pointer-events-none`} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                      <Layers className="h-3.5 w-3.5" /> {problem.tier}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {problem.domain}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {problem.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {problem.description.replace(/[#*`]/g, '')}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">+{problem.reward || 100} XP</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-all group-hover:bg-brand-600 group-hover:shadow-md group-hover:shadow-brand-500/20">
                    {isLocked ? <><Lock className="h-3.5 w-3.5" /> Unlock</> : <>Solve Challenge <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Problem Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-8 shadow-2xl space-y-6 text-slate-100">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute right-5 top-5 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3.5 py-1 text-xs font-extrabold text-purple-300 border border-purple-500/40 uppercase tracking-widest">
                <Bot className="h-3.5 w-3.5 text-purple-400" /> Pluggable AI Model Generator
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">Generate Algorithmic Problem</h2>
              <p className="text-xs text-slate-300">
                AI creates problem statements, complexity constraints, 2 public test cases, and 5 hidden evaluation cases.
              </p>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider block">Problem Topic / Concept</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Distributed Lock TTL, Trie Autocomplete..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-white font-medium focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Quick Topic Chips */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setAiTopic(topic)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-600 hover:text-white transition"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider block">Difficulty Tier</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-white font-semibold focus:outline-none"
                  >
                    <option value="Explorer">Explorer (Easy)</option>
                    <option value="Builder">Builder (Medium)</option>
                    <option value="Architect">Architect (Hard)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider block">Engineering Domain</label>
                  <select
                    value={aiDomain}
                    onChange={(e) => setAiDomain(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-white font-semibold focus:outline-none"
                  >
                    <option value="cse">CSE (Computer Science)</option>
                    <option value="ece">ECE (Electronics)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateAIProblem}
                disabled={generating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-purple-200" /> Generating with AI Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-200" /> Generate & Open in Monaco Editor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
