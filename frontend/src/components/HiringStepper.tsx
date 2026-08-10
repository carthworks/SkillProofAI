import { useState } from 'react';
import { Check, Search, BookmarkCheck, ShieldCheck, CalendarPlus, Award, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export type HiringStage = 'DISCOVERED' | 'SHORTLISTED' | 'VERIFIED' | 'INTERVIEWING' | 'OFFERED';

export interface StepConfig {
  id: HiringStage;
  label: string;
  sublabel: string;
  icon: JSX.Element;
}

export const HIRING_STEPS: StepConfig[] = [
  {
    id: 'DISCOVERED',
    label: 'Discovered',
    sublabel: 'Smart Match / Search',
    icon: <Search className="h-3.5 w-3.5" />,
  },
  {
    id: 'SHORTLISTED',
    label: 'Shortlisted',
    sublabel: 'Saved to Pipeline',
    icon: <BookmarkCheck className="h-3.5 w-3.5" />,
  },
  {
    id: 'VERIFIED',
    label: 'Sandbox Verified',
    sublabel: 'Score & Badges Proven',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  {
    id: 'INTERVIEWING',
    label: 'Interview Scheduled',
    sublabel: 'Calendly Link Active',
    icon: <CalendarPlus className="h-3.5 w-3.5" />,
  },
  {
    id: 'OFFERED',
    label: 'Hired / Offered',
    sublabel: 'Official Offer Extended',
    icon: <Award className="h-3.5 w-3.5" />,
  },
];

interface HiringStepperProps {
  /** Current stage loaded from DB or parent */
  currentStage?: HiringStage;
  /** Candidate ID — required for API updates */
  candidateId?: string;
  /** Called after a successful API update */
  onStageChange?: (newStage: HiringStage) => void;
  interactive?: boolean;
  compact?: boolean;
}

export default function HiringStepper({
  currentStage = 'SHORTLISTED',
  candidateId,
  onStageChange,
  interactive = true,
  compact = false,
}: HiringStepperProps) {
  const [activeStage, setActiveStage] = useState<HiringStage>(currentStage);
  const [saving, setSaving] = useState(false);

  const getStageIndex = (stage: HiringStage) =>
    HIRING_STEPS.findIndex((s) => s.id === stage);

  const currentIndex = getStageIndex(activeStage);

  const handleStepClick = async (stage: HiringStage) => {
    if (!interactive || saving || stage === activeStage) return;

    // Optimistic update
    const previous = activeStage;
    setActiveStage(stage);

    // If no candidateId, just call local callback (no API)
    if (!candidateId) {
      onStageChange?.(stage);
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/employers/shortlist/${candidateId}/stage`, {
        hiringStage: stage,
      });
      onStageChange?.(stage);
      toast.success(`Stage updated → ${HIRING_STEPS.find(s => s.id === stage)?.label}`);
    } catch (err: any) {
      // Rollback on failure
      setActiveStage(previous);
      toast.error(err?.response?.data?.error || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  // ── Compact pill row ──────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {HIRING_STEPS.map((step, idx) => {
          const isDone    = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!interactive || saving}
                onClick={() => handleStepClick(step.id)}
                title={`Set to ${step.label}`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer'
                    : isCurrent
                    ? 'bg-indigo-600 text-white font-extrabold shadow-sm ring-2 ring-indigo-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-500 cursor-pointer'
                }`}
              >
                {saving && isCurrent
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : isDone
                  ? <Check className="h-3 w-3" />
                  : step.icon}
                <span>{step.label}</span>
              </button>
              {idx < HIRING_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Full horizontal stepper ───────────────────────────────────────────────

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Employer Candidate Hiring Pipeline Status
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
          {saving && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
          Stage {currentIndex + 1} of {HIRING_STEPS.length}: {HIRING_STEPS[currentIndex].label}
        </span>
      </div>

      {/* Progress bar + step circles */}
      <div className="relative flex items-center justify-between w-full">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-200 dark:bg-slate-800 z-0" />
        {/* Fill */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-brand-500 z-0 transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / (HIRING_STEPS.length - 1)) * 100}%` }}
        />

        {HIRING_STEPS.map((step, idx) => {
          const isDone    = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                disabled={!interactive || saving}
                onClick={() => handleStepClick(step.id)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:scale-110 cursor-pointer'
                    : isCurrent
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20 scale-110'
                    : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 cursor-pointer'
                } disabled:cursor-not-allowed`}
                title={`Set stage to ${step.label}`}
              >
                {saving && isCurrent
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isDone
                  ? <Check className="h-4 w-4 stroke-[3]" />
                  : step.icon}
              </button>

              <div className="mt-2 text-center max-w-[100px]">
                <p className={`text-[11px] font-bold leading-tight transition-colors ${
                  isCurrent
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : isDone
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
