import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Building2, User, Mail, Lock } from 'lucide-react';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const candidateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  domain: z.enum(['cse', 'ece'] as const),
});

const employerSchema = z.object({
  name: z.string().min(2, 'Full name required'),
  company: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CandidateForm = z.infer<typeof candidateSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = (error?: boolean) =>
  `w-full rounded-xl border ${
    error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
  } bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition`;

const lbl = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

function FieldIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      {icon}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const { registerUser, setSession } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

  const candidateForm = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { domain: 'cse' },
  });

  const employerForm = useForm<EmployerForm>({
    resolver: zodResolver(employerSchema),
  });

  // ── Candidate submit ──────────────────────────────────────────────────────

  const onCandidateSubmit = async (data: CandidateForm) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      await registerUser(data.name, data.email, data.domain, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Employer submit — simple registration only, onboarding comes next ─────

  const onEmployerSubmit = async (data: EmployerForm) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      const res = await fetch(`${apiUrl}/auth/register-employer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          company: data.company,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Employer registration failed');
      if (result.accessToken && result.refreshToken) {
        await setSession(result.accessToken, result.refreshToken);
      }
      // Redirect to employer-specific onboarding wizard
      navigate('/employer-onboarding');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get started with TalentForge verified skill proof
        </p>
      </div>

      {/* Role Toggle */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-1">
        {([
          { val: false, label: 'Candidate Student' },
          { val: true,  label: 'Employer Recruiter' },
        ] as const).map(({ val, label }) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => { setIsEmployer(val); setApiError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              isEmployer === val
                ? val
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      {/* ── CANDIDATE FORM ─────────────────────────────────────────────────── */}
      {!isEmployer && (
        <form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)} className="space-y-4">
          <div>
            <label className={lbl}>Full Name</label>
            <div className="relative">
              <FieldIcon icon={<User className="h-4 w-4" />} />
              <input
                {...candidateForm.register('name')}
                className={inp(!!candidateForm.formState.errors.name) + ' pl-9'}
                placeholder="Rohan Sharma"
              />
            </div>
            {candidateForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-500">{candidateForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={lbl}>Email Address</label>
            <div className="relative">
              <FieldIcon icon={<Mail className="h-4 w-4" />} />
              <input
                type="email"
                {...candidateForm.register('email')}
                className={inp(!!candidateForm.formState.errors.email) + ' pl-9'}
                placeholder="rohan@college.edu"
              />
            </div>
            {candidateForm.formState.errors.email && (
              <p className="mt-1 text-xs text-red-500">{candidateForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={lbl}>Engineering Domain</label>
            <select {...candidateForm.register('domain')} className={inp()}>
              <option value="cse">Computer Science Engineering (CSE)</option>
              <option value="ece">Electronics & Communication Engineering (ECE)</option>
            </select>
          </div>

          <div>
            <label className={lbl}>Password</label>
            <div className="relative">
              <FieldIcon icon={<Lock className="h-4 w-4" />} />
              <input
                type="password"
                {...candidateForm.register('password')}
                className={inp(!!candidateForm.formState.errors.password) + ' pl-9'}
                placeholder="••••••••"
              />
            </div>
            {candidateForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-500">{candidateForm.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating account...' : 'Create Candidate Account →'}
          </button>
        </form>
      )}

      {/* ── EMPLOYER FORM — quick signup only ─────────────────────────────── */}
      {isEmployer && (
        <form onSubmit={employerForm.handleSubmit(onEmployerSubmit)} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl px-3 py-2">
            After registration you'll complete your hiring profile — booking links, target roles, and candidate filters.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Your Name</label>
              <div className="relative">
                <FieldIcon icon={<User className="h-4 w-4" />} />
                <input
                  {...employerForm.register('name')}
                  className={inp(!!employerForm.formState.errors.name) + ' pl-9'}
                  placeholder="Sarah Jenkins"
                />
              </div>
              {employerForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">{employerForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className={lbl}>Company</label>
              <div className="relative">
                <FieldIcon icon={<Building2 className="h-4 w-4" />} />
                <input
                  {...employerForm.register('company')}
                  className={inp(!!employerForm.formState.errors.company) + ' pl-9'}
                  placeholder="Stripe"
                />
              </div>
              {employerForm.formState.errors.company && (
                <p className="mt-1 text-xs text-red-500">{employerForm.formState.errors.company.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={lbl}>Work Email</label>
            <div className="relative">
              <FieldIcon icon={<Mail className="h-4 w-4" />} />
              <input
                type="email"
                {...employerForm.register('email')}
                className={inp(!!employerForm.formState.errors.email) + ' pl-9'}
                placeholder="sarah@stripe.com"
              />
            </div>
            {employerForm.formState.errors.email && (
              <p className="mt-1 text-xs text-red-500">{employerForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={lbl}>Password</label>
            <div className="relative">
              <FieldIcon icon={<Lock className="h-4 w-4" />} />
              <input
                type="password"
                {...employerForm.register('password')}
                className={inp(!!employerForm.formState.errors.password) + ' pl-9'}
                placeholder="••••••••"
              />
            </div>
            {employerForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-500">{employerForm.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating account...' : 'Create Employer Account →'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
