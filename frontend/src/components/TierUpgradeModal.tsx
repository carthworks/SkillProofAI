import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, CreditCard, CheckCircle2, X, Loader2, Sparkles, Star } from 'lucide-react';
import api from '../services/api';

interface TierUpgradeModalProps {
  tier: 'basic' | 'advanced';
  onClose: () => void;
  onSuccess: (unlockedTier: string) => void;
  problemTitle?: string;
}

const TIER_DETAILS = {
  basic: {
    price: 199,
    label: 'Basic Unlock',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    badge: 'text-blue-400',
    features: [
      'All Explorer + Builder tier problems',
      'Sandbox autograding with full score',
      'Leaderboard ranking visibility',
      'Submission history & sparkline',
      'AI feedback coaching bullets',
    ],
  },
  advanced: {
    price: 499,
    label: 'Advanced Unlock',
    color: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
    badge: 'text-purple-400',
    features: [
      'Everything in Basic',
      'All Architect-tier flagship problems',
      'AI evaluation + Expert Human Review',
      'ERC-721 NFT badge on passing',
      'LinkedIn OG badge share card',
      'Priority Reviewer queue placement',
    ],
  },
};

declare global {
  interface Window { Razorpay: any; }
}

export default function TierUpgradeModal({ tier, onClose, onSuccess, problemTitle }: TierUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const details = TIER_DETAILS[tier];

  const loadRazorpayScript = () =>
    new Promise<boolean>(resolve => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      // Create order on backend
      const { data } = await api.post('/payments/create-order', { tier });
      const { orderId, amount, currency, keyId, mock } = data;

      if (mock) {
        // Demo mode: simulate successful payment without real Razorpay
        await api.post('/payments/verify', {
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          tier,
          mock: true,
        });
        setSuccess(true);
        setTimeout(() => onSuccess(tier), 1500);
        return;
      }

      // Open Razorpay Checkout
      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'TalentForge',
        description: `${details.label} — Unlock ${tier === 'advanced' ? 'Architect' : 'Builder'} Challenges`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier,
            });
            setSuccess(true);
            setTimeout(() => onSuccess(tier), 1500);
          } catch (e) {
            setError('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: '', email: '' },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-md overflow-hidden rounded-3xl border bg-gradient-to-br ${details.color} bg-white dark:bg-slate-900 shadow-2xl`}>
        {/* Blobs */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 hover:bg-slate-800/40 transition text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-white">🎉 {details.label} Unlocked!</h3>
              <p className="text-sm text-slate-300">You now have access to all {tier === 'advanced' ? 'Architect-level problems and Expert Human Review' : 'Explorer & Builder challenges'}.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unlock Required</p>
                  <h3 className="text-lg font-extrabold text-white">{problemTitle ? `"${problemTitle}"` : details.label}</h3>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {details.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">One-time payment</p>
                  <p className="text-3xl font-black text-white">₹{details.price}</p>
                </div>
                <div className={`text-[11px] font-black uppercase tracking-widest rounded-full px-3 py-1.5 bg-white/10 border border-white/20 ${details.badge}`}>
                  {details.label}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-3 text-xs font-semibold text-red-400">{error}</div>
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full rounded-xl bg-white py-3.5 text-sm font-extrabold text-slate-900 hover:bg-slate-100 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {loading ? 'Processing...' : `Pay ₹${details.price} with Razorpay`}
              </button>

              <p className="text-center text-[10px] text-slate-500">
                Secured by Razorpay • 256-bit SSL encryption • Refund within 7 days
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
