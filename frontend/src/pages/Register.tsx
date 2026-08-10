import { Link } from 'react-router-dom';
import Register from '../components/Register';

export default function RegisterPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justify: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Brand Header */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--ink2)', fontSize: 13, fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>TalentForge</span>
        </Link>
        <Link to="/login" style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500, textDecoration: 'none' }}>
          Have an account? <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>Sign in</span>
        </Link>
      </div>

      <Register />

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--ink3)', fontFamily: 'JetBrains Mono, monospace' }}>
        © 2026 TalentForge · Proof over résumé inflation
      </p>
    </div>
  );
}
