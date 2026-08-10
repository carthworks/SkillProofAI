import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Code2, Cpu, Sparkles, Database, Brain, FileText, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const DOMAINS = [
  { id: 'cse', label: 'Computer Science', icon: <Code2 className="h-6 w-6" />, description: 'Algorithms, Data Structures, System Design, Distributed Systems', color: 'from-brand-500/20 to-indigo-500/10 border-brand-500/40', activeColor: 'from-brand-500/40 to-indigo-500/20 border-brand-500' },
  { id: 'ece', label: 'Electronics & Comm', icon: <Cpu className="h-6 w-6" />, description: 'Signal Processing, Embedded Systems, VLSI, Communication Systems', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40', activeColor: 'from-amber-500/40 to-orange-500/20 border-amber-500' },
  { id: 'cs-ai', label: 'CS + Artificial Intelligence', icon: <Brain className="h-6 w-6" />, description: 'ML Algorithms, Neural Networks, NLP, Computer Vision', color: 'from-purple-500/20 to-violet-500/10 border-purple-500/40', activeColor: 'from-purple-500/40 to-violet-500/20 border-purple-500' },
  { id: 'data-science', label: 'Data Science', icon: <Database className="h-6 w-6" />, description: 'Statistics, BigData, Pandas, SQL, Visualization, ETL Pipelines', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40', activeColor: 'from-emerald-500/40 to-teal-500/20 border-emerald-500' },
];

const STEPS = ['Verify Profile', 'Academic Details', 'Select Domain', 'Ready to Code'];

interface OnboardingModalProps {
  onComplete: () => void;
  userName?: string;
}

export default function OnboardingModal({ onComplete, userName = 'Candidate' }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [year, setYear] = useState('2nd Year');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async () => {
    if (!selectedDomain) return;
    setLoading(true);
    try {
      await api.put('/auth/onboarding', { 
        selectedDomain,
        college,
        degree,
        graduationYear: year
      });
    } catch (e) {
      // Best-effort; proceed even if API fails
      console.warn('[Onboarding] API call failed, proceeding locally');
    } finally {
      setLoading(false);
      onComplete();
      navigate('/profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Blobs */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-7 space-y-6">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-black">{step + 1}</div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{STEPS[step]}</span>
            </div>
            {/* Step dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'} ${i === step ? 'w-8' : 'w-4'}`} />
              ))}
            </div>
          </div>

          {/* Step 0: Welcome + Social Verify */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome, {userName}! 👋</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Let's set up your TalentForge profile in 4 quick steps.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">What you'll set up</p>
                {['Verify your identity', 'Add academic details', 'Choose your engineering domain', 'Start solving problems & earning badges'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 transition flex items-center justify-center gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 1: Academic Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Academic Details</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Help employers understand your educational background.</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">College / University</label>
                  <input
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 transition"
                    placeholder="e.g. IIT Madras, Anna University"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Degree</label>
                    <select value={degree} onChange={e => setDegree(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none">
                      {['B.Tech', 'M.Tech', 'B.E', 'M.E', 'MCA', 'B.Sc', 'M.Sc'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Year</label>
                    <select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none">
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 transition flex items-center justify-center gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Domain Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Select Your Domain</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This tailors your problem track, challenges, and learning path.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DOMAINS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    className={`relative rounded-2xl border bg-gradient-to-br p-4 text-left transition-all duration-200 ${
                      selectedDomain === d.id ? d.activeColor + ' shadow-md' : d.color + ' hover:opacity-90'
                    }`}
                  >
                    {selectedDomain === d.id && (
                      <div className="absolute top-2 right-2"><CheckCircle2 className="h-4 w-4 text-brand-500" /></div>
                    )}
                    <div className="text-slate-700 dark:text-slate-200 mb-2">{d.icon}</div>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{d.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{d.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition">Back</button>
                <button onClick={() => setStep(3)} disabled={!selectedDomain} className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-40 transition flex items-center justify-center gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready — route to Proof Profile */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <FileText className="h-10 w-10 text-indigo-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">One last step 📄</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Your domain is set to{' '}
                  <span className="font-bold text-indigo-500">{DOMAINS.find(d => d.id === selectedDomain)?.label}</span>.
                  Now upload your resume — our AI will extract your skills as <strong>unverified claims</strong>. Solve a challenge to verify each one.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-4 space-y-2 text-left">
                <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">🔑 How it works</p>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2"><span className="text-indigo-500">①</span><span>Upload resume → AI extracts your skills</span></div>
                  <div className="flex items-center gap-2"><span className="text-brand-500">②</span><span>Solve a tailored challenge per skill</span></div>
                  <div className="flex items-center gap-2"><span className="text-emerald-500">③</span><span>Claim flips to <strong>Verified ◈</strong> — badge minted</span></div>
                </div>
              </div>
              <button onClick={handleFinish} disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Build my Proof Profile <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
