import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, BookOpen, Code2, Award, Terminal, ChevronDown, ChevronUp,
  Sparkles, ShieldCheck, CheckCircle2, Flame, ArrowRight, Zap, Lock,
  History, Trophy, Bot, Users, Star, Bell, Eye, Building2, Layers,
  GitBranch, Database, Cpu, Settings,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What are the 8 seeded engineering problems on the Problem Board?',
    answer:
      'The platform ships with 8 curated algorithmic challenges: (1) Two Sum [Explorer], (2) LRU Cache System [Builder], (3) Token Bucket Rate Limiter [Builder], (4) Build a Load Balancer — Flagship with 10 hidden test cases covering Round-Robin, Weighted Round-Robin, Health-Check Evictions and Failover [Architect], (5) LSM-Tree MemTable & SSTable [Architect], (6) Distributed Lock Manager [Architect], (7) Trie Autocomplete Engine [Builder], (8) Consistent Hashing Ring [Architect].',
  },
  {
    question: 'How does the AI Problem Generator work?',
    answer:
      'Click "✨ Generate AI Problem" on the Problem Board. Choose a topic (e.g. "Distributed Cache", "Graph Shortest Path"), difficulty tier (Explorer/Builder/Architect), and domain. The backend calls the active AI model adapter (Ollama llama3 locally, or Claude/Gemini in cloud) to generate a full problem statement, input/output format, constraints, 2 public test cases, and 5 hidden grading test cases. The problem is saved to the database and the Monaco Editor opens it immediately.',
  },
  {
    question: 'How does the Security Precheck protect the sandbox?',
    answer:
      'Before any container is spawned, candidate source code is statically scanned by precheck.ts using regex and AST analysis. Blocked patterns include: Python subprocess/os.system/eval/exec/__import__/open, Node.js child_process/fs/eval/process.exit, Java Runtime.getRuntime/ProcessBuilder/System.exit. If any pattern is detected, execution halts immediately with status BLOCKED — no container is ever launched.',
  },
  {
    question: 'How is the Aggregate Score calculated?',
    answer:
      'The platform uses a dynamic 4-part weighted formula to calculate a candidate\'s Aggregate Score: (1) Problem Score (50%) — the best autograded submission score based on correctness, complexity, and style. (2) Psychometric Assessment (25%) — the overall score from the 5-trait AI personality test. (3) Profile Strength (15%) — based on the completion of the Talent Profile, resume, and skills. (4) GitHub Score (10%) — an automated calculation based on public repositories, followers, and account age using the GitHub API.',
  },
  {
    question: 'How does the Reviewer Portal work?',
    answer:
      'Reviewers log in with role REVIEWER and access the Review Queue at /reviewer. The queue shows oldest AI_VERIFIED submissions first. Reviewers see the problem statement and candidate code in a read-only Monaco Editor, then submit a 1–5 star rating, written comment, and APPROVE or REJECT verdict. APPROVE upgrades the badge to EXPERT_VERIFIED; REJECT revokes the badge and sends the student a notification.',
  },
  {
    question: 'How does Employer Candidate Discovery work?',
    answer:
      'Employers access the Discover page with a TanStack Table showing all candidates. Filters include: minimum score slider, badge status, language, and domain. Clicking a candidate opens the Inspect Drawer showing a Comprehensive Profile (education, external links, resume, claimed skills), the 4-part Aggregate Score Breakdown tooltip, a Psychometric Radar chart, and the best code sample. The Shortlist button saves the candidate for later review.',
  },
  {
    question: 'What does the badge lifecycle look like?',
    answer:
      'Badges progress through states: (1) Submission passes grading threshold → AI_VERIFIED chip appears on profile, (2) A Senior Reviewer approves the code → EXPERT_VERIFIED chip with reviewer name and rating, (3) Badge is minted as an ERC-721 NFT on Polygon Amoy testnet, (4) Candidate can share on LinkedIn using a dynamic OG image card with badge details. REJECT at step 2 revokes the badge and sends a notification with the reviewer\'s comment.',
  },
  {
    question: 'How does the pluggable AI adapter system work?',
    answer:
      'TalentForge uses an AIAdapter interface with four implementations: OllamaAdapter (local llama3, default), ClaudeAdapter (Anthropic), GeminiAdapter (Google), and MockAdapter (deterministic, for testing). Set AI_PROVIDER in backend/.env to switch. All AI features — problem generation, feedback formatting, copilot chat, and learning path planning — route through the same interface. If the primary adapter fails, it automatically falls back to MockAdapter.',
  },
  {
    question: 'How does Role-Based Access Control (RBAC) work?',
    answer:
      'Each user has one of four roles: STUDENT, REVIEWER, EMPLOYER, or ADMIN. The AppShell sidebar filters navigation items per role — students see Problems/Submissions/Leaderboard, reviewers see only their portal, employers see Discover/Shortlist. RequireRole.tsx route guards protect every route; unauthorized access redirects to the role\'s home page. Login automatically redirects each role to their home (STUDENT→/dashboard, REVIEWER→/reviewer, EMPLOYER→/discover).',
  },
  {
    question: 'What are the role-tailored Profile pages?',
    answer:
      'Each role gets a distinct Profile view. STUDENT: 9-tab profile (Personal, Academic, Skills, Achievements, Resume ATS Upload, Social Links, Polygon NFT Badges, Security, Preferences). REVIEWER: code evaluation metrics (submissions reviewed, approval rate, avg star rating), domain competencies, evaluation audit log. EMPLOYER: recruitment metrics (shortlisted candidates, code samples inspected), Recruiter API Key and ATS integration settings. ADMIN: platform health (active users, daily sandbox executions, S3 backup cron, AI adapter config).',
  },
  {
    question: 'How does the AI Copilot work?',
    answer:
      'The AI Copilot is a global floating drawer available on all pages. It streams responses using Server-Sent Events (SSE) from the /api/copilot/chat endpoint. It acts as an interactive mentor, automatically injecting the context of your current page (e.g., viewing a specific problem or your learning path) into the prompt. It also provides context-aware suggested prompts to help guide your learning.',
  },
  {
    question: 'What is the AI Talent Profile and how are skills extracted?',
    answer:
      'The Talent Profile goes beyond standard resumes by generating an AI-Assessed Skills Radar. A nightly BullMQ worker processes updated profiles using the active LLM to extract a structured SkillScore array. The profile text is also converted into a 1536-dimensional vector embedding stored securely using PostgreSQL\'s pgvector extension. Employers can discover candidates through vector similarity matching.',
  },
  {
    question: 'How does the AI Executive Recommendation work?',
    answer:
      'On the private profile page, students can click "Generate AI Summary" in the AI Executive Recommendation section. This calls POST /api/students/profile/ai-summary, which feeds all the candidate\'s verified badges, skills, tier, GitHub stats, and submission count into the active AI model. The AI writes a 2–3 sentence professional executive summary as if written by a recruiter. This summary is saved in the database (aiSummary field on the User model) and shown on every subsequent profile visit — no need to re-invoke the AI.',
  },
  {
    question: 'What is the Public Portfolio page and how do I share it?',
    answer:
      'Every student gets a shareable public URL at /p/:userId. The public profile displays the AI Executive Recommendation, verified skill badges, claimed skills, education, and external links — all viewable without login. Students can export it as a PDF resume directly from the browser (File → Print → Save as PDF). The "Share to LinkedIn" button opens a pre-filled LinkedIn post with the profile URL and #TalentForge #VerifiedSkills hashtags.',
  },
  {
    question: 'How does the One-Click Interview Scheduler work?',
    answer:
      'When an employer finds a strong candidate in the Candidate Inspect Drawer, they click the "Request Interview" button in the drawer header. A modal opens prompting for a scheduling link (e.g., Calendly or Google Calendar URL) and an optional personalized note. On submit, POST /api/employers/request-interview creates a Notification record in the database for that student. The student sees it immediately in their top-right bell icon with the full scheduling link and employer note.',
  },
];


const ROLES = [
  {
    role: 'Student',
    icon: <Code2 className="h-5 w-5" />,
    color: 'from-brand-500/20 to-brand-600/10 border-brand-500/30',
    textColor: 'text-brand-400',
    email: 'student@college.edu',
    password: 'password123',
    home: '/dashboard',
    features: ['Problem Board & Monaco Editor', 'AI Problem Generator', 'Sandbox Autograding', 'Psychometric Assessment', 'Notification Bell', 'AI Executive Recommendation', 'Public Portfolio & PDF Export', 'LinkedIn Share (Pre-filled)', '9-Tab Profile Portfolio'],
  },
  {
    role: 'Reviewer',
    icon: <Star className="h-5 w-5" />,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    textColor: 'text-amber-400',
    email: 'reviewer@talentforge.in',
    password: 'Reviewer123!',
    home: '/reviewer',
    features: ['AI_VERIFIED submission queue', 'Read-only Monaco Code View', '1–5 Star Rating', 'Approve / Reject verdict', 'Expert comment to student'],
  },
  {
    role: 'Employer',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30',
    textColor: 'text-purple-400',
    email: 'employer@talentforge.in',
    password: 'password123',
    home: '/discover',
    features: ['TanStack Candidate Table', 'Score / Badge / Language Filters', 'Candidate Inspect Drawer with Radar', 'Code Sample Viewer', 'One-Click Interview Scheduler', 'Smart Match AI (JD → Candidate)', 'Shortlist Management'],
  },
  {
    role: 'Admin',
    icon: <Settings className="h-5 w-5" />,
    color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30',
    textColor: 'text-slate-400',
    email: 'admin@talentforge.in',
    password: 'Admin123!',
    home: '/admin',
    features: ['Platform health metrics', 'AI adapter runtime switch', 'S3 backup cron status', 'All routes accessible'],
  },
];

const PIPELINE = [
  { step: '01', title: 'Security Precheck', desc: 'Static regex/AST scan blocks subprocess, eval, fs, Runtime.exec before container spawn.', icon: <ShieldCheck className="h-5 w-5" />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { step: '02', title: 'S3 Upload + Queue', desc: 'Code uploads to MinIO, BullMQ job enqueued with stalledInterval:15s & smart retry policy.', icon: <Database className="h-5 w-5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { step: '03', title: 'Container Sandbox', desc: 'Isolated Docker container runs code against public + hidden test cases at N, 2N, 4N scales.', icon: <Terminal className="h-5 w-5" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '04', title: 'Composite Scoring', desc: '60% Correctness + 30% Big-O Complexity + 10% Code Style (pylint/eslint/checkstyle).', icon: <Zap className="h-5 w-5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { step: '05', title: 'Real-time Results', desc: 'Socket.io grading:complete event fires — score ring, test case table, AI feedback bullets.', icon: <Flame className="h-5 w-5" />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { step: '06', title: 'Reviewer Approval', desc: 'AI_VERIFIED → Reviewer Queue → Star rating + verdict → EXPERT_VERIFIED or Revoke.', icon: <Star className="h-5 w-5" />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { step: '07', title: 'Polygon NFT Badge', desc: 'On-chain ERC-721 minted on Polygon Amoy testnet. LinkedIn OG image share card generated.', icon: <Award className="h-5 w-5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export default function Guide() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeRoleTab, setActiveRoleTab] = useState<number>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-16 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/40">
            <HelpCircle className="h-3.5 w-3.5" /> Platform Architecture & Help Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            TalentForge Platform Guide
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Comprehensive documentation covering RBAC roles, AI-generated problems, sandbox grading pipeline,
            reviewer portal, employer discovery, badge lifecycle, and the pluggable AI adapter system.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {['4 Roles', '8 Seeded Problems', 'AI Generator', 'Real-time Grading', 'Reviewer Portal', 'Employer Discovery', 'Polygon Badges'].map(tag => (
              <span key={tag} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Role Overview Tabs */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-500" /> Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Every user has exactly one role. Navigation, screens, and API access are all filtered per role. Click a role to see credentials and available features.
        </p>

        {/* Role Tab Switcher */}
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r, i) => (
            <button
              key={r.role}
              onClick={() => setActiveRoleTab(i)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                activeRoleTab === i
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.icon} {r.role}
            </button>
          ))}
        </div>

        {/* Active Role Card */}
        {(() => {
          const r = ROLES[activeRoleTab];
          return (
            <div className={`rounded-3xl border bg-gradient-to-br ${r.color} p-6 space-y-5`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className={`text-xl font-extrabold ${r.textColor}`}>{r.role} Role</h3>
                  <p className="text-xs text-slate-400">Home page: <code className="bg-slate-800/60 px-2 py-0.5 rounded text-slate-300">{r.home}</code></p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-xs space-y-1 font-mono">
                  <div><span className="text-slate-500">Email: </span><span className="text-white">{r.email}</span></div>
                  <div><span className="text-slate-500">Password: </span><span className="text-white">{r.password}</span></div>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Accessible Features</p>
                <div className="flex flex-wrap gap-2">
                  {r.features.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Section 2: Grading Pipeline */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-indigo-500" /> 7-Step Grading & Verification Pipeline
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step) => (
            <div key={step.step} className={`rounded-2xl border p-4 space-y-2 ${step.color}`}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20">
                  {step.icon}
                </div>
                <span className="text-[10px] font-black opacity-50 tracking-widest">STEP {step.step}</span>
              </div>
              <h3 className="text-sm font-extrabold text-white">{step.title}</h3>
              <p className="text-[11px] text-slate-300/80 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: AI Problem Generator */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-extrabold text-white">AI Problem Generator</h2>
          <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-widest">NEW</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          TalentForge connects to a pluggable AI model adapter (Ollama llama3 locally, Claude, or Gemini) to dynamically generate brand-new engineering problems on demand. Each generated problem includes a full Markdown problem statement, complexity constraints, 2 public test cases, and 5 hidden evaluation test cases — all saved to the database.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 space-y-1">
            <p className="font-bold text-purple-300">① Choose Topic</p>
            <p className="text-slate-400">e.g. "Distributed Lock TTL", "Trie Autocomplete", "Consistent Hashing Ring"</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 space-y-1">
            <p className="font-bold text-purple-300">② Select Tier & Domain</p>
            <p className="text-slate-400">Explorer / Builder / Architect across CSE or ECE domains.</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 space-y-1">
            <p className="font-bold text-purple-300">③ Open in Monaco Editor</p>
            <p className="text-slate-400">Problem saved to DB and Monaco Editor opens it immediately for coding.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="font-bold text-slate-400">AI Providers:</span>
          {['Ollama llama3 (local)', 'Anthropic Claude', 'Google Gemini', 'Mock (testing)'].map(p => (
            <span key={p} className="rounded-lg bg-slate-700/60 px-2.5 py-1 text-slate-300">{p}</span>
          ))}
        </div>
      </div>

      {/* Section 4: 8 Seeded Problems */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-500" /> 8 Pre-Seeded Engineering Problems
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <th className="text-left pb-2 pr-4">#</th>
                <th className="text-left pb-2 pr-4">Title</th>
                <th className="text-left pb-2 pr-4">Tier</th>
                <th className="text-left pb-2 pr-4">XP</th>
                <th className="text-left pb-2">Key Concept</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ['1', 'Two Sum', 'Explorer', '100', 'Hash map O(N)'],
                ['2', 'LRU Cache System', 'Builder', '150', 'Doubly-linked list + HashMap'],
                ['3', 'Token Bucket Rate Limiter', 'Builder', '150', 'Multi-client token refill queues'],
                ['4', 'Build a Load Balancer ⭐ Flagship', 'Architect', '250', '10 hidden cases: Round-Robin, Weighted, Health-Check Eviction'],
                ['5', 'LSM-Tree MemTable & SSTable', 'Architect', '250', 'Write-ahead log + SSTable flushing'],
                ['6', 'Distributed Lock Manager', 'Architect', '250', 'TTL lease auto-expiration'],
                ['7', 'Trie Autocomplete Engine', 'Builder', '150', 'Prefix search O(L)'],
                ['8', 'Consistent Hashing Ring', 'Architect', '250', 'Virtual node ring partitioning'],
              ].map(([num, title, tier, xp, concept]) => {
                const tierColors: Record<string, string> = {
                  Explorer: 'text-emerald-500 bg-emerald-500/10',
                  Builder: 'text-indigo-500 bg-indigo-500/10',
                  Architect: 'text-purple-500 bg-purple-500/10',
                };
                return (
                  <tr key={num} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2.5 pr-4 font-mono text-slate-400">{num}</td>
                    <td className="py-2.5 pr-4 font-semibold">{title}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tierColors[tier!]}`}>{tier}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-amber-500 font-bold">+{xp}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{concept}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Feature Directory */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> Full Feature Directory
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Bot className="h-4 w-4" />, label: 'AI Problem Generator', color: 'text-purple-400', desc: 'Ollama/Claude/Gemini generates new problems with hidden test cases on demand.' },
            { icon: <Sparkles className="h-4 w-4" />, label: 'AI Copilot Mentor', color: 'text-indigo-400', desc: 'Global sliding drawer with SSE streaming chat and context-aware suggested prompts.' },
            { icon: <Database className="h-4 w-4" />, label: 'AI Talent Profile & pgvector', color: 'text-blue-500', desc: 'Skills extraction to Recharts Radar, plus pgvector embeddings for smart employer matching.' },
            { icon: <Terminal className="h-4 w-4" />, label: 'Monaco Code Editor', color: 'text-brand-400', desc: 'Syntax-highlighted IDE with Python/JavaScript/Java support + AI copilot sidebar.' },
            { icon: <ShieldCheck className="h-4 w-4" />, label: 'Security Precheck', color: 'text-red-400', desc: 'Static code scanner blocks dangerous syscalls before sandbox spawn.' },
            { icon: <Cpu className="h-4 w-4" />, label: 'BullMQ Sandboxed Grader', color: 'text-indigo-400', desc: 'Docker container execution with N/2N/4N scaling, Sentry observability, smart retries.' },
            { icon: <Zap className="h-4 w-4" />, label: 'Real-time Results', color: 'text-amber-400', desc: 'Socket.io grading:complete event → live score ring + AI feedback bullets.' },
            { icon: <Star className="h-4 w-4" />, label: 'Reviewer Portal', color: 'text-yellow-400', desc: 'AI_VERIFIED queue → read-only Monaco → Star rating + Approve/Reject verdict.' },
            { icon: <Building2 className="h-4 w-4" />, label: 'Employer Discovery', color: 'text-purple-400', desc: 'TanStack Table with score/badge/language filters + candidate drawer + shortlist.' },
            { icon: <Award className="h-4 w-4" />, label: 'Polygon ERC-721 Badges', color: 'text-emerald-400', desc: 'On-chain skill credentials minted on Polygon Amoy testnet with PolygonScan links.' },
            { icon: <Bell className="h-4 w-4" />, label: 'Notification Bell', color: 'text-orange-400', desc: 'Unread count badge; review outcome notifications from the Reviewer portal.' },
            { icon: <Trophy className="h-4 w-4" />, label: 'Paginated Leaderboard', color: 'text-amber-400', desc: 'Gold/Silver/Bronze podium cards, 7-day score trends, pass-rate progress bars.' },
            { icon: <History className="h-4 w-4" />, label: 'Submission History', color: 'text-blue-400', desc: 'SVG sparkline, attempt table with status badges, detail modal, resubmit cooldown.' },
            { icon: <Eye className="h-4 w-4" />, label: 'LinkedIn Share + OG Image', color: 'text-blue-400', desc: 'Dynamic SVG badge card endpoint + pre-filled LinkedIn post share button.' },
          ].map(f => (
            <div key={f.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/60">
              <div className={`flex items-center gap-2 font-bold text-xs ${f.color}`}>
                {f.icon} {f.label}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-500" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs font-bold text-slate-900 dark:text-white hover:text-brand-500 transition"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-brand-500 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-600/20 via-purple-600/10 to-indigo-600/20 p-8 text-center space-y-4">
        <h3 className="text-xl font-extrabold text-white">Ready to solve a problem?</h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
          Head to the Problem Board to solve one of the 8 seeded engineering challenges or generate a new one with the AI Problem Generator.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            to="/problems"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-xs font-bold text-white hover:bg-brand-500 transition shadow-lg shadow-brand-500/20"
          >
            Problem Board <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/reviewer"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white hover:bg-amber-500 transition shadow-lg shadow-amber-500/20"
          >
            Reviewer Portal <Star className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
