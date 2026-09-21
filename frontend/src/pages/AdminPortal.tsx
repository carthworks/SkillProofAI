import { Shield, Trophy, LayoutDashboard, Search, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPortal() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 py-12">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-3xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xl shadow-rose-500/10">
          <Shield className="h-10 w-10" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          MVP
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
        Admin Portal
      </h1>

      <p className="text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed text-sm sm:text-base mb-8">
        Welcome to the Admin Portal. The administrative dashboard is currently under construction in this MVP phase. Please use the sidebar to navigate to the Leaderboard or other shared views.
      </p>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        <Link
          to="/leaderboard"
          className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-brand-500/50 hover:shadow-md transition group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Leaderboard</div>
              <div className="text-[11px] text-slate-500">Platform rankings</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          to="/discover"
          className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-brand-500/50 hover:shadow-md transition group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Discover</div>
              <div className="text-[11px] text-slate-500">Talent search</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          to="/guide"
          className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-brand-500/50 hover:shadow-md transition group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Guide</div>
              <div className="text-[11px] text-slate-500">Documentation</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
}

