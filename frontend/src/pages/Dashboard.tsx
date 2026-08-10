import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, CheckCircle2, Code2, Flame, ArrowRight, TrendingUp,
  ShieldCheck, Clock, BookOpen, Users, X, Activity, Shield, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProblems, getSubmissions, Problem, Submission } from '../services/api';
import OnboardingModal from '../components/OnboardingModal';
import BadgeCelebrationModal from '../components/BadgeCelebrationModal';
import api from '../services/api';

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  successfulSubmissions: number;
  totalSubmissions: number;
  badgesEarned: number;
  velocityScore: number;
  unlockedTier: string;
  onboardingComplete: boolean;
  geoCity?: string;
  geoCountry?: string;
  githubUsername?: string;
  avatarUrl?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Onboarding + celebration state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [celebrationBadge, setCelebrationBadge] = useState<{ title: string; score: number } | null>(null);

  // Recruiter popup state (shows after 10 submissions)
  const [showRecruiterAlert, setShowRecruiterAlert] = useState(false);

  // Extra user stats fetched from /api/auth/me (extended fields)
  const [stats, setStats] = useState<Partial<UserStats>>({});
  const [hasProfile, setHasProfile] = useState(true);

  const userTier = user?.tier || 'EXPLORER';
  const userXp = user?.xp || 0;
  const nextTierXp = userTier.toUpperCase() === 'EXPLORER' ? 500 : userTier.toUpperCase() === 'BUILDER' ? 1200 : 2500;
  const nextTierName = userTier.toUpperCase() === 'EXPLORER' ? 'Builder' : userTier.toUpperCase() === 'BUILDER' ? 'Architect' : 'Master';
  const xpProgress = Math.min(100, Math.round((userXp / nextTierXp) * 100));

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [problemsData, submissionsData, meRes, profileRes] = await Promise.all([
          getProblems(),
          getSubmissions().catch(() => ({ data: [] })),
          api.get('/auth/me').catch(() => ({ data: { user: {} } })),
          api.get('/students/profile').catch(() => ({ data: {} })),
        ]);
        setProblems(problemsData);
        setSubmissions(submissionsData.data || []);
        
        const profile = profileRes.data || {};
        setHasProfile(!!profile.resumeS3Key || (profile.skills && profile.skills.length > 0));

        const meUser = meRes.data?.user || {};
        setStats({
          currentStreak: meUser.currentStreak || 0,
          longestStreak: meUser.longestStreak || 0,
          successfulSubmissions: meUser.successfulSubmissions || 0,
          totalSubmissions: meUser.totalSubmissions || 0,
          badgesEarned: meUser.badgesEarned || 0,
          velocityScore: meUser.velocityScore || 0,
          unlockedTier: meUser.unlockedTier || 'free',
          onboardingComplete: meUser.onboardingComplete ?? true,
          geoCity: meUser.geoCity,
          geoCountry: meUser.geoCountry,
          githubUsername: meUser.githubUsername,
          avatarUrl: meUser.avatarUrl,
        });

        // Show onboarding if not complete
        if (meUser.onboardingComplete === false) {
          setShowOnboarding(true);
        }

        // Show recruiter alert if first time hitting 10 sims
        const totalSubs = (submissionsData.data || []).length;
        const alerted = localStorage.getItem('tf_recruiter_alerted');
        if (totalSubs >= 10 && !alerted) {
          setTimeout(() => setShowRecruiterAlert(true), 800);
          localStorage.setItem('tf_recruiter_alerted', '1');
        }

        // Check for new badge earned (badgesEarned > last known)
        const lastBadges = parseInt(localStorage.getItem('tf_last_badges') || '0');
        if ((meUser.badgesEarned || 0) > lastBadges && lastBadges > 0) {
          setCelebrationBadge({ title: 'Verified Skill Badge', score: 85 });
          setShowBadgeCelebration(true);
        }
        localStorage.setItem('tf_last_badges', String(meUser.badgesEarned || 0));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isNewStudent = (stats.totalSubmissions || 0) === 0 && submissions.length === 0;
  const completedCount = stats.successfulSubmissions || submissions.filter((s: any) => (s.score || 0) >= 75).length;
  const passedFirstTry = completedCount;
  const accuracy = isNewStudent ? '--' : `${Math.round((completedCount / Math.max(1, stats.totalSubmissions || submissions.length || 1)) * 100)}%`;
  
  // Find "Pick up where you left off" problem for returning students
  const lastSubmission = submissions[0];
  const resumeProblem = lastSubmission?.problem || problems[0];
  
  // Find "Start Here" problem for new students
  const firstProblem = problems.find(p => p.tier === 'Explorer') || problems[0];

  return (
    <div className="space-y-6 pb-12">
      {showOnboarding && (
        <OnboardingModal
          userName={user?.name?.split(' ')[0] || 'Candidate'}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {showBadgeCelebration && celebrationBadge && (
        <BadgeCelebrationModal
          badgeTitle={celebrationBadge.title}
          score={celebrationBadge.score}
          onClose={() => setShowBadgeCelebration(false)}
        />
      )}

      {/* Recruiter Popup Alert */}
      {showRecruiterAlert && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950 p-5 shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-bottom-4">
          <button onClick={() => setShowRecruiterAlert(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-white">🎉 Recruiters Can See You!</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You've completed 10 simulations. Your profile is now visible to employers in the Discover portal.
              </p>
              <Link to="/profile" className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition">
                View your profile <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Nudge Banner — shows until resume is uploaded */}
      {!hasProfile && !loading && (
        <Link
          to="/profile"
          className="flex items-center gap-4 rounded-[20px] border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/5 p-4 hover:from-indigo-500/20 transition group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30">
            <FileText className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-indigo-300 uppercase tracking-wider">Action Required</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Build your Proof Profile to unlock verified skill badges
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload your resume → AI extracts claims → Solve challenges → Claims flip to Verified ◈
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* TOP BANNER */}
      <div className="relative overflow-hidden rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-8 shadow-sm transition-colors duration-200">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          
          <div className="space-y-6 max-w-xl">
            {isNewStudent ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-500 dark:text-blue-400 uppercase">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  First Session
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Turn what you solve into <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">proof employers can verify.</span>
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    No résumé claims — just evidence. Every challenge you pass is auto-graded and issued as a verifiable skill badge recruiters can check independently.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                  <div className="h-2 w-2 rounded-full bg-brand-500" />
                  {stats.currentStreak}-DAY STREAK • KEEP IT ALIVE
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Welcome back, {user?.name?.split(' ')[0] || 'Demo'}.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">One solve to a new badge.</span>
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    You're <strong>{completedCount} solves</strong> into your first badge and <strong>{xpProgress}%</strong> toward the Builder tier. Finish the next problem to bank both.
                  </p>
                </div>
              </>
            )}

            {/* Chips */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2F] px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Code2 className="h-3.5 w-3.5 text-emerald-500" /> Solve
              </div>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2F] px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Award className="h-3.5 w-3.5 text-amber-500" /> Earn XP + badge
              </div>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2F] px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Climb tiers
              </div>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2F] px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-500" /> Employers verify it
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="w-full md:w-80 shrink-0 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2F] p-6 flex flex-col gap-4 shadow-xl">
            {!hasProfile ? (
              <>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">START HERE</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-bold text-indigo-600 dark:text-indigo-400 uppercase">REQUIRED</span>
                    <span className="text-slate-500">Proof Profile Setup</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload your resume</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload your resume to extract claims. Then verify them by solving challenges.</p>
                <Link to="/profile" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition text-center shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group mt-2">
                  Build Proof Profile <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            ) : isNewStudent ? (
              <>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">VERIFY YOUR SKILLS</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="rounded bg-brand-500/20 px-1.5 py-0.5 font-bold text-brand-600 dark:text-brand-400 uppercase">EASIEST</span>
                    <span className="text-slate-500">{firstProblem?.domain || 'CSE'} • Algorithms</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{firstProblem?.title || 'Two Sum'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>~15 min</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">+{firstProblem?.reward || 100} XP</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your fastest path to a first verified badge.</p>
                <Link to={`/problems/${firstProblem?.slug || 'two-sum'}`} className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 transition text-center shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group">
                  Start challenge <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/problems" className="text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition">Browse all problems</Link>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">PICK UP WHERE YOU LEFT OFF</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="rounded bg-orange-500/20 px-1.5 py-0.5 font-bold text-orange-600 dark:text-orange-400 uppercase">NEXT UP</span>
                    <span className="text-slate-500">{resumeProblem?.domain || 'CSE'} • Algorithms</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{resumeProblem?.title || 'Challenge'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>~45 min</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">+{resumeProblem?.reward || 250} XP</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Solve #{completedCount + 1} — this one completes your first badge.</p>
                <Link to={`/problems/${resumeProblem?.slug || 'two-sum'}`} className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 transition text-center shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group">
                  Resume challenge <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/problems" className="text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition">Browse all problems</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BADGE PROGRESS BAR */}
      <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500/10 text-amber-500 rotate-45 border border-amber-500/20">
              <div className="-rotate-45"><Award className="h-4 w-4" /></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your first verified skill badge</h3>
              <p className="text-xs text-slate-500">Pass 5 challenges — recruiters can independently verify the result.</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {completedCount > 0 ? <><span className="text-slate-900 dark:text-white">{completedCount} of 5</span> — almost there</> : <><span className="text-slate-900 dark:text-white">0</span> of 5 solved</>}
          </div>
        </div>
        
        {/* 5 segments */}
        <div className="flex gap-2 h-2.5 w-full mb-3">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className={`h-full bg-brand-500 transition-all duration-1000 ease-out`} 
                style={{ width: step <= completedCount ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> verifiable credential</span>
          <span className="hidden sm:inline">Issued on-chain (ERC-721) so proof outlives any single platform</span>
        </div>
      </div>

      {/* 4 METRICS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Solved */}
        <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Challenges solved</span>
            <div className="text-slate-300 dark:text-slate-600"><CheckCircle2 className="h-4 w-4" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{completedCount}</span>
            <span className="text-sm font-semibold text-slate-500">/ 5</span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-emerald-500 flex items-center gap-1">
            {isNewStudent ? <span className="text-slate-400">Solve one to open your track</span> : <><TrendingUp className="h-3 w-3" /> 100% auto-graded correct</>}
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Streak</span>
            <div className="text-orange-500"><Flame className="h-4 w-4" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.currentStreak}</span>
            <span className="text-sm font-semibold text-slate-500">days</span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            {isNewStudent ? 'Your first solve starts it' : `Best: ${stats.longestStreak} days - solve today to extend`}
          </div>
        </div>

        {/* Skill badges */}
        <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Skill badges</span>
            <div className="text-slate-300 dark:text-slate-600 rotate-45 border border-current rounded px-0.5"><Award className="h-3 w-3 -rotate-45" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.badgesEarned}</span>
            <span className="text-sm font-semibold text-slate-500">earned</span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-amber-500">
            {isNewStudent ? <span className="text-slate-400">First badge at 5 solves</span> : `${5 - (completedCount % 5)} solve away from your first`}
          </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Accuracy</span>
            <div className="text-slate-300 dark:text-slate-600"><Activity className="h-4 w-4" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{accuracy}</span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            {isNewStudent ? 'Tracks once you submit' : `${passedFirstTry} of ${submissions.length} passed first try`}
          </div>
        </div>
      </div>

      {/* TIER PROGRESS BAR */}
      <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs font-bold">
          <div className="text-slate-500 uppercase">Tier <span className="text-brand-600 dark:text-brand-400">{userTier.toUpperCase()}</span> → {nextTierName}</div>
          <div className="text-slate-400"><span className="text-slate-900 dark:text-white">{userXp}</span> / {nextTierXp} XP {userXp > 0 && `- ${xpProgress}% to ${nextTierName}`}</div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${xpProgress}%` }} />
        </div>
        <p className="text-[11px] font-medium text-slate-500">
          {nextTierName} tier unlocks harder challenges worth more XP — and the badges recruiters filter by most.
        </p>
      </div>

      {/* BOTTOM SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended Next */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-brand-500" /> Recommended next
            </h2>
            <Link to="/problems" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-[16px] bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {problems.slice(0, 3).map((problem) => (
                <div key={problem.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white ${
                      problem.tier === 'Explorer' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/20' :
                      problem.tier === 'Builder' ? 'bg-amber-600/20 text-amber-500 border border-amber-500/20' :
                      'bg-purple-600/20 text-purple-500 border border-purple-500/20'
                    }`}>
                      {problem.tier[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 rounded-sm ${
                          problem.tier === 'Explorer' ? 'bg-emerald-500/10 text-emerald-500' :
                          problem.tier === 'Builder' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {problem.tier === 'Explorer' ? 'Easy' : problem.tier === 'Builder' ? 'Medium' : 'Hard'} - {problem.tier}
                        </span>
                        <span className="text-[10px] text-slate-500">~15 min</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{problem.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <span className="text-xs font-bold text-amber-500">+{problem.reward} XP</span>
                    <Link to={`/problems/${problem.slug}`} className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white hover:bg-brand-600 hover:text-white transition-colors">
                      Solve →
                    </Link>
                  </div>
                </div>
              ))}

              {/* Learning Center CTA */}
              <Link to="/learning" className="flex items-center justify-between rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-4 hover:bg-slate-50 dark:hover:bg-[#131B2F] transition group mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500/10 text-indigo-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Stuck? Learning Center</h4>
                    <p className="text-[10px] text-slate-500">Short video lessons for every problem type and tier</p>
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" /> Recent activity
            </h2>
            <Link to="/submissions" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">All →</Link>
          </div>

          <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm overflow-hidden h-full min-h-[300px]">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
            ) : isNewStudent ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-slate-950/20 animate-in fade-in duration-700">
                <Code2 className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Nothing here yet</h3>
                <p className="text-[11px] text-slate-500 mb-6">Your submissions and badge progress will land here.</p>
                <Link to={`/problems/${firstProblem?.slug || 'two-sum'}`} className="rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition">
                  Solve {firstProblem?.title || 'Two Sum'} →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {submissions.slice(0, 4).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition group">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${sub.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {sub.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{sub.problem?.title || 'Challenge'}</h4>
                        <p className="text-[10px] text-slate-500">
                          {sub.status === 'completed' ? 'Passed' : 'Failed'} • {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {sub.status === 'completed' ? (
                      <span className="text-xs font-bold text-amber-500">+{sub.score || 100} XP</span>
                    ) : (
                      <Link to={`/problems/${sub.problem?.slug}`} className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">Retry</Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
