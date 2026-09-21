import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import ResultsPanel, { ExpertReviewData } from './ResultsPanel';
import { GradingResult, SubmissionStatus } from '../hooks/useGradingSocket';
import { TestCaseResult } from './TestCaseTable';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SubmissionStatus;
  result: GradingResult | null;
  logs: string[];
  errorCode?: 'COMPILE_ERROR' | 'TIMEOUT' | 'OOM' | string | null;
  stderr?: string | null;
  testCaseResults?: TestCaseResult[];
  expertReview?: ExpertReviewData | null;
}

export default function ExecutionModal({
  isOpen,
  onClose,
  ...resultsProps
}: ExecutionModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-8">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Absolute Close Button overriding ResultsPanel top-right space */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-4 z-10 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* The Results Panel handles its own header (status chips) and scrolling body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ResultsPanel {...resultsProps} />
        </div>
      </div>
    </div>
  );
}
