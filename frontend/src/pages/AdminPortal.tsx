import { ShieldAlert } from 'lucide-react';

export default function AdminPortal() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="h-20 w-20 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Admin Portal</h1>
      <p className="text-slate-500 max-w-md">
        Welcome to the Admin Portal. The administrative dashboard is currently under construction in this MVP phase.
        Please use the sidebar to navigate to the Leaderboard or other shared views.
      </p>
    </div>
  );
}
