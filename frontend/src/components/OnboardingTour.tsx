import { useState, useEffect } from 'react';
import { Compass, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OnboardingTourProps {
  autoStart?: boolean;
}

export default function OnboardingTour({ autoStart = false }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('talentforge_tour_seen');
    if (autoStart || !hasSeenTour) {
      setIsOpen(true);
    }
  }, [autoStart]);

  const tourSteps = [
    {
      title: 'Welcome to TalentForge 🚀',
      subtitle: 'Step 1 of 4 • Platform Overview',
      content:
        'TalentForge replaces resume inflation with AI psychometrics and automated code execution proof. Earn cryptographically verified skills credentials backed by real output.',
      badge: 'Interactive Guided Onboarding',
    },
    {
      title: 'Diagnostic Psychometric Assessment 🧠',
      subtitle: 'Step 2 of 4 • 5-Trait Dimension Radar',
      content:
        'Take our 15-minute timed assessment measuring Logical Reasoning, Attention to Detail, Persistence, Learning Speed, and Architecture. View your dynamic AI-generated fingerprint.',
      badge: '15-Minute Countdown',
    },
    {
      title: 'Verified Monaco Execution Environment 💻',
      subtitle: 'Step 3 of 4 • Code Verification & Flagships',
      content:
        'Solve algorithmic challenges like "Build a Load Balancer" in Monaco Editor. Solutions are tested against 10 hidden test cases (Round-Robin, Weighted, Health Checks).',
      badge: 'Automated Test Execution',
    },
    {
      title: 'Badges, PDF Proof & Employer Discovery 🏆',
      subtitle: 'Step 4 of 4 • Shareable Credentials',
      content:
        'Scores ≥75 unlock shareable PDF certificates and LinkedIn credentials. Employers explore candidate radar charts, scores, and code samples on the Recruiter Discover Portal.',
      badge: 'Expert & AI Verified',
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('talentforge_tour_seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl border border-purple-500/40 bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-purple-300 shadow-2xl backdrop-blur-md hover:bg-purple-600 hover:text-white transition"
      >
        <Compass className="h-4 w-4 text-purple-400" /> Start Guided Tour
      </button>
    );
  }

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 p-8 shadow-2xl shadow-purple-500/20 text-left space-y-6 font-sans text-slate-100">
        {/* Header Badge & Close */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-[10px] font-extrabold text-purple-300 border border-purple-500/40 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" /> {step.badge}
          </span>

          <button
            onClick={handleComplete}
            className="rounded-full bg-slate-800/80 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">{step.subtitle}</span>
          <h2 className="text-xl font-black text-white tracking-tight leading-snug">{step.title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">{step.content}</p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-1.5 pt-2">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-purple-500' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-500/25"
          >
            {currentStep === tourSteps.length - 1 ? (
              <>
                Finish Tour <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Next Step <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
