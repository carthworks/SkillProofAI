import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setSession(accessToken, refreshToken)
        .then(() => {
          console.log('OAuth session set successfully');
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to parse OAuth callback session:', err);
          navigate('/login?error=OAuthFailed', { replace: true });
        });
    } else {
      console.warn('OAuth callback query parameters missing');
      navigate('/login?error=OAuthMissingParams', { replace: true });
    }
  }, [searchParams, setSession, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"></div>
        <p className="text-sm font-medium text-slate-500">Establishing secure session...</p>
      </div>
    </div>
  );
}
