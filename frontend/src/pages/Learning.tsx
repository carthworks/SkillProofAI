import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlayCircle, BookOpen, ChevronRight, RotateCcw, Flame, CheckCircle2, Clock, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';

interface LMSVideo {
  id: string;
  title: string;
  slug: string;
  domain: string;
  tier: string;
  youtubeId?: string;
  description?: string;
  duration?: number;
  tags?: string[];
}

function formatDuration(seconds?: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TIER_COLOR: Record<string, string> = {
  Explorer: 'text-emerald-500 bg-emerald-500/10',
  Builder: 'text-indigo-500 bg-indigo-500/10',
  Architect: 'text-purple-500 bg-purple-500/10',
};

export default function Learning() {
  const [videos, setVideos] = useState<LMSVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<LMSVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [retestUnlocked, setRetestUnlocked] = useState(false);
  const [retestLoading, setRetestLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnSlug = searchParams.get('from'); // e.g. /learning?from=lru-cache&domain=cse&tier=Builder

  useEffect(() => {
    const domain = searchParams.get('domain') || undefined;
    const tier = searchParams.get('tier') || undefined;
    if (domain) setDomainFilter(domain);
    if (tier) setTierFilter(tier);

    api.get(`/lms/videos${domain || tier || returnSlug ? `?${new URLSearchParams({ ...(domain && { domain }), ...(tier && { tier }), ...(returnSlug && { problemSlug: returnSlug }) }).toString()}` : ''}`)
      .then(res => {
        setVideos(res.data);
        if (res.data.length > 0) setSelectedVideo(res.data[0]);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startWatchTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWatchedPercent(0);
    setRetestUnlocked(false);
    // Simulate watching progress: reach 60% = retest unlock
    intervalRef.current = setInterval(() => {
      setWatchedPercent(prev => {
        const next = Math.min(prev + 1, 100);
        if (next >= 60 && !retestUnlocked) setRetestUnlocked(true);
        if (next >= 100 && intervalRef.current) clearInterval(intervalRef.current);
        return next;
      });
    }, 500); // 1% every 500ms → 60% in ~30s for demo
  };

  const handleUnlockRetest = async () => {
    if (!returnSlug) {
      navigate('/problems');
      return;
    }
    setRetestLoading(true);
    try {
      await api.post(`/lms/retest/${returnSlug}`);
    } catch (e) { /* best effort */ }
    setRetestLoading(false);
    navigate(`/problems/${returnSlug}`);
  };

  const filteredVideos = videos.filter(v =>
    (domainFilter === 'all' || v.domain === domainFilter) &&
    (tierFilter === 'all' || v.tier === tierFilter)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {returnSlug && (
              <button onClick={() => navigate(`/problems/${returnSlug}`)} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-500" /> Learning Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {returnSlug
              ? `Watch relevant videos to understand the concepts, then retake the challenge.`
              : 'Curated video lessons mapped to every problem domain and tier.'}
          </p>
        </div>
        {returnSlug && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            📋 Returning to: <span className="font-black">{returnSlug.replace(/-/g, ' ')}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            {selectedVideo ? (
              <>
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-xl">
                  {selectedVideo.youtubeId ? (
                    <iframe
                      key={selectedVideo.youtubeId}
                      src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      onLoad={startWatchTimer}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <PlayCircle className="h-16 w-16 opacity-30" />
                    </div>
                  )}
                </div>

                {/* Video Info + Watch Progress */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedVideo.title}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedVideo.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${TIER_COLOR[selectedVideo.tier] || 'text-slate-500 bg-slate-100'}`}>
                      {selectedVideo.tier}
                    </span>
                  </div>

                  {/* Watch progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Watch Progress</span>
                      <span className={watchedPercent >= 60 ? 'text-emerald-500' : 'text-slate-400'}>{watchedPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${watchedPercent >= 60 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                        style={{ width: `${watchedPercent}%` }}
                      />
                    </div>
                    {watchedPercent < 60 && (
                      <p className="text-[10px] text-slate-400">Watch at least 60% to unlock the retest button</p>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVideo.tags.map(tag => (
                        <span key={tag} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Retest Button */}
                  {returnSlug && (
                    <button
                      onClick={handleUnlockRetest}
                      disabled={!retestUnlocked || retestLoading}
                      className={`w-full rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                        retestUnlocked
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {retestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : retestUnlocked ? <RotateCcw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      {retestUnlocked ? '✅ Retest Unlocked — Go Back to Problem' : `Watch ${Math.max(0, 60 - watchedPercent)}% more to unlock retest`}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                <div className="text-center space-y-2">
                  <PlayCircle className="h-10 w-10 mx-auto opacity-30" />
                  <p className="text-sm">Select a video to start learning</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Playlist */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none">
                <option value="all">All Domains</option>
                <option value="cse">CSE</option>
                <option value="ece">ECE</option>
              </select>
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none">
                <option value="all">All Tiers</option>
                <option value="Explorer">Explorer</option>
                <option value="Builder">Builder</option>
                <option value="Architect">Architect</option>
              </select>
            </div>

            {/* Video List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredVideos.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No videos match the current filters.</div>
              ) : filteredVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVideo(v)}
                  className={`w-full text-left rounded-2xl border p-4 space-y-1.5 transition ${
                    selectedVideo?.id === v.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${TIER_COLOR[v.tier] || ''}`}>{v.tier}</span>
                    {v.duration && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(v.duration)}</span>}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">{v.title}</p>
                  {selectedVideo?.id === v.id && <div className="flex items-center gap-1 text-[10px] font-bold text-brand-500"><PlayCircle className="h-3 w-3" /> Now Playing</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
