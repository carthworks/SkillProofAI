import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, CheckCircle2, AlertCircle, Clock, CreditCard } from 'lucide-react';

export default function Refund() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Consumer Protection & Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-slate-500 font-mono text-xs">
            Effective Date: September 21, 2026 • FTC Click-to-Cancel & Consumer Rights Compliant
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-emerald-500" /> 1. Challenge Tier Purchases
            </h2>
            <p>
              SkillProofAI offers paid challenge tiers (e.g. Basic ₹199, Advanced ₹499) that unlock specialized evaluation suites, unlimited re-tests, and blockchain verification fees.
            </p>
            <p>
              We maintain a <strong>7-Day No-Questions-Asked Refund Window</strong> for any challenge tier purchase, provided the candidate has not yet submitted code for grading in that tier.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" /> 2. Self-Serve 1-Click Cancellation (FTC Compliant)
            </h2>
            <p>
              Canceling or requesting a refund must be just as easy as signing up:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Navigate to your <Link to="/settings" className="text-emerald-600 dark:text-emerald-400 underline font-semibold">Settings & Billing</Link> tab.</li>
              <li>Click <strong>"Request Refund"</strong> under your active order history.</li>
              <li>Alternatively, email <a href="mailto:support@skillproof.ai" className="text-emerald-600 dark:text-emerald-400 underline font-semibold">support@skillproof.ai</a> with your order ID.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> 3. Processing Timelines & Payout Methods
            </h2>
            <p>
              Approved refunds are processed via Razorpay directly back to your original payment method (UPI, Debit/Credit Card, Net Banking) within <strong>5 to 7 business days</strong>.
            </p>
          </section>

          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> 4. Non-Refundable Items
            </h2>
            <p>
              Once a code submission is graded by our worker isolates and an ERC-721 badge is minted on the Polygon blockchain, the gas fees and computation costs are irreversible, and that specific completed challenge tier cannot be refunded.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
