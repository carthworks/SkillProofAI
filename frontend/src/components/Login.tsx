import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Github, Linkedin, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_HOME: Record<string, string> = {
  employer: '/discover',
  recruiter: '/discover',
  company: '/discover',
  reviewer: '/reviewer',
  admin: '/admin',
};

function getRoleHome(email: string): string {
  const lower = email.toLowerCase();
  for (const [key, path] of Object.entries(ROLE_HOME)) {
    if (lower.includes(key)) return path;
  }
  return '/dashboard';
}

const DEMO_CREDS = [
  { role: 'Student', email: 'student@college.edu', password: 'password123', color: '#059669' },
  { role: 'Reviewer', email: 'reviewer@talentforge.in', password: 'Reviewer123!', color: '#4F46E5' },
  { role: 'Employer', email: 'employer@talentforge.in', password: 'password123', color: '#F59E0B' },
  { role: 'Admin', email: 'admin@talentforge.in', password: 'Admin123!', color: '#EF4444' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setApiError(null);
      setIsSubmitting(true);
      await login(data.email, data.password);
      navigate(getRoleHome(data.email), { replace: true });
    } catch (err: any) {
      setApiError(err.response?.data?.error || 'Invalid credentials or connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setApiError(null);
  };

  const handleGitHubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId || clientId === 'your_github_client_id') {
      setApiError('GitHub OAuth not configured. Use email/password login.');
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth-callback?provider=github`);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${redirectUri}`;
  };

  const handleLinkedInLogin = () => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    if (!clientId || clientId === 'your_linkedin_client_id') {
      setApiError('LinkedIn OAuth not configured. Use email/password login.');
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth-callback?provider=linkedin`);
    const scope = encodeURIComponent('openid profile email');
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FBFBF9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .login-input{width:100%;border:1px solid #D8DBD5;border-radius:10px;background:#fff;padding:10px 14px;font-size:14px;color:#111826;outline:none;transition:.15s;box-sizing:border-box}
        .login-input:focus{border-color:#4F46E5;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
        .login-input.error{border-color:#EF4444}
        .login-btn-primary{width:100%;background:#4F46E5;color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;transition:.15s;display:flex;align-items:center;justify-content:center;gap:8px}
        .login-btn-primary:hover{background:#4338CA}
        .login-btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .login-btn-oauth{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;border:1px solid #D8DBD5;background:#fff;color:#111826}
        .login-btn-oauth:hover{border-color:#9AA3AF;background:#F9FAFB}
        .login-demo-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #E7E9E5;borderRadius:8px;padding:6px 12px;font-size:11.5px;cursor:pointer;transition:.12s;background:#fff;fontFamily:'JetBrains Mono',monospace;color:#111826}
        .login-demo-chip:hover{border-color:#9AA3AF;background:#F9FAFB}
      `}</style>

      {/* Back to Home */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#4B5563', fontSize: 13, fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
          <span style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 16, color: '#111826' }}>TalentForge</span>
        </Link>
        <Link to="/register" style={{ fontSize: 13, color: '#4B5563', fontWeight: 500, textDecoration: 'none' }}>
          No account? <span style={{ color: '#4F46E5', fontWeight: 600 }}>Sign up</span>
        </Link>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1px solid #E7E9E5', borderRadius: 20, padding: 32, boxShadow: '0 1px 2px rgba(17,24,38,.04), 0 16px 40px -16px rgba(17,24,38,.12)' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: '#111826', margin: 0 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#4B5563', marginTop: 6 }}>Sign in to your TalentForge workspace</p>
        </div>

        {/* Error */}
        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#DC2626', marginBottom: 20, fontWeight: 500 }}>
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4B5563', marginBottom: 6, fontFamily: 'JetBrains Mono,monospace' }}>Email</label>
            <input type="email" {...register('email')} className={`login-input${errors.email ? ' error' : ''}`} placeholder="you@college.edu" />
            {errors.email && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4B5563', marginBottom: 6, fontFamily: 'JetBrains Mono,monospace' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} {...register('password')} className={`login-input${errors.password ? ' error' : ''}`} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9AA3AF', padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="login-btn-primary" style={{ marginTop: 4 }}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: '#9AA3AF', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <div style={{ flex: 1, borderTop: '1px solid #E7E9E5' }} />
          or continue with
          <div style={{ flex: 1, borderTop: '1px solid #E7E9E5' }} />
        </div>

        {/* OAuth */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button type="button" onClick={handleGitHubLogin} className="login-btn-oauth">
            <Github size={16} /> GitHub
          </button>
          <button type="button" onClick={handleLinkedInLogin} className="login-btn-oauth" style={{ background: '#0A66C2', color: '#fff', borderColor: '#0A66C2' }}>
            <Linkedin size={16} /> LinkedIn
          </button>
        </div>

        {/* Demo Creds */}
        <div style={{ marginTop: 28, padding: 16, background: '#F2F6F4', borderRadius: 12, border: '1px solid #E7E9E5' }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Demo accounts — click to fill</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_CREDS.map(({ role, email, password, color }) => (
              <button key={role} type="button" onClick={() => fillDemo(email, password)} className="login-demo-chip" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{role}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9AA3AF', marginTop: 10, fontFamily: 'JetBrains Mono,monospace' }}>All passwords: password123 (or shown above)</p>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: '#9AA3AF', fontFamily: 'JetBrains Mono,monospace' }}>© 2026 TalentForge · Proof over résumé inflation</p>
    </div>
  );
}
