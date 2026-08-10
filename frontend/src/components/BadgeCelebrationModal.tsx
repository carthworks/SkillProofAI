import { useEffect, useState } from 'react';
import { Award, Share2, X, ExternalLink, Sparkles } from 'lucide-react';

interface BadgeCelebrationModalProps {
  badgeTitle: string;
  badgeId?: string;
  score?: number;
  onClose: () => void;
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'][i % 6],
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm animate-bounce"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

export default function BadgeCelebrationModal({ badgeTitle, badgeId, score, onClose }: BadgeCelebrationModalProps) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://app.talentforge.in/verify/${badgeId ?? ''}`)}`,
      '_blank'
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl">
        <Confetti />

        <button onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full p-2 hover:bg-white/10 transition text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/40">
                <Award className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[10px] font-black text-amber-400 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> NFT Badge Earned
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">{badgeTitle}</h2>
            {score !== undefined && (
              <p className="text-sm text-slate-300">
                Score: <span className="font-extrabold text-emerald-400">{score}/100</span>
              </p>
            )}
            <p className="text-xs text-slate-400 leading-relaxed">
              Your skill credential has been minted as an ERC-721 NFT on the Polygon Amoy testnet and added to your profile.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={shareOnLinkedIn}
              className="w-full rounded-xl bg-[#0A66C2] py-3 text-xs font-extrabold text-white hover:bg-[#004182] transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Share2 className="h-4 w-4" /> Share on LinkedIn
            </button>
            {badgeId && (
              <a
                href={`/verify/${badgeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Verification Page
              </a>
            )}
            <button onClick={onClose} className="w-full rounded-xl bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 transition">
              Continue Solving
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
