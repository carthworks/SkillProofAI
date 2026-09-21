import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Terminal, Users, Cpu, ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            About SkillProofAI
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Proof Over Résumé Inflation
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            SkillProofAI is a performance-verified engineering talent platform. We replace keyword-stuffed résumés with tamper-proof, cryptographic code execution proofs evaluated in isolated Docker sandboxes and verified on the Polygon blockchain.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-4">
              <Terminal className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold mb-2">High-Fidelity Sandbox</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real code executed in memory-bounded isolates with multi-tiered public and hidden test suites, measuring correctness, time, and space complexity.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold mb-2">Polygon On-Chain Proofs</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Verified test achievements mint immutable ERC-721 badge records with SHA-256 code outputs that recruiters can audit with 1 click.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold mb-2">Human & AI Evaluation</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Two-factor evaluation combining automated AST complexity parsing, psychometric velocity indexes, and senior industry architect reviews.
            </p>
          </div>
        </div>

        {/* Company & Team Info */}
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-xl font-bold">Operating Entity & Headquarters</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            SkillProofAI Technologies Pvt. Ltd.<br />
            Bangalore, Karnataka, India<br />
            Official Contact: <a href="mailto:contact@skillproof.ai" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">contact@skillproof.ai</a>
          </p>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-xs font-mono text-slate-500">
            <span>© 2026 SkillProofAI Technologies</span>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link to="/refund" className="hover:underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
