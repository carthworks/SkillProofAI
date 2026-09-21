import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-500 font-mono text-xs">
            Last Updated: September 21, 2026 • Version 1.2
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> 1. Overview & Data Controller
            </h2>
            <p>
              SkillProofAI Technologies Pvt. Ltd. ("SkillProofAI", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy describes how we collect, store, process, and disclose your personal data when you use our platform, APIs, sandboxes, and verification registries.
            </p>
            <p>
              For privacy inquiries or to exercise your statutory rights under GDPR, CCPA/CPRA, or the Digital Personal Data Protection Act (DPDP), contact our Data Protection Officer at: <a href="mailto:privacy@skillproof.ai" className="text-emerald-600 dark:text-emerald-400 underline font-semibold">privacy@skillproof.ai</a>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-500" /> 2. Personal Data We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Identification:</strong> Name, academic email address, educational institution, degree, and hashed credentials.</li>
              <li><strong>Candidate Code Submissions:</strong> Source code uploaded to problem sandboxes, compiler outputs, runtime execution logs, test case results, and complexity scoring data.</li>
              <li><strong>Psychometric & Velocity Telemetry:</strong> Anonymized problem-solving velocity metrics, attempt counts, and cognitive persistence indices.</li>
              <li><strong>Blockchain Badge Data:</strong> Public cryptographic wallet addresses and token IDs recorded on the Polygon blockchain (ERC-721). Note that on-chain records are immutable by design.</li>
              <li><strong>Device & Session Data:</strong> IP address, browser type, operating system, and session tokens stored in secure, encrypted HTTP cookies.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" /> 3. Legal Bases for Processing
            </h2>
            <p>We process your personal information under the following legal frameworks:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contract Performance:</strong> To create your account, evaluate code submissions in our grading workers, and deliver verified badge credentials.</li>
              <li><strong>Legitimate Interest:</strong> To maintain platform security, prevent automated plagiarism or sandbox escapes, and improve autograding algorithms.</li>
              <li><strong>Consent:</strong> To display your public candidate profile to verified recruiters (which you may toggle on or off in your Settings at any time).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-500" /> 4. Your Rights & Data Erasure
            </h2>
            <p>
              You have the right to request access to your personal data, request correction of inaccurate records, download your verified submission history, or request full account erasure. To request account deletion, navigate to your <Link to="/settings" className="text-emerald-600 dark:text-emerald-400 underline">Settings</Link> or email <a href="mailto:privacy@skillproof.ai" className="text-emerald-600 dark:text-emerald-400 underline">privacy@skillproof.ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
