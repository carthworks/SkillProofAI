import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, Download, Share2, ArrowLeft, Copy, Check, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface VerificationData {
  ok: boolean;
  verifyId: string;
  title: string;
  problemTitle: string;
  score: number;
  status: string;
  issuedAt: string;
  pdfUrl: string;
  candidate: {
    id: string;
    name: string;
    domain: string;
    isAnonymized: boolean;
  };
}

export default function VerifyBadge() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

  useEffect(() => {
    async function fetchVerification() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await axios.get(`${apiUrl}/verify/${id}`);
        setData(res.data);
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(err.response?.data?.error || 'Verification Failed: Badge not found in TalentForge registry.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVerification();
  }, [id, apiUrl]);

  // Inject Dynamic OpenGraph (OG) and Twitter Meta Tags into Document Head
  useEffect(() => {
    if (data) {
      document.title = `${data.title} - ${data.candidate.name} | TalentForge Verification`;

      const setMetaTag = (property: string, content: string, isName = false) => {
        const attr = isName ? 'name' : 'property';
        let element = document.querySelector(`meta[${attr}="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attr, property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      const title = `${data.title} - ${data.candidate.name}`;
      const desc = `Verified ${data.score}/100 score on ${data.problemTitle} via TalentForge AI Platform. Cryptographic Proof: ${data.verifyId}`;
      const image = `https://app.talentforge.in/assets/badge-verify-og.png`;
      const url = window.location.href;

      setMetaTag('og:title', title);
      setMetaTag('og:description', desc);
      setMetaTag('og:image', image);
      setMetaTag('og:url', url);
      setMetaTag('og:type', 'website');
      setMetaTag('twitter:card', 'summary_large_image', true);
      setMetaTag('twitter:title', title, true);
      setMetaTag('twitter:description', desc, true);
      setMetaTag('twitter:image', image, true);
    }
  }, [data]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Public verification URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInShare = () => {
    const text = encodeURIComponent(`Verified ${data?.score}/100 technical score on ${data?.problemTitle} via TalentForge AI.`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Verifying cryptographic AI badge credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30">
            <Award className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Verification Failed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'The requested badge ID could not be verified against the TalentForge public ledger.'}
          </p>
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const pdfDownloadUrl = `${apiUrl}/verify/${data.verifyId}/pdf`;
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isExpertVerified = data.status === 'EXPERT_VERIFIED' || data.status === 'Expert Verified';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-12 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Top Branding Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-lg shadow-lg shadow-purple-500/30">
              TF
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">TalentForge AI Verification Portal</h1>
              <p className="text-xs text-slate-400">Official Cryptographic Skill Registry</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4" /> Verified Authentic
          </span>
        </div>

        {/* Main Certificate Card */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 p-8 shadow-2xl space-y-6">
          {/* Certificate Header Badge */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner">
              <Award className="h-8 w-8 text-amber-300" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              {data.title}
              <Sparkles className="h-5 w-5 text-amber-400" />
            </h2>
            <p className="text-xs font-semibold text-purple-300/80 uppercase tracking-widest">
              Verified Technical Competency Certificate
            </p>
          </div>

          {/* Certificate Main Grid */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-slate-950/70 p-5 border border-slate-800/80 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Candidate</span>
              <span className="font-bold text-white text-base">{data.candidate.name}</span>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Domain: {data.candidate.domain?.toUpperCase() || 'ENGINEERING'}</span>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Verified Score</span>
              <span className="font-extrabold text-emerald-400 text-xl tracking-tight">{data.score} / 100</span>

              {/* Dynamic Status Chip */}
              <div className="pt-1 flex sm:justify-end">
                {isExpertVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-0.5 text-xs font-extrabold text-purple-300 border border-purple-500/40">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-400" /> Expert Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-extrabold text-emerald-300 border border-emerald-500/40">
                    <Bot className="h-3.5 w-3.5 text-emerald-400" /> AI Verified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60 sm:col-span-2 flex flex-wrap justify-between items-center text-[11px] text-slate-400">
              <span>Challenge: <strong className="text-slate-200">{data.problemTitle}</strong></span>
              <span>Issued Date: <strong className="text-slate-200">{formattedDate}</strong></span>
            </div>
          </div>

          {/* Verification UUID & QR Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-slate-950 p-4 border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verification UUID</span>
              <code className="font-mono text-purple-300 text-xs bg-purple-950/40 px-2.5 py-1 rounded border border-purple-800/40">
                {data.verifyId}
              </code>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const shareText = `I just earned the ${data.title} on TalentForge with a verified score of ${data.score}/100! 🚀 Verified technical proof.`;
                  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                  window.open(linkedinUrl, '_blank', 'width=600,height=600');
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
              >
                <Share2 className="h-4 w-4" /> Share on LinkedIn
              </button>

              <a
                href={pdfDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500"
              >
                <Download className="h-4 w-4" /> Download PDF Certificate
              </a>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied Link!' : 'Copy Verification URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 pt-12">
        <p>© 2026 TalentForge AI Engine. All verification proofs are cryptographically recorded.</p>
      </div>
    </div>
  );
}
