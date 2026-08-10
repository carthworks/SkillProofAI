import { useState, useEffect } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({ score, size = 120, strokeWidth = 10 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s smooth animation

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(1, (timestamp - startTimestamp) / duration);
      
      // Easing out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [score]);

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getGradientColors = (val: number) => {
    if (val >= 80) {
      return { start: '#10b981', end: '#14b8a6', text: 'text-emerald-400' };
    } else if (val >= 50) {
      return { start: '#6366f1', end: '#3b82f6', text: 'text-indigo-400' };
    } else {
      return { start: '#f59e0b', end: '#ef4444', text: 'text-amber-400' };
    }
  };

  const colors = getGradientColors(score);

  return (
    <div className="relative inline-flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800/80 fill-none"
        />

        {/* Animated Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center Score Metric Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-0.5">
          <span className={`text-2xl font-extrabold tracking-tight ${colors.text}`}>
            {animatedScore}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">/100</span>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Score
        </span>
      </div>
    </div>
  );
}
