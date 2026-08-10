import axios from 'axios';
import {
  Award,
  Building,
  Code2,
  ExternalLink,
  FileCheck,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Link2,
  Linkedin,
  Lock,
  Mail,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  User,
  Users,
  CheckCircle2,
  Star,
  Activity,
  Key,
  Database,
  Terminal,
  Cpu,
} from 'lucide-react';
import { useEffect, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import BadgeCard, { BadgeData } from '../components/BadgeCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { getUserBadges } from '../services/api';

type CandidateTabType =
  | 'personal'
  | 'academic'
  | 'skills'
  | 'achievements'
  | 'resume'
  | 'social'
  | 'blockchain'
  | 'security'
  | 'applications'
  | 'preferences';

export default function Profile() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userRole = (user?.role || 'STUDENT').toUpperCase();

  // Return role-specific view
  if (userRole === 'REVIEWER') {
    return <ReviewerProfileView />;
  } else if (userRole === 'EMPLOYER') {
    return <EmployerProfileView />;
  } else if (userRole === 'ADMIN') {
    return <AdminProfileView />;
  } else {
    return <StudentCandidateProfileView />;
  }
}

/* ==========================================================================
   1. STUDENT CANDIDATE PROFILE VIEW
   ========================================================================== */
function StudentCandidateProfileView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CandidateTabType>('resume');
  const [resumeState, setResumeState] = useState<'upload' | 'uploading' | 'parsing' | 'review'>('upload');
  const [parseStep, setParseStep] = useState('Extracting skills...');
  const [parsedData, setParsedData] = useState<any>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [verifiedSlugs, setVerifiedSlugs] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobileNumber: '',
    githubUsername: '',
    linkedinUrl: '',
    profilePublic: false,
    freezeProfile: false,
    skills: [] as {name: string, level: string}[],
    education: [] as {college: string, degree: string, graduationYear: string}[],
    links: [] as {label: string, url: string}[],
    resumeUrl: '',
    aggregateScore: 0,
    aiSummary: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute profile strength dynamically
  const profileStrength = Math.round([
    !!formData.name,
    !!formData.mobileNumber,
    !!formData.githubUsername,
    !!formData.linkedinUrl,
    !!formData.resumeUrl,
    formData.skills.length > 0,
    formData.links.length > 0,
  ].filter(Boolean).length / 7 * 100);

  useEffect(() => {
    api.get('/students/profile').then(res => {
      setFormData(prev => ({
        ...prev,
        name: res.data.name || prev.name,
        mobileNumber: res.data.mobileNumber || '',
        githubUsername: res.data.githubUsername || '',
        linkedinUrl: res.data.linkedinUrl || '',
        profilePublic: res.data.profilePublic ?? false,
        freezeProfile: res.data.profileFrozen ?? false,
        skills: (res.data.skills as any[] | null) || [],
        education: (res.data.college || res.data.degree) 
          ? [{ college: res.data.college || '', degree: res.data.degree || '', graduationYear: res.data.graduationYear || '' }] 
          : [],
        links: (res.data.links as any[] | null) || [],
        resumeUrl: res.data.resumeUrl || '',
        aggregateScore: res.data.aggregateScore || 0,
        aiSummary: res.data.aiSummary || '',
      }));
      if (Array.isArray(res.data.badges) && res.data.badges.length > 0) {
        setBadges(res.data.badges);
      }
      // Collect problem slugs with completed submissions (for skill verification badges)
      const completedSlugs = (res.data.submissions || []).map((s: any) => s.problem?.slug).filter(Boolean);
      setVerifiedSlugs(completedSlugs);
      
      // If resume exists, show the review state
      if (res.data.resumeUrl) {
        setResumeState('review');
        setParsedData({
          skills: (res.data.skills as any[] | null) || [],
          education: (res.data.college || res.data.degree) 
            ? [{ college: res.data.college || '', degree: res.data.degree || '', graduationYear: res.data.graduationYear || '' }] 
            : []
        });
      }
    }).catch(console.error);

    getUserBadges().then(b => {
      if (Array.isArray(b) && b.length > 0) {
        setBadges(b);
      }
    }).catch(console.error);
  }, []);

  const handleFileDrop = async (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processResume(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processResume(e.target.files[0]);
    }
  };

  const processResume = async (file: File) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      toast.error('File must be a PDF under 5 MB');
      return;
    }
    setResumeState('uploading');
    try {
      // Step 1: Upload PDF directly to backend (no S3)
      const uploadRes = await api.post(
        '/students/profile/upload-resume',
        file,
        { headers: { 'Content-Type': 'application/pdf' } }
      );
      const { resumeUrl } = uploadRes.data;
      setFormData(prev => ({ ...prev, resumeUrl }));

      // Step 2: Parse resume from disk
      setResumeState('parsing');
      setParseStep('Extracting skills with AI...');
      const parseRes = await api.post('/students/profile/parse-resume', {});
      setParsedData(parseRes.data.data);
      setResumeState('review');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Resume upload or parsing failed');
      setResumeState('upload');
    }
  };

  const acceptParsedData = () => {
    if (parsedData) {
      setFormData(prev => ({
        ...prev,
        skills: parsedData.skills || [],
        education: parsedData.education || []
      }));
      toast.success('Claims saved to profile!');
    }
  };

  const handleAddSkill = () => {
    const name = newSkillName.trim();
    if (!name) return;
    if (formData.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setFormData(prev => ({ ...prev, skills: [...prev.skills, { name, level: 'Intermediate' }] }));
    setNewSkillName('');
  };

  const handleRemoveSkill = (idx: number) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }));
  };

  const handleSkillLevel = (idx: number, level: string) => {
    setFormData(prev => {
      const skills = [...prev.skills];
      skills[idx] = { ...skills[idx], level };
      return { ...prev, skills };
    });
  };

  const [generatingAI, setGeneratingAI] = useState(false);
  const handleGenerateAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post('/students/profile/ai-summary', {});
      setFormData(prev => ({ ...prev, aiSummary: res.data.aiSummary }));
      toast.success('AI Recommendation generated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to generate AI summary');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await api.put('/students/profile', {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        githubUsername: formData.githubUsername,
        profilePublic: formData.profilePublic,
        freezeProfile: formData.freezeProfile,
        college: formData.education[0]?.college || '',
        degree: formData.education[0]?.degree || '',
        graduationYear: formData.education[0]?.graduationYear || '',
      });
      await api.put('/students/profile/s2', {
        skills: formData.skills,
        links: formData.links,
        linkedinUrl: formData.linkedinUrl,
      });
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '◍', dot: 'bg-green' },
    { id: 'academic', label: 'Academic', icon: '◎', dot: 'bg-green' },
    { id: 'skills', label: 'Skills', icon: '‹›', dot: 'bg-amber' },
    { id: 'achievements', label: 'Achievements', icon: '♜', dot: 'bg-line2' },
    { id: 'resume', label: 'Resume', icon: '▤', dot: 'bg-line2' },
    { id: 'social', label: 'Social', icon: '⚭', dot: 'bg-line2' },
    { id: 'blockchain', label: 'Blockchain', icon: '◈', dot: 'bg-green' },
    { id: 'applications', label: 'Applications', icon: '▦', dot: '' },
    { id: 'preferences', label: 'Preferences', icon: '⚙', dot: '' },
  ];

  // Dynamic completion logic for the "Complete your proof profile" widget
  const isPersonalComplete = !!formData.name && !!formData.mobileNumber;
  const isAcademicComplete = formData.education.length > 0 && !!formData.education[0].college;
  const isWalletComplete = !!(user as any)?.walletAddress;
  const isResumeComplete = !!formData.resumeUrl;
  const isSkillsComplete = formData.skills.length > 0;
  const isAchievementsComplete = badges && badges.length > 0;
  const isSocialComplete = !!formData.githubUsername || !!formData.linkedinUrl || formData.links.length > 0;

  const renderChecklistItem = (id: string, label: string, isComplete: boolean, extra?: React.ReactNode) => {
    const isCurrent = activeTab === id;
    
    if (isComplete) {
      return (
        <li key={id} className="flex items-center gap-2.5 text-tx">
          <span className="w-5 h-5 rounded-md bg-green/15 text-green flex items-center justify-center text-[11px]">✓</span> {label} 
          {isCurrent && <span className="ml-auto text-[11px] text-tx3">you're here</span>}
          {!isCurrent && extra && <span className="ml-auto text-[11px] text-tx3">{extra}</span>}
        </li>
      );
    }
    
    if (isCurrent) {
      return (
        <li key={id} className="flex items-center gap-2.5 text-indigo2 font-medium">
          <span className="w-5 h-5 rounded-md bg-indigo/20 flex items-center justify-center text-[11px]">→</span> {label} 
          <span className="ml-auto text-[11px] text-tx3">you're here</span>
        </li>
      );
    }

    return (
      <li key={id} className="flex items-center gap-2.5 text-tx3">
        <span className="w-5 h-5 rounded-md bg-panel3 border border-line flex items-center justify-center text-[11px]">○</span> {label}
        {extra && <span className="ml-auto text-[11px] text-tx3">{extra}</span>}
      </li>
    );
  };


  return (
    <div className="font-sans text-tx bg-bg antialiased min-h-screen pb-16 pt-6 relative">
      {/* Top Navbar Area */}
      <div className="border-b border-line2/50 bg-panel/50 backdrop-blur-sm mb-8 absolute top-0 left-0 right-0 h-14 flex items-center px-6">
        <h1 className="text-tx font-semibold text-[15px] tracking-wide">Proof Profile</h1>
      </div>

      <div className="max-w-[1120px] mx-auto px-6 mt-14">
        
        {/* Floating save button */}
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo to-indigo2 text-white font-bold shadow-[0_0_20px_rgba(124,108,246,0.5)] hover:shadow-[0_0_30px_rgba(124,108,246,0.8)] hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100 disabled:shadow-none"
        >
          <Sparkles className={`h-5 w-5 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {/* profile header */}
        <section className="rounded-2xl border border-line2 bg-gradient-to-br from-panel to-panel3 p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6D5CF0] to-indigo grid place-items-center text-white text-2xl font-bold flex-none shadow-lg">
              {formData.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[24px] font-extrabold tracking-tight text-white">{formData.name || 'Student'}</h2>
                <span className="text-[11px] font-bold tracking-wide bg-indigo/15 text-indigo2 px-2 py-0.5 rounded uppercase">
                  {(user as any)?.domain || 'CSE'} · B.TECH
                </span>
              </div>
              <p className="text-[13px] text-tx3 mt-1">Candidate profile — evidence recruiters can verify independently</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link 
                to={`/p/${user?.id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo/30 bg-indigo/10 text-indigo2 text-[12.5px] font-semibold hover:bg-indigo/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Public View
              </Link>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-green/30 bg-green/5 text-green text-[12.5px] font-semibold verified-glow shadow-inner">
                <span>◈</span> Polygon-verified
                <span className="text-[11px] font-normal text-tx3 border-l border-line2 pl-2 ml-1">2 skills on-chain</span>
              </div>
            </div>
          </div>

          {/* proof strength meter */}
          <div className="mt-6 pt-5 border-t border-line grid sm:grid-cols-[1fr,auto] gap-4 items-center">
            <div>
              <div className="flex items-center justify-between text-[12.5px] mb-2">
                <span className="text-tx2 font-medium">Proof strength</span>
                <span className="text-tx3"><b className="text-tx font-mono text-white">{profileStrength}%</b> · {Math.round(profileStrength / 100 * 7)} of 7 sections complete</span>
              </div>
              <div className="h-2 rounded-full bg-panel3 overflow-hidden shadow-inner border border-line/50">
                <div className="h-full bg-gradient-to-r from-indigo to-indigo2 transition-all duration-500" style={{width: `${profileStrength}%`}}></div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] sm:justify-end">
              <span className="flex items-center gap-1.5 text-green"><span>✓</span> {badges.length} verified</span>
              <span className="flex items-center gap-1.5 text-amber"><span>○</span> {formData.skills.length} claimed</span>
            </div>
          </div>
        </section>

          {/* AI Recommendation Box */}
          <div className="mt-5 p-5 rounded-2xl border border-indigo/20 bg-indigo/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles className="w-24 h-24 text-indigo2" /></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
              <h3 className="text-[14px] font-bold flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-indigo2" /> AI Executive Recommendation
              </h3>
              <button 
                onClick={handleGenerateAISummary}
                disabled={generatingAI}
                className="px-4 py-1.5 rounded-lg bg-indigo text-white text-[12px] font-semibold hover:bg-indigo2 transition-colors disabled:opacity-50"
              >
                {generatingAI ? 'Generating...' : formData.aiSummary ? 'Regenerate' : 'Generate Summary'}
              </button>
            </div>
            {formData.aiSummary ? (
              <p className="text-[13px] text-tx2 leading-relaxed relative z-10">{formData.aiSummary}</p>
            ) : (
              <p className="text-[13px] text-tx3 italic relative z-10">Click generate to let AI write a professional recommendation based on your verified skills and resume.</p>
            )}
          </div>

        {/* TAB BAR */}
        <nav className="mt-5 flex flex-wrap gap-1.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CandidateTabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo border border-indigo text-white font-medium shadow-[0_0_15px_rgba(124,108,246,0.3)]' 
                    : 'bg-panel border border-line text-tx2 hover:border-line2 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span> 
                <span className="capitalize">{tab.label}</span> 
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`}></span>}
              </button>
            )
          })}
        </nav>

        {/* CONTENT */}
        <div className="mt-5 grid lg:grid-cols-[1fr,300px] gap-5 items-start">
          
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {activeTab === 'resume' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-indigo2 text-lg">▤</span>
                  <h3 className="text-[16px] font-semibold text-white">Resume → verified skills</h3>
                </div>
                <p className="text-[13px] text-tx2 mb-5">Upload once. We extract your skills, education and experience — then you turn each claim into verified proof by solving a matching challenge.</p>

                {resumeState === 'upload' && (
                  <div className="animate-in fade-in">
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-line2 bg-panel3 px-6 py-10 text-center cursor-pointer hover:border-indigo/60 transition-colors group"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />
                      <div className="w-12 h-12 mx-auto rounded-xl bg-indigo/10 flex items-center justify-center text-indigo2 text-xl group-hover:bg-indigo/20 transition-colors">↑</div>
                      <div className="text-[15px] font-semibold mt-3 text-white">Drag & drop your resume, or <span className="text-indigo2 underline decoration-indigo/40">browse</span></div>
                      <div className="text-[12px] text-tx3 mt-1.5">PDF or DOCX · up to 5 MB · ATS-formatted works best</div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="rounded-lg bg-panel3 border border-line px-3 py-2.5 text-center"><div className="text-indigo2 text-sm">‹›</div><div className="text-[11.5px] text-tx2 mt-1">Skills</div></div>
                      <div className="rounded-lg bg-panel3 border border-line px-3 py-2.5 text-center"><div className="text-indigo2 text-sm">◎</div><div className="text-[11.5px] text-tx2 mt-1">Education</div></div>
                      <div className="rounded-lg bg-panel3 border border-line px-3 py-2.5 text-center"><div className="text-indigo2 text-sm">▦</div><div className="text-[11.5px] text-tx2 mt-1">Experience</div></div>
                      <div className="rounded-lg bg-panel3 border border-line px-3 py-2.5 text-center"><div className="text-indigo2 text-sm">◆</div><div className="text-[11.5px] text-tx2 mt-1">Projects</div></div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-line">
                      <div className="text-[11px] uppercase tracking-wide text-tx3 font-semibold mb-2.5">Or build from</div>
                      <div className="flex flex-wrap gap-2.5">
                        <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-white transition-colors">
                          <span>⌥</span> Connect GitHub <span className="text-tx3 text-[11px]">— auto-import projects & languages</span>
                        </button>
                        <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-white transition-colors">
                          <span>in</span> Upload LinkedIn export
                        </button>
                        <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-white transition-colors">
                          <span>⌨</span> Paste text
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(resumeState === 'uploading' || resumeState === 'parsing') && (
                  <div className="text-center py-12 animate-pulse">
                    <div className="w-11 h-11 mx-auto rounded-full border-2 border-line2 border-t-indigo2 animate-spin mb-4"></div>
                    <div className="text-[14px] font-medium text-white">Reading <span className="font-mono text-cyan">resume.pdf</span></div>
                    <div className="text-[12.5px] text-tx3 mt-1.5">{parseStep}</div>
                  </div>
                )}

                {resumeState === 'review' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-green/5 border border-green/25 text-[12.5px] mb-5">
                      <span className="text-green">✓</span>
                      <span className="text-tx2">Parsed <b className="text-white">resume.pdf</b> — review below. Everything imports as <b className="text-amber">claimed</b> until you verify it.</span>
                      <button onClick={() => setResumeState('upload')} className="ml-auto text-tx3 hover:text-white text-[12px]">Start over</button>
                    </div>

                    <div className="text-[11px] uppercase tracking-wide text-tx3 font-semibold mb-2.5">Extracted skills · <span className="text-green">2 verified</span> · <span className="text-amber">{parsedData?.skills?.length || 0} to verify</span></div>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green/10 border border-green/30 text-[12.5px] text-green shadow-sm"><span>✓</span> Algorithms</span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green/10 border border-green/30 text-[12.5px] text-green shadow-sm"><span>✓</span> Data Structures</span>
                      {parsedData?.skills?.map((skill: any, i: number) => (
                        <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel3 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-white transition-colors group">
                          <span className="text-amber">○</span> {skill.name} <span className="text-indigo2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">verify →</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                      <div className="rounded-lg bg-panel3 border border-line p-4 shadow-sm">
                        <div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wide text-tx3 font-semibold">Education</span>
                          <span className="text-[10.5px] text-green">✓ matches records</span></div>
                        {parsedData?.education?.map((edu: any, i: number) => (
                          <div key={i} className="mt-2">
                            <div className="text-[13.5px] font-semibold text-white">{edu.degree}</div>
                            <div className="text-[12px] text-tx3">{edu.college} · {edu.graduationYear}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg bg-panel3 border border-line p-4 shadow-sm hover:border-line2 transition-colors">
                        <div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wide text-tx3 font-semibold">Experience</span>
                          <span className="text-[10.5px] text-amber">○ unverified</span></div>
                        <div className="text-[13.5px] font-semibold mt-2 text-white">SDE Intern · Fintech startup</div>
                        <div className="text-[12px] text-tx3">Summer 2025 · 3 months</div>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-tx3 mt-2.5">↳ Extraction confidence 0.91 · fields you edit are flagged as self-reported to recruiters.</p>

                    <div className="flex flex-wrap gap-2.5 mt-5">
                      <button className="px-4 py-2.5 rounded-lg bg-indigo hover:bg-[#6C5AF0] text-white text-[13.5px] font-semibold flex items-center gap-2 shadow-[0_4px_14px_0_rgba(124,108,246,0.39)] transition-all">Verify skills by solving <span>→</span></button>
                      <button onClick={acceptParsedData} className="px-4 py-2.5 rounded-lg border border-line2 text-tx2 hover:text-white hover:bg-panel3 text-[13.5px] transition-colors">Save claims to profile</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'personal' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <User className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Personal Information</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-tx2 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={formData.freezeProfile}
                      className="w-full rounded-xl border border-line2 bg-panel3 px-4 py-3 text-[13px] text-white focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-tx2 uppercase tracking-wide">Mobile Number</label>
                    <input
                      type="text"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                      disabled={formData.freezeProfile}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-line2 bg-panel3 px-4 py-3 text-[13px] text-white focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'social' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <Globe className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Social & Links</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-tx2 uppercase tracking-wide flex items-center gap-1.5"><Github className="h-4 w-4" /> GitHub Username</label>
                    <input
                      type="text"
                      value={formData.githubUsername}
                      onChange={(e) => setFormData({...formData, githubUsername: e.target.value})}
                      placeholder="e.g. octocat"
                      className="w-full rounded-xl border border-line2 bg-panel3 px-4 py-3 text-[13px] text-white focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-tx2 uppercase tracking-wide flex items-center gap-1.5"><Linkedin className="h-4 w-4" /> LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                      placeholder="https://linkedin.com/in/yourname"
                      className="w-full rounded-xl border border-line2 bg-panel3 px-4 py-3 text-[13px] text-white focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'academic' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <GraduationCap className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Academic Space</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  {formData.education.length === 0 && (
                    <p className="text-[13px] text-tx3 text-center py-4 bg-panel3 rounded-xl border border-dashed border-line2">No academic records added yet.</p>
                  )}
                  {formData.education.map((edu, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-panel3 border border-line relative group">
                      <div className="flex-1 space-y-1">
                        <div className="text-[14px] font-semibold text-white">{edu.degree}</div>
                        <div className="text-[12px] text-tx2">{edu.college}</div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-[12px] text-tx3 bg-panel border border-line px-2 py-1 rounded-md">Class of {edu.graduationYear}</span>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }))}
                          className="text-tx3 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-panel2 rounded-xl p-4 border border-line border-dashed">
                  <h4 className="text-[12px] uppercase tracking-wide text-tx3 font-semibold mb-3">Add Education</h4>
                  <div className="grid gap-3 sm:grid-cols-[1fr,1fr,100px,auto] items-end">
                    <div>
                      <label className="text-[11px] text-tx2 mb-1 block">Degree / Major</label>
                      <input id="new-edu-degree" type="text" placeholder="e.g. B.Tech Computer Science" className="w-full rounded-lg border border-line2 bg-panel px-3 py-2 text-[13px] text-white focus:border-indigo focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] text-tx2 mb-1 block">University / College</label>
                      <input id="new-edu-college" type="text" placeholder="e.g. MIT" className="w-full rounded-lg border border-line2 bg-panel px-3 py-2 text-[13px] text-white focus:border-indigo focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] text-tx2 mb-1 block">Grad Year</label>
                      <input id="new-edu-year" type="text" placeholder="2025" className="w-full rounded-lg border border-line2 bg-panel px-3 py-2 text-[13px] text-white focus:border-indigo focus:outline-none" />
                    </div>
                    <button 
                      onClick={() => {
                        const deg = (document.getElementById('new-edu-degree') as HTMLInputElement).value;
                        const col = (document.getElementById('new-edu-college') as HTMLInputElement).value;
                        const yr = (document.getElementById('new-edu-year') as HTMLInputElement).value;
                        if (deg && col && yr) {
                          setFormData(prev => ({ ...prev, education: [...prev.education, { degree: deg, college: col, graduationYear: yr }] }));
                          (document.getElementById('new-edu-degree') as HTMLInputElement).value = '';
                          (document.getElementById('new-edu-college') as HTMLInputElement).value = '';
                          (document.getElementById('new-edu-year') as HTMLInputElement).value = '';
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-indigo text-white hover:bg-indigo2 transition-colors flex items-center justify-center h-[38px]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'applications' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <Terminal className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Applications & Projects Space</h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  {formData.links.length === 0 && (
                    <p className="text-[13px] text-tx3 text-center py-4 bg-panel3 rounded-xl border border-dashed border-line2">No external applications or projects added yet.</p>
                  )}
                  {formData.links.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-panel3 border border-line group">
                      <ExternalLink className="h-4 w-4 text-tx3" />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-[13.5px] font-medium text-white">{link.label}</span>
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-[12px] text-indigo2 hover:underline truncate max-w-[300px]">{link.url}</a>
                      </div>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))}
                        className="text-tx3 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-panel2 rounded-xl p-4 border border-line border-dashed">
                  <h4 className="text-[12px] uppercase tracking-wide text-tx3 font-semibold mb-3">Add Application Link</h4>
                  <div className="grid gap-3 sm:grid-cols-[1fr,2fr,auto] items-end">
                    <div>
                      <label className="text-[11px] text-tx2 mb-1 block">App / Project Name</label>
                      <input id="new-link-label" type="text" placeholder="e.g. E-Commerce Clone" className="w-full rounded-lg border border-line2 bg-panel px-3 py-2 text-[13px] text-white focus:border-indigo focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] text-tx2 mb-1 block">Live URL or Repo</label>
                      <input id="new-link-url" type="url" placeholder="https://..." className="w-full rounded-lg border border-line2 bg-panel px-3 py-2 text-[13px] text-white focus:border-indigo focus:outline-none" />
                    </div>
                    <button 
                      onClick={() => {
                        const lbl = (document.getElementById('new-link-label') as HTMLInputElement).value;
                        const url = (document.getElementById('new-link-url') as HTMLInputElement).value;
                        if (lbl && url) {
                          setFormData(prev => ({ ...prev, links: [...prev.links, { label: lbl, url: url }] }));
                          (document.getElementById('new-link-label') as HTMLInputElement).value = '';
                          (document.getElementById('new-link-url') as HTMLInputElement).value = '';
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-indigo text-white hover:bg-indigo2 transition-colors flex items-center justify-center h-[38px]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'preferences' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <Settings className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Profile Preferences</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-line2 bg-panel3">
                    <div>
                      <h4 className="text-[14px] font-bold text-white mb-1">Public Profile</h4>
                      <p className="text-[12px] text-tx3">Allow recruiters to discover your verified proof profile in search results.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" className="sr-only peer" checked={formData.profilePublic} onChange={(e) => setFormData({...formData, profilePublic: e.target.checked})} />
                      <div className="w-11 h-6 bg-panel border border-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-tx3 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo peer-checked:border-indigo"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-amber/20 bg-amber/5">
                    <div>
                      <h4 className="text-[14px] font-bold text-amber mb-1 flex items-center gap-2"><Lock className="h-4 w-4" /> Freeze Profile Data</h4>
                      <p className="text-[12px] text-tx2">Lock your personal data. Once frozen, you cannot edit your name or mobile number. This is required for final verification.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input type="checkbox" className="sr-only peer" checked={formData.freezeProfile} onChange={(e) => setFormData({...formData, freezeProfile: e.target.checked})} />
                      <div className="w-11 h-6 bg-panel border border-amber/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-tx3 peer-checked:after:bg-white after:border-amber/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber peer-checked:border-amber"></div>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'achievements' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-line pb-4">
                  <Trophy className="h-5 w-5 text-amber" />
                  <h3 className="text-[16px] font-semibold text-white">AI Verified Badges & Certificates</h3>
                </div>
                {badges.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {badges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-line2 rounded-xl bg-panel3">
                    <Award className="h-10 w-10 text-tx3 mx-auto mb-3 opacity-50" />
                    <p className="text-[14px] text-tx2 font-medium">No verified badges yet</p>
                    <p className="text-[12px] text-tx3 mt-1">Complete challenges to earn on-chain proofs!</p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'skills' && (
              <section className="rounded-2xl border border-line bg-panel p-6 shadow-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-4 border-b border-line pb-4">
                  <Code2 className="h-5 w-5 text-indigo2" />
                  <h3 className="text-[16px] font-semibold text-white">Skills</h3>
                  <span className="ml-auto text-[12px] text-tx3">{formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} · {formData.skills.filter(s => verifiedSlugs.length > 0).length > 0 ? <span className="text-green">{verifiedSlugs.length} challenge-verified</span> : 'solve challenges to verify'}</span>
                </div>

                {/* Skill list */}
                <div className="space-y-2 mb-4">
                  {formData.skills.length === 0 && (
                    <p className="text-[13px] text-tx3 text-center py-6">No skills yet. Add from the field below or upload your resume.</p>
                  )}
                  {formData.skills.map((skill, idx) => {
                    const isVerified = verifiedSlugs.some(slug =>
                      slug.toLowerCase().includes(skill.name.toLowerCase().replace(/\s+/g, '-'))
                    );
                    return (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-panel3 border border-line">
                        {isVerified
                          ? <span className="text-green text-[11px] font-bold px-2 py-0.5 rounded bg-green/10 border border-green/30">✓ verified</span>
                          : <span className="text-amber text-[11px] font-bold px-2 py-0.5 rounded bg-amber/10 border border-amber/30">○ claimed</span>
                        }
                        <span className="flex-1 text-[13px] text-white font-medium">{skill.name}</span>
                        <select
                          value={skill.level}
                          onChange={e => handleSkillLevel(idx, e.target.value)}
                          className="text-[12px] bg-panel border border-line2 text-tx2 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                        <button onClick={() => handleRemoveSkill(idx)} className="text-tx3 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add new skill */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add skill (e.g. React, PostgreSQL)"
                    className="flex-1 rounded-xl border border-line2 bg-panel3 px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo hover:bg-indigo/90 text-white text-[13px] font-semibold transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                {/* Success results from solved problems */}
                {formData.aggregateScore > 0 && (
                  <div className="mt-5 p-4 rounded-xl bg-green/5 border border-green/20">
                    <div className="text-[12px] font-bold text-green uppercase tracking-wide mb-2">📊 Aggregate Profile Score</div>
                    <div className="text-[28px] font-black text-white font-mono">{Math.round(formData.aggregateScore)}<span className="text-[14px] text-tx3 font-normal">/100</span></div>
                    <div className="text-[11.5px] text-tx3 mt-1">25% profile strength · 50% problem score · 25% assessment</div>
                  </div>
                )}
              </section>
            )}

            {!['resume', 'personal', 'social', 'preferences', 'achievements', 'skills'].includes(activeTab) && (
              <section className="rounded-2xl border border-line bg-panel p-6 flex items-center justify-center min-h-[400px] shadow-md animate-in fade-in duration-300">
                <div className="text-center text-tx3 max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-panel3 border border-line2 flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <Code2 className="h-7 w-7 text-indigo2 opacity-70" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 capitalize">{activeTab} Space</h3>
                  <p className="text-[13px] text-tx2 leading-relaxed">This section is currently being integrated with the new API schema. Data fields will appear here soon.</p>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-line bg-panel p-5 shadow-md">
              <div className="text-[13.5px] font-semibold mb-1 text-white">Complete your proof profile</div>
              <div className="text-[12px] text-tx3 mb-4">Recruiters filter by verified sections first.</div>
              <ul className="space-y-2.5 text-[13px]">
                {renderChecklistItem('personal', 'Personal', isPersonalComplete)}
                {renderChecklistItem('academic', 'Academic', isAcademicComplete)}
                {renderChecklistItem('blockchain', 'Blockchain wallet', isWalletComplete)}
                {renderChecklistItem('resume', 'Resume', isResumeComplete)}
                {renderChecklistItem('skills', 'Skills', isSkillsComplete, isSkillsComplete ? `${verifiedSlugs.length} / ${formData.skills.length} verified` : undefined)}
                {renderChecklistItem('achievements', 'Achievements', isAchievementsComplete)}
                {renderChecklistItem('social', 'Social links', isSocialComplete)}
              </ul>
            </section>

            <section className="rounded-2xl border border-[#33285C] bg-gradient-to-b from-indigo/10 to-transparent p-5 shadow-md">
              <div className="text-[13px] font-semibold text-indigo2 mb-2">How verification works</div>
              <p className="text-[12.5px] text-tx2 leading-relaxed">A resume says what you <i>claim</i>. Solve a challenge in that skill and the claim becomes <b className="text-green">verified proof</b>, minted on-chain — so an employer can check it without taking your word for it.</p>
              <div className="flex items-center gap-2 mt-3 text-[11.5px]">
                <span className="px-2 py-1 rounded bg-amber/10 text-amber">claimed</span>
                <span className="text-tx3">→ solve →</span>
                <span className="px-2 py-1 rounded bg-green/10 text-green">verified ◈</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. EXPERT REVIEWER PROFILE VIEW
   ========================================================================== */
function ReviewerProfileView() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      {/* Reviewer Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-2xl font-extrabold text-white shadow-xl border-2 border-purple-400/30">
              <ShieldCheck className="h-10 w-10 text-purple-200" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Senior Expert Reviewer'}</h1>
                <span className="rounded-md bg-purple-500/20 px-2.5 py-0.5 text-xs font-black text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                  Level 4 Master Evaluator
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Verified Code Evaluation Authority • {user?.email || 'reviewer@talentforge.in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-purple-500/20 px-4 py-2 text-xs font-extrabold text-purple-300 border border-purple-500/40 shadow-md">
            <Award className="h-4 w-4 text-amber-400" /> Expert Verified Authority
          </div>
        </div>
      </div>

      {/* Evaluation Performance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submissions Reviewed</span>
          <span className="text-2xl font-black text-purple-400 font-mono">28 Evaluated</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approval Rate</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">89.3%</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Rating Given</span>
          <span className="text-2xl font-black text-amber-400 font-mono">⭐ 4.95 / 5.0</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Evaluation Time</span>
          <span className="text-2xl font-black text-indigo-400 font-mono">&lt; 4.2 Hours</span>
        </div>
      </div>

      {/* Reviewer Domain Expertise & Recent Log */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-400" /> Evaluation Domain Competencies
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-semibold">Distributed Systems & Load Balancers</span>
              <span className="text-emerald-400 font-bold">Expert Master</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-semibold">Data Structures & O(1) Cache Evictions</span>
              <span className="text-emerald-400 font-bold">Senior Auditor</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-semibold">Rate Limiters & Concurrency Queues</span>
              <span className="text-emerald-400 font-bold">Senior Auditor</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" /> Recent Expert Audits Log
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Build a Load Balancer</p>
                <p className="text-[10px] text-slate-400">Approved • ⭐ 5/5 Stars</p>
              </div>
              <span className="text-[10px] text-purple-300 font-mono">2h ago</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Two Sum Algorithm</p>
                <p className="text-[10px] text-slate-400">Approved • ⭐ 5/5 Stars</p>
              </div>
              <span className="text-[10px] text-purple-300 font-mono">1d ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. EMPLOYER RECRUITER PROFILE VIEW
   ========================================================================== */
function EmployerProfileView() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      {/* Employer Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-2xl font-extrabold text-white shadow-xl border-2 border-indigo-400/30">
              <Users className="h-10 w-10 text-indigo-200" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Enterprise Recruiter'}</h1>
                <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-xs font-black text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                  Enterprise Tier
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Stripe Tech Talent Acquisition • {user?.email || 'employer@talentforge.in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-indigo-500/20 px-4 py-2 text-xs font-extrabold text-indigo-300 border border-indigo-500/40 shadow-md">
            <Building className="h-4 w-4 text-indigo-400" /> Verified Recruiter Account
          </div>
        </div>
      </div>

      {/* Recruitment Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Shortlisted Talent</span>
          <span className="text-2xl font-black text-amber-400 font-mono">14 Candidates</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Code Samples Inspected</span>
          <span className="text-2xl font-black text-indigo-400 font-mono">42 Inspected</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Candidate Searches</span>
          <span className="text-2xl font-black text-purple-400 font-mono">88 Queries</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Code Inspection Privacy</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">Unlocked</span>
        </div>
      </div>

      {/* API Key & ATS Integration Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-400" /> TalentForge Employer API Key & Webhooks
        </h3>
        <div className="space-y-4 max-w-2xl text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Recruiter API Key</label>
            <code className="block rounded-xl bg-slate-950 p-3 font-mono text-indigo-300 border border-slate-800">
              tf_live_emp_98f3102476aa89bc4412
            </code>
          </div>
          <p className="text-slate-400">
            Integrate candidate scores and verified psychometrics directly into your ATS (Greenhouse, Lever).
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. SYSTEM ADMINISTRATOR PROFILE VIEW
   ========================================================================== */
function AdminProfileView() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      {/* Admin Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-2xl font-extrabold text-white shadow-xl border-2 border-emerald-400/30">
              <Cpu className="h-10 w-10 text-emerald-200" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || 'System Administrator'}</h1>
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Master System Control
                </span>
              </div>
              <p className="text-xs text-slate-300">
                TalentForge Platform Admin • {user?.email || 'admin@talentforge.in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-2 text-xs font-extrabold text-emerald-300 border border-emerald-500/40 shadow-md">
            <Activity className="h-4 w-4 text-emerald-400" /> System Health: 100% Operational
          </div>
        </div>
      </div>

      {/* Platform System Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Users</span>
          <span className="text-2xl font-black text-white font-mono">1,420 Active</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daily Sandbox Jobs</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">3,840 Executed</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nightly DB Backup Cron</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">S3 Active (14-Day)</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active AI Provider</span>
          <span className="text-2xl font-black text-purple-400 font-mono">Ollama / Claude</span>
        </div>
      </div>
    </div>
  );
}
