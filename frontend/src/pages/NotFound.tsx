import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 max-w-lg text-center space-y-6">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-600/20 to-purple-500/20 border border-brand-500/30 text-brand-400 shadow-2xl">
          <Compass className="h-12 w-12 animate-pulse" />
          <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-md">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            The page or workspace location you requested does not exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition shadow-lg shadow-brand-500/20"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Link>

          <Link
            to="/problems"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Problem Board
          </Link>
        </div>
      </div>
    </div>
  );
}
