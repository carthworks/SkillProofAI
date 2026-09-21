import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-slate-500 font-mono text-xs">
            Effective Date: September 21, 2026 • Version 1.1
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-500" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the SkillProofAI platform, registering an account, or submitting code to our grading runners, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> 2. Sandbox Security & Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Submit code designed to exploit, break out of, or denial-of-service our Docker execution sandboxes or host machines.</li>
              <li>Attempt unauthorized network egress, port scanning, or accessing AWS/MinIO/database infrastructure from within compiler isolates.</li>
              <li>Deploy automated bots to bypass problem rate limits or manipulate leaderboard standings.</li>
              <li>Plagiarize solutions from other candidates or commercial test banks.</li>
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
              Violations will result in immediate permanent account termination and revocation of all issued Polygon badge credentials.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-500" /> 3. Intellectual Property Rights
            </h2>
            <p>
              <strong>Your Code:</strong> You retain 100% copyright and ownership of the original code solutions you author and submit to SkillProofAI challenges.
            </p>
            <p>
              <strong>Platform IP:</strong> SkillProofAI retains all rights to the assessment problems, hidden test cases, autograding algorithms, visual badge designs, and platform source code.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-slate-500" /> 4. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of the platform shall be subject to the exclusive jurisdiction of the competent courts in Bangalore, Karnataka, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
