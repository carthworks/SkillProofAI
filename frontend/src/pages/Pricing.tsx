import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Zap, Sparkles, HelpCircle } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Upfront & Transparent Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Simple Tiers. Zero Hidden Fees.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
            All prices include applicable taxes. What you see is what you pay. Backed by our 7-day money-back guarantee.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Explorer</div>
              <div className="text-3xl font-extrabold mb-1">₹0</div>
              <p className="text-xs text-slate-500 mb-6">Always free for students</p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Access to 5 Foundational Challenges</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Automated Correctness Grading</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Public Student Profile</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Global Leaderboard Placement</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 block text-center w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Builder Tier */}
          <div className="p-8 rounded-3xl border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/10 flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Builder</div>
              <div className="text-3xl font-extrabold mb-1">₹199</div>
              <p className="text-xs text-slate-500 mb-6">One-time challenge tier unlock</p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> All Explorer Features</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 10 Intermediate Challenges</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Big-O Runtime & Space Profiling</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Polygon On-Chain Verified Badge</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Recruiter Discovery Spotlight</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="mt-8 block text-center w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
            >
              Unlock Builder Tier →
            </Link>
          </div>

          {/* Architect Tier */}
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500 mb-2">Architect</div>
              <div className="text-3xl font-extrabold mb-1">₹499</div>
              <p className="text-xs text-slate-500 mb-6">One-time flagship challenge pass</p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> All Builder Features</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> System Design & Distributed Challenges</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Senior Architect Human Code Review</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Direct Interview Fast-Track with Hiring Partners</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="mt-8 block text-center w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Unlock Architect Tier →
            </Link>
          </div>
        </div>

        {/* Policy & Support Note */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>All transactions secured with 256-bit encryption via Razorpay.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/refund" className="hover:underline text-emerald-600 dark:text-emerald-400 font-semibold">Refund Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
