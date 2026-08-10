import { useState } from 'react';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'bug' | 'idea' | 'other'>('idea');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('talentforge_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

      await axios.post(`${apiUrl}/students/feedback`, { message, type }, { headers });
      toast.success('Feedback submitted! Thanks for helping us improve.');
      setIsOpen(false);
      setMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feedback. Try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between bg-purple-600 px-4 py-3">
            <h3 className="font-bold text-white text-sm">Beta Feedback</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-slate-200 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
              <div className="flex gap-2">
                {(['idea', 'bug', 'other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition capitalize ${
                      type === t
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:border-purple-500 focus:outline-none min-h-[100px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform hover:scale-110"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
      </button>
    </div>
  );
}
