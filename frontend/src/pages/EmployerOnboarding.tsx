import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Globe, Calendar, Briefcase, SlidersHorizontal,
  Check, ChevronRight, Sparkles, ExternalLink, Pencil, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Company Profile',   icon: <Building2 className="h-5 w-5" /> },
  { id: 2, title: 'Hiring Criteria',   icon: <Briefcase className="h-5 w-5" /> },
  { id: 3, title: 'Interview Booking', icon: <Calendar className="h-5 w-5" /> },
  { id: 4, title: 'Review & Save',     icon: <Sparkles className="h-5 w-5" /> },
];

const inp = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition';
const lbl = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmployerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // true when updating existing profile

  // Form state — pre-filled after fetching profile
  const [form, setForm] = useState({
    companyWebsite: '',
    domain: 'cse',
    targetRoles: '',
    minScoreThreshold: 75,
    bookingProvider: 'calendly',
    bookingUrl: '',
  });

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Load existing profile data on mount ───────────────────────────────────

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/profile');
        const profile = res.data?.profile ?? res.data;

        // Parse links array for companyWebsite and bookingUrl
        const links: { label: string; url: string }[] = profile?.links ?? [];
        const websiteLink = links.find(l => l.label === 'Company Website');
        const bookingLink = links.find(l => l.label === 'Interview Booking');

        // Parse aiSummary JSON blob for hiring criteria
        let parsed: any = {};
        try { parsed = JSON.parse(profile?.aiSummary ?? '{}'); } catch {}

        // Detect edit mode: user has been through onboarding before
        if (profile?.onboardingComplete) setIsEditMode(true);

        // Pre-fill form with existing data
        setForm({
          companyWebsite: websiteLink?.url ?? '',
          domain: profile?.domain ?? parsed?.domain ?? 'cse',
          targetRoles: (parsed?.targetRoles ?? []).join(', '),
          minScoreThreshold: parsed?.minScoreThreshold ?? 75,
          bookingProvider: 'calendly',
          bookingUrl: (() => {
            // Priority: DB link > localStorage
            if (bookingLink?.url) return bookingLink.url;
            try {
              const s = localStorage.getItem('tf_app_settings');
              return s ? (JSON.parse(s).bookingUrl ?? '') : '';
            } catch { return ''; }
          })(),
        });
      } catch (err) {
        // Fallback: just use localStorage if API fails
        const bookingUrl = (() => {
          try {
            const s = localStorage.getItem('tf_app_settings');
            return s ? (JSON.parse(s).bookingUrl ?? '') : '';
          } catch { return ''; }
        })();
        setForm(prev => ({ ...prev, bookingUrl }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ── Save & finish ─────────────────────────────────────────────────────────

  const handleFinish = async () => {
    try {
      setSaving(true);

      const links: { label: string; url: string }[] = [];
      if (form.companyWebsite) links.push({ label: 'Company Website', url: form.companyWebsite });
      if (form.bookingUrl)     links.push({ label: 'Interview Booking', url: form.bookingUrl });

      await api.patch('/students/profile', {
        links,
        domain: form.domain,
        aiSummary: JSON.stringify({
          targetRoles: form.targetRoles.split(',').map(r => r.trim()).filter(Boolean),
          domain: form.domain,
          minScoreThreshold: form.minScoreThreshold,
        }),
        onboardingComplete: true,
      });

      // Sync booking URL to localStorage Settings
      if (form.bookingUrl) {
        const saved = JSON.parse(localStorage.getItem('tf_app_settings') || '{}');
        localStorage.setItem('tf_app_settings', JSON.stringify({ ...saved, bookingUrl: form.bookingUrl }));
      }

      toast.success(isEditMode ? 'Hiring profile updated!' : 'Employer profile complete! Welcome to TalentForge.');
      navigate('/discover');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save. Redirecting...');
      navigate('/discover');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ── Step Indicator ────────────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, idx) => {
        const done   = step > s.id;
        const active = step === s.id;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => done && setStep(s.id)} // allow jumping back to completed steps
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 cursor-pointer hover:scale-105'
                    : active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/20 scale-110'
                    : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-900 cursor-default'
                }`}
                title={done ? `Edit ${s.title}` : s.title}
              >
                {done ? <Check className="h-5 w-5 stroke-[3]" /> : s.icon}
              </button>
              <span className={`mt-1.5 text-[10px] font-bold text-center ${
                active ? 'text-indigo-600 dark:text-indigo-400' :
                done   ? 'text-slate-700 dark:text-slate-300' :
                         'text-slate-400'
              }`}>{s.title}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mt-[-18px] transition-colors duration-500 ${
                step > s.id ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-50 dark:bg-slate-950 pt-16 pb-12 px-4 font-sans">
      <div className="w-full max-w-lg space-y-6">

        {/* Page header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 px-4 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            {isEditMode ? <Pencil className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {isEditMode ? 'Edit Hiring Profile' : 'Employer Profile Setup'}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Update your hiring preferences' : 'Complete your hiring profile'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? 'Changes are saved immediately and reflect in Smart Match and interview requests.'
              : 'This takes 2 minutes. You can update everything later from Settings.'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <StepIndicator />

          {/* ── Step 1: Company Profile ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Company Information</h2>

              <div>
                <label className={lbl}>Engineering Domain You Hire For</label>
                <select value={form.domain} onChange={e => set('domain', e.target.value)} className={inp}>
                  <option value="cse">Computer Science Engineering (CSE)</option>
                  <option value="ece">Electronics & Communication Engineering (ECE)</option>
                </select>
              </div>

              <div>
                <label className={lbl}>
                  Company Website{' '}
                  <span className="text-[10px] font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    value={form.companyWebsite}
                    onChange={e => set('companyWebsite', e.target.value)}
                    className={inp + ' pl-9'}
                    placeholder="https://stripe.com"
                  />
                </div>
                {form.companyWebsite && (
                  <a href={form.companyWebsite} target="_blank" rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Hiring Criteria ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Hiring Criteria</h2>

              <div>
                <label className={lbl}>
                  Target Roles{' '}
                  <span className="text-[10px] font-normal normal-case text-slate-400">(comma-separated)</span>
                </label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.targetRoles}
                    onChange={e => set('targetRoles', e.target.value)}
                    className={inp + ' pl-9'}
                    placeholder="Backend Engineer, React Developer, DevOps"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Used by AI Smart Match to surface the most relevant candidates.
                </p>
              </div>

              <div>
                <label className={lbl + ' flex items-center justify-between'}>
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Min Candidate Score Threshold
                  </span>
                  <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                    {form.minScoreThreshold}%
                  </span>
                </label>
                <input
                  type="range" min={0} max={100} step={5}
                  value={form.minScoreThreshold}
                  onChange={e => set('minScoreThreshold', Number(e.target.value))}
                  className="w-full h-2 cursor-pointer rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>0% — Show All</span>
                  <span>75% — Recommended</span>
                  <span>100% — Elite Only</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Interview Booking Link ───────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Interview Scheduling</h2>

              <div>
                <label className={lbl}>Booking Provider</label>
                <select value={form.bookingProvider} onChange={e => set('bookingProvider', e.target.value)} className={inp}>
                  <option value="calendly">Calendly (e.g., calendly.com/name/30min)</option>
                  <option value="cal">Cal.com (Open Source)</option>
                  <option value="google">Google Calendar Booking</option>
                  <option value="ms">Microsoft Bookings</option>
                  <option value="custom">Custom URL / Webhook</option>
                </select>
              </div>

              <div>
                <label className={lbl + ' flex items-center justify-between'}>
                  <span>Booking / Scheduling URL</span>
                  {form.bookingUrl && (
                    <a href={form.bookingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-semibold normal-case">
                      Test Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    value={form.bookingUrl}
                    onChange={e => set('bookingUrl', e.target.value)}
                    className={inp + ' pl-9 font-mono text-xs'}
                    placeholder="https://calendly.com/your-name/30min"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Auto-fills every time you send an interview request to a shortlisted candidate.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Back
                </button>
                <button onClick={() => setStep(4)} className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition">
                  Review <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Save ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {isEditMode ? 'Review your changes' : 'All set — review & go live'}
              </h2>

              {/* Summary table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800 text-sm overflow-hidden">
                {[
                  { label: 'Domain',           value: form.domain.toUpperCase(), step: 1 },
                  { label: 'Company Website',  value: form.companyWebsite || '—', step: 1 },
                  { label: 'Target Roles',     value: form.targetRoles || '—', step: 2 },
                  { label: 'Min Score Filter', value: `${form.minScoreThreshold}%`, step: 2 },
                  { label: 'Booking URL',      value: form.bookingUrl ? form.bookingUrl.slice(0, 38) + '…' : '—', step: 3 },
                ].map(({ label, value, step: s }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 group">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{value}</span>
                      <button
                        type="button"
                        onClick={() => setStep(s)}
                        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-indigo-500"
                        title={`Edit ${label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400">
                You can update all of this anytime from{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Settings → Workspace</span> or by visiting this page again.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    : <><Check className="h-4 w-4 stroke-[3]" /> {isEditMode ? 'Save Changes' : 'Go to Talent Discovery'}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          {isEditMode ? (
            <>Changes are synced immediately with the Discover portal. </>
          ) : (
            <>
              Want to explore first?{' '}
              <button onClick={() => navigate('/discover')} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Skip to Discover Talent
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
