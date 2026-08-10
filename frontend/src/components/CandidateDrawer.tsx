import { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  X,
  User,
  ShieldCheck,
  Star,
  Bookmark,
  BookmarkCheck,
  Lock,
  Code2,
  Brain,
  Sparkles,
  BarChart3,
  Bot,
  CalendarPlus,
} from 'lucide-react';
import HiringStepper, { HiringStage } from './HiringStepper';
import RadarChart from './RadarChart';
import api from '../services/api';
import { toast } from 'sonner';

export interface CandidateData {
  id: string;
  name: string;
  email: string;
  domain: string;
  tier: string;
  score: number;
  badges: any[];
  profilePublic: boolean;
  psychProfile: {
    logical: number;
    detail: number;
    persistence: number;
    learning: number;
  };
  bestProblem: string;
  bestLanguage: string;
  bestCodeSample: string;
  submittedAt?: string;
  isShortlisted?: boolean;
  hiringStage?: HiringStage;
  college?: string;
  degree?: string;
  graduationYear?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  skills?: any[];
  githubScore?: number;
  scoreBreakdown?: {
    profileStrength: number;
    githubScore: number;
    problemScore: number;
    assessmentScore: number;
  };
}

interface CandidateDrawerProps {
  isOpen: boolean;
  candidate: CandidateData | null;
  onClose: () => void;
  onToggleShortlist?: (candidateId: string) => void;
  onStageChange?: (newStage: HiringStage) => void;
}

export default function CandidateDrawer({
  isOpen,
  candidate,
  onClose,
  onToggleShortlist,
}: CandidateDrawerProps) {
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [schedulingLink, setSchedulingLink] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bookingUrl) return parsed.bookingUrl;
      }
    } catch {}
    return 'https://calendly.com/carthworks/30min';
  });
  const [interviewNote, setInterviewNote] = useState('');
  const [isSendingInterview, setIsSendingInterview] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleSendInterviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingLink) {
      toast.error('Scheduling link is required');
      return;
    }
    
    try {
      setIsSendingInterview(true);
      await api.post('/employers/request-interview', {
        candidateId: candidate.id,
        schedulingLink,
        note: interviewNote,
      });
      toast.success(`Interview request sent to ${candidate.name}!`);
      setIsInterviewModalOpen(false);
      setSchedulingLink('');
      setInterviewNote('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setIsSendingInterview(false);
    }
  };

  const traitScores = [
    { trait: 'Logical Reasoning', value: candidate.psychProfile.logical, fullMark: 100 },
    { trait: 'Attention to Detail', value: candidate.psychProfile.detail, fullMark: 100 },
    { trait: 'Persistence', value: candidate.psychProfile.persistence, fullMark: 100 },
    { trait: 'Learning Speed', value: candidate.psychProfile.learning, fullMark: 100 },
    { trait: 'System Architecture', value: candidate.score, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-all ease-in-out duration-300 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col font-sans text-slate-900 dark:text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 font-black text-lg border border-purple-500/30">
                {candidate.name[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{candidate.name}</h2>
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                    {candidate.domain} • {candidate.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleShortlist(candidate.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md ${
                  candidate.isShortlisted
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {candidate.isShortlisted ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" /> In Shortlist
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Shortlist Candidate
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <CalendarPlus className="h-4 w-4" /> Request Interview
              </button>

              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customized Employer Horizontal Stepper */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
              <HiringStepper
                candidateId={candidate.id}
                currentStage={candidate.hiringStage ?? (candidate.isShortlisted ? 'SHORTLISTED' : 'DISCOVERED')}
                onStageChange={(newStage) => {
                  onStageChange?.(newStage);
                }}
              />

            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center group relative cursor-help">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Aggregate Score</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{candidate.score}/100</span>
                
                {candidate.scoreBreakdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left border border-slate-700">
                    <div className="font-bold mb-2 border-b border-slate-700 pb-1">Score Breakdown Formula</div>
                    <div className="flex justify-between mb-1"><span>Profile Strength (15%)</span> <span className="font-mono text-emerald-400">{candidate.scoreBreakdown.profileStrength}</span></div>
                    <div className="flex justify-between mb-1"><span>GitHub Score (10%)</span> <span className="font-mono text-emerald-400">{candidate.scoreBreakdown.githubScore}</span></div>
                    <div className="flex justify-between mb-1"><span>Problem Score (50%)</span> <span className="font-mono text-emerald-400">{candidate.scoreBreakdown.problemScore}</span></div>
                    <div className="flex justify-between"><span>Assessment (25%)</span> <span className="font-mono text-emerald-400">{candidate.scoreBreakdown.assessmentScore}</span></div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Badges Earned</span>
                <span className="text-2xl font-black text-purple-400 font-mono">{candidate.badges?.length || 1}</span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Profile Privacy</span>
                <span className={`text-xs font-extrabold uppercase mt-1.5 inline-block ${candidate.profilePublic ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {candidate.profilePublic ? 'Public Code' : 'Private'}
                </span>
              </div>
            </div>

            {/* Comprehensive Candidate Details */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <User className="h-4 w-4 text-indigo-400" /> Comprehensive Profile
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Education</span>
                  <div className="text-slate-700 dark:text-slate-300">
                    {candidate.college ? (
                      <>
                        <div className="font-semibold">{candidate.degree}</div>
                        <div>{candidate.college} • Class of {candidate.graduationYear}</div>
                      </>
                    ) : (
                      <span className="italic text-slate-500">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">External Links</span>
                  <div className="space-y-1">
                    {candidate.githubUsername && <a href={`https://github.com/${candidate.githubUsername}`} target="_blank" rel="noreferrer" className="block text-indigo-500 hover:underline">GitHub Profile</a>}
                    {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="block text-indigo-500 hover:underline">LinkedIn</a>}
                    {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="block text-indigo-500 hover:underline">View Resume</a>}
                    {!candidate.githubUsername && !candidate.linkedinUrl && !candidate.resumeUrl && <span className="italic text-slate-500">No links provided</span>}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Verified & Claimed Skills</span>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((skill: any, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {skill.name} <span className="text-slate-400 ml-1">({skill.level})</span>
                      </span>
                    ))
                  ) : (
                    <span className="italic text-slate-500 text-sm">No skills added</span>
                  )}
                </div>
              </div>
            </div>

            {/* 5-Trait Psychometric Radar Section */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" /> AI Psychometric Trait Fingerprint
              </h3>

              <div className="flex justify-center bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <RadarChart data={traitScores} width={360} height={280} />
              </div>
            </div>

            {/* Code Sample Access Control Inspection View */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-purple-400" /> Best Code Sample ({candidate.bestProblem})
                </span>
                <span className="text-[11px] font-mono text-purple-300 uppercase">{candidate.bestLanguage}</span>
              </div>

              <div className="p-4 pt-0">
                {candidate.profilePublic ? (
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <Editor
                      height="100%"
                      defaultLanguage={candidate.bestLanguage === 'javascript' ? 'javascript' : 'python'}
                      value={candidate.bestCodeSample}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        fontSize: 12,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 10, bottom: 10 },
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center space-y-2">
                    <Lock className="h-8 w-8 text-amber-400 mx-auto" />
                    <h4 className="text-xs font-bold text-amber-300">Code Access Privacy Protected</h4>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Candidate has set their profile to Private. High-level psychometric scores and verified badges are visible, but direct code access requires candidate authorization.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Request Modal */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-indigo-500" /> Request Interview
              </h3>
              <button onClick={() => setIsInterviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendInterviewRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Scheduling Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g., https://calendly.com/your-name"
                  value={schedulingLink}
                  onChange={(e) => setSchedulingLink(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Optional Note
                </label>
                <textarea
                  placeholder={`Hi ${candidate.name}, we'd love to chat with you about your recent test...`}
                  value={interviewNote}
                  onChange={(e) => setInterviewNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInterview}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isSendingInterview ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
