import * as fs from 'fs';
import * as path from 'path';

const profilePath = path.join(__dirname, 'src', 'pages', 'Profile.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf-8');

// Find the start and end of StudentCandidateProfileView
const startIdx = profileContent.indexOf('function StudentCandidateProfileView() {');
const endMarker = '/* ==========================================================================';
const endIdx = profileContent.indexOf(endMarker, startIdx);

const newProfileComponent = `function StudentCandidateProfileView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CandidateTabType>('resume');
  const [resumeState, setResumeState] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [parseStep, setParseStep] = useState('Extracting skills...');

  const runParse = () => {
    setResumeState('parsing');
    const steps = ['Extracting skills...', 'Reading education & experience...', 'Matching against your solved challenges...', 'Scoring extraction confidence...'];
    let i = 0;
    setParseStep(steps[0]);
    const t = setInterval(() => {
      i++;
      if (i < steps.length) setParseStep(steps[i]);
    }, 460);
    setTimeout(() => {
      clearInterval(t);
      setResumeState('review');
    }, 1900);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    runParse();
  };

  return (
    <div className="font-sans text-tx antialiased min-h-screen pb-16 pt-8">
      <div className="max-w-[1120px] mx-auto px-6">
        {/* profile header */}
        <section className="rounded-2xl border border-line2 bg-gradient-to-br from-panel to-panel3 p-6 shadow-xl">
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6D5CF0] to-indigo grid place-items-center text-white text-2xl font-bold flex-none">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[24px] font-extrabold tracking-tight text-white">{user?.name || 'Student'}</h2>
                <span className="text-[11px] font-bold tracking-wide bg-indigo/15 text-indigo2 px-2 py-0.5 rounded uppercase">
                  {user?.domain || 'CSE'} · B.TECH
                </span>
              </div>
              <p className="text-[13px] text-tx3 mt-1">Candidate profile — evidence recruiters can verify independently</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-lg border border-green/30 bg-green/5 text-green text-[12.5px] font-semibold verified-glow">
              <span>◈</span> Polygon-verified
              <span className="text-[11px] font-normal text-tx3 border-l border-line2 pl-2 ml-1">2 skills on-chain</span>
            </div>
          </div>

          {/* proof strength meter */}
          <div className="mt-6 pt-5 border-t border-line grid sm:grid-cols-[1fr,auto] gap-4 items-center">
            <div>
              <div className="flex items-center justify-between text-[12.5px] mb-2">
                <span className="text-tx2 font-medium">Proof strength</span>
                <span className="text-tx3"><b className="text-tx font-mono">40%</b> · 3 of 7 sections complete</span>
              </div>
              <div className="h-2 rounded-full bg-panel3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo to-indigo2" style={{width: '40%'}}></div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] sm:justify-end">
              <span className="flex items-center gap-1.5 text-green"><span>✓</span> 2 verified</span>
              <span className="flex items-center gap-1.5 text-amber"><span>○</span> 6 claimed</span>
              <span className="flex items-center gap-1.5 text-tx3"><span>—</span> 3 empty</span>
            </div>
          </div>
        </section>

        {/* TAB BAR */}
        <nav className="mt-5 flex flex-wrap gap-1.5">
          {['personal', 'academic', 'skills', 'achievements', 'resume', 'social', 'blockchain', 'applications'].map(tab => {
            const isActive = activeTab === tab;
            let icon = '◍';
            let dot = 'bg-line2';
            if (tab === 'personal' || tab === 'academic' || tab === 'blockchain') { icon = '✓'; dot = 'bg-green'; }
            if (tab === 'skills') { icon = '‹›'; dot = 'bg-amber'; }
            if (tab === 'achievements') { icon = '♜'; }
            if (tab === 'resume') { icon = '▤'; }
            if (tab === 'social') { icon = '⚭'; }
            if (tab === 'applications') { icon = '▦'; dot = ''; }
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as CandidateTabType)}
                className={\`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] transition-colors \${isActive ? 'bg-indigo border border-indigo text-white font-medium' : 'bg-panel border border-line text-tx2 hover:border-line2'}\`}
              >
                <span>{icon}</span> <span className="capitalize">{tab}</span> {dot && <span className={\`w-1.5 h-1.5 rounded-full \${dot}\`}></span>}
              </button>
            )
          })}
        </nav>

        {/* CONTENT */}
        <div className="mt-5 grid lg:grid-cols-[1fr,300px] gap-5 items-start">
          
          {/* LEFT COLUMN */}
          {activeTab === 'resume' ? (
            <section className="rounded-2xl border border-line bg-panel p-6">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-indigo2 text-lg">▤</span>
                <h3 className="text-[16px] font-semibold text-white">Resume → verified skills</h3>
              </div>
              <p className="text-[13px] text-tx2 mb-5">Upload once. We extract your skills, education and experience — then you turn each claim into verified proof by solving a matching challenge.</p>

              {resumeState === 'upload' && (
                <div>
                  <div 
                    onClick={runParse} 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className="rounded-xl border-2 border-dashed border-line2 bg-panel3 px-6 py-10 text-center cursor-pointer hover:border-indigo/60 transition-colors"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo/10 flex items-center justify-center text-indigo2 text-xl">↑</div>
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
                      <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-tx">
                        <span>⌥</span> Connect GitHub <span className="text-tx3 text-[11px]">— auto-import projects & languages</span>
                      </button>
                      <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-tx">
                        <span>in</span> Upload LinkedIn export
                      </button>
                      <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel2 border border-line2 text-[12.5px] text-tx2 hover:border-indigo hover:text-tx">
                        <span>⌨</span> Paste text
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {resumeState === 'parsing' && (
                <div className="text-center py-12 animate-pulse">
                  <div className="w-11 h-11 mx-auto rounded-full border-2 border-line2 border-t-indigo2 animate-spin"></div>
                  <div className="text-[14px] font-medium mt-4 text-white">Reading <span className="font-mono text-cyan">{user?.name || 'student'}_resume.pdf</span></div>
                  <div className="text-[12.5px] text-tx3 mt-1.5">{parseStep}</div>
                </div>
              )}

              {resumeState === 'review' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-green/5 border border-green/25 text-[12.5px] mb-5">
                    <span className="text-green">✓</span>
                    <span className="text-tx2">Parsed <b className="text-tx text-white">{user?.name || 'student'}_resume.pdf</b> — review below. Everything imports as <b className="text-amber">claimed</b> until you verify it.</span>
                    <button onClick={() => setResumeState('upload')} className="ml-auto text-tx3 hover:text-tx text-[12px]">Start over</button>
                  </div>

                  <div className="text-[11px] uppercase tracking-wide text-tx3 font-semibold mb-2.5">Extracted skills · <span className="text-green">2 verified</span> · <span className="text-amber">6 to verify</span></div>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green/10 border border-green/30 text-[12.5px] text-green"><span>✓</span> Algorithms</span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green/10 border border-green/30 text-[12.5px] text-green"><span>✓</span> Data Structures</span>
                    {['Python', 'React', 'Node.js', 'System Design', 'PostgreSQL', 'Docker'].map(skill => (
                      <button key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel3 border border-line2 text-[12.5px] text-tx2 hover:border-indigo group">
                        <span className="text-amber">○</span> {skill} <span className="text-indigo2 text-[11px] opacity-0 group-hover:opacity-100">verify →</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    <div className="rounded-lg bg-panel3 border border-line p-4">
                      <div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wide text-tx3 font-semibold">Education</span>
                        <span className="text-[10.5px] text-green">✓ matches records</span></div>
                      <div className="text-[13.5px] font-semibold mt-2 text-white">B.Tech, Computer Science</div>
                      <div className="text-[12px] text-tx3">2022 – 2026 · CGPA 8.7</div>
                    </div>
                    <div className="rounded-lg bg-panel3 border border-line p-4">
                      <div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wide text-tx3 font-semibold">Experience</span>
                        <span className="text-[10.5px] text-amber">○ unverified</span></div>
                      <div className="text-[13.5px] font-semibold mt-2 text-white">SDE Intern · Fintech startup</div>
                      <div className="text-[12px] text-tx3">Summer 2025 · 3 months</div>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-tx3 mt-2.5">↳ Extraction confidence 0.91 · fields you edit are flagged as self-reported to recruiters.</p>

                  <div className="flex flex-wrap gap-2.5 mt-5">
                    <button className="px-4 py-2.5 rounded-lg bg-indigo hover:bg-[#6C5AF0] text-white text-[13.5px] font-semibold flex items-center gap-2">Verify skills by solving <span>→</span></button>
                    <button className="px-4 py-2.5 rounded-lg border border-line2 text-tx2 hover:text-tx text-[13.5px] text-white">Save claims to profile</button>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-line bg-panel p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center text-tx3">
                <div className="text-4xl mb-4 opacity-50">🚧</div>
                <h3 className="text-lg font-semibold text-tx2 mb-2">Work in Progress</h3>
                <p className="text-sm">The {activeTab} section is currently being redesigned.</p>
              </div>
            </section>
          )}

          {/* RIGHT COLUMN */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-line bg-panel p-5">
              <div className="text-[13.5px] font-semibold mb-1 text-white">Complete your proof profile</div>
              <div className="text-[12px] text-tx3 mb-4">Recruiters filter by verified sections first.</div>
              <ul className="space-y-2.5 text-[13px]">
                <li className="flex items-center gap-2.5 text-tx"><span className="w-5 h-5 rounded-md bg-green/15 text-green flex items-center justify-center text-[11px]">✓</span> Personal</li>
                <li className="flex items-center gap-2.5 text-tx"><span className="w-5 h-5 rounded-md bg-green/15 text-green flex items-center justify-center text-[11px]">✓</span> Academic</li>
                <li className="flex items-center gap-2.5 text-tx"><span className="w-5 h-5 rounded-md bg-green/15 text-green flex items-center justify-center text-[11px]">✓</span> Blockchain wallet</li>
                <li className="flex items-center gap-2.5 text-indigo2 font-medium"><span className="w-5 h-5 rounded-md bg-indigo/20 flex items-center justify-center text-[11px]">→</span> Resume <span className="ml-auto text-[11px] text-tx3">you're here</span></li>
                <li className="flex items-center gap-2.5 text-tx3"><span className="w-5 h-5 rounded-md bg-panel3 border border-line flex items-center justify-center text-[11px]">○</span> Skills <span className="ml-auto text-[11px]">2 / 8 verified</span></li>
                <li className="flex items-center gap-2.5 text-tx3"><span className="w-5 h-5 rounded-md bg-panel3 border border-line flex items-center justify-center text-[11px]">—</span> Achievements</li>
                <li className="flex items-center gap-2.5 text-tx3"><span className="w-5 h-5 rounded-md bg-panel3 border border-line flex items-center justify-center text-[11px]">—</span> Social links</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[#33285C] bg-gradient-to-b from-indigo/10 to-transparent p-5">
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
`;

const updatedProfile = profileContent.substring(0, startIdx) + newProfileComponent + '\n' + profileContent.substring(endIdx);

fs.writeFileSync(profilePath, updatedProfile);
console.log('Successfully updated StudentCandidateProfileView');
