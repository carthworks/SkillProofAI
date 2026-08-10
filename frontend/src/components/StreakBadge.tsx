import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  if (streak === 0) return null;

  const sizes = {
    sm: { container: 'px-2 py-1 gap-1 text-[10px]', icon: 'h-3 w-3' },
    md: { container: 'px-3 py-1.5 gap-1.5 text-xs', icon: 'h-4 w-4' },
    lg: { container: 'px-4 py-2 gap-2 text-sm', icon: 'h-5 w-5' },
  };

  const s = sizes[size];
  const hot = streak >= 7;

  return (
    <div
      className={`inline-flex items-center ${s.container} rounded-full font-extrabold transition-all ${
        hot
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
          : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50'
      }`}
    >
      <Flame className={`${s.icon} ${hot ? 'text-yellow-300' : 'text-orange-500'}`} />
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
      {hot && <span className="ml-0.5 text-yellow-200">🔥</span>}
    </div>
  );
}
