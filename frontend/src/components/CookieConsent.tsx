import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tf_cookie_consent');
    if (!consent) {
      // Small timeout so it doesn't jarringly block the initial paint
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (level: 'all' | 'essential') => {
    localStorage.setItem('tf_cookie_consent', JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
    }));
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" /> Privacy & Cookie Choices
        </div>
        <button
          onClick={() => handleConsent('essential')}
          aria-label="Close cookie banner"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        We use essential cookies to keep you signed in and protect sandbox submissions. We respect your choice regarding optional telemetry cookies. Read our{' '}
        <Link to="/privacy" className="underline text-emerald-600 dark:text-emerald-400 font-semibold">
          Privacy Policy
        </Link>{' '}
        for details.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => handleConsent('all')}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
        >
          Accept All
        </button>
        <button
          onClick={() => handleConsent('essential')}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
