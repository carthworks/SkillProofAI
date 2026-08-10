import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ─── Audience toggle logic ────────────────────────────────────────────────────
type Audience = 'candidate' | 'employer';

const HERO_BENEFITS = [
  'Get hired on what you build.',
  'Prove your skills with real code.',
  'Bypass resume filters with verified proof.',
  'Get direct interview invites from recruiters.',
  'Mint on-chain ERC-721 badges on Polygon.',
];

export default function Home() {
  const [aud, setAud] = useState<Audience>('candidate');
  const [benefitIdx, setBenefitIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setBenefitIdx((prev) => (prev + 1) % HERO_BENEFITS.length);
        setIsFading(false);
      }, 350);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen font-sans text-[#111826]"
      style={{ background: '#FBFBF9', color: '#111826' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}
        body{margin:0}
        .font-display{font-family:'Plus Jakarta Sans',sans-serif}
        .font-mono-tf{font-family:'JetBrains Mono',monospace}
        ::selection{background:#10B981;color:#fff}
        .soft{box-shadow:0 1px 2px rgba(17,24,38,.04),0 10px 30px -16px rgba(17,24,38,.14)}
        .soft-sm{box-shadow:0 1px 2px rgba(17,24,38,.05),0 6px 16px -12px rgba(17,24,38,.12)}
        .card{background:#fff;border:1px solid #E7E9E5;border-radius:18px;transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s cubic-bezier(.2,.8,.2,1),border-color .22s}
        .card:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(17,24,38,.06),0 18px 40px -16px rgba(17,24,38,.18);border-color:#D8DBD5}
        .eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
        .hero-wash{background:radial-gradient(60% 50% at 20% 0%,rgba(79,70,229,.08),transparent 60%),radial-gradient(50% 45% at 90% 5%,rgba(16,185,129,.10),transparent 60%)}
        .dotgrid{background-image:radial-gradient(rgba(17,24,38,.06) 1px,transparent 1px);background-size:22px 22px}
        .btn-em{background:#059669;color:#fff;border-radius:12px;font-weight:600;transition:transform .1s,background .15s,box-shadow .15s}
        .btn-em:hover{background:#047857;transform:translateY(-1px);box-shadow:0 6px 20px -6px rgba(5,150,105,.45)}
        .btn-em:active{transform:translateY(0)}
        .btn-in{background:#4F46E5;color:#fff;border-radius:12px;font-weight:600;transition:transform .1s,background .15s,box-shadow .15s}
        .btn-in:hover{background:#4338CA;transform:translateY(-1px);box-shadow:0 6px 20px -6px rgba(79,70,229,.45)}
        .btn-in:active{transform:translateY(0)}
        .btn-ghost{background:#fff;color:#111826;border:1px solid #D8DBD5;border-radius:12px;font-weight:600;transition:transform .1s,border-color .15s,background .15s}
        .btn-ghost:hover{border-color:#9AA3AF;background:#F9FAFB;transform:translateY(-1px)}
        .ulink{color:#059669;font-weight:600;transition:color .15s}
        .ulink:hover{color:#047857;text-decoration:underline;text-underline-offset:3px}
        .nav-link{position:relative;color:#4B5563;text-decoration:none;transition:color .15s}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#059669;border-radius:2px;transition:width .22s cubic-bezier(.2,.8,.2,1)}
        .nav-link:hover{color:#111826}
        .nav-link:hover::after{width:100%}
        details>summary{list-style:none}
        details>summary::-webkit-details-marker{display:none}
        details[open] .faq-x{transform:rotate(45deg)}
        details>summary:hover{color:#059669}
        details.card:hover{transform:none;box-shadow:0 1px 2px rgba(17,24,38,.05),0 6px 16px -12px rgba(17,24,38,.12)}

        /* ── background floating education icons ── */
        .edu-canvas{position:absolute;inset:0;overflow:hidden;pointer-events:none}
        .edu-particle{position:absolute;opacity:0;font-size:18px;animation:eduFloat linear infinite}
        @keyframes eduFloat{
          0%{opacity:0;transform:translateY(0) rotate(0deg) scale(.8)}
          10%{opacity:.12}
          85%{opacity:.10}
          100%{opacity:0;transform:translateY(-120px) rotate(25deg) scale(1.1)}
        }

        /* ── score bar segment hover ── */
        .score-seg{transition:filter .18s,transform .18s}
        .score-seg:hover{filter:brightness(1.12);transform:scaleY(1.06)}

        /* ── badge card seal pop ── */
        @keyframes pop{0%{opacity:0;transform:scale(.7)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
        .seal{animation:pop .5s cubic-bezier(.2,.9,.3,1) both}

        /* ── pipeline step number glow on card hover ── */
        .pipeline-card:hover .pipe-num{background:#4F46E5;color:#fff;box-shadow:0 0 12px rgba(79,70,229,.4)}
        .pipe-num{transition:background .2s,color .2s,box-shadow .2s}

        /* ── trust strip number count-up feel ── */
        .trust-num{display:inline-block;transition:transform .2s}
        .trust-item:hover .trust-num{transform:scale(1.08)}

        /* ── testimonial card tilt ── */
        .testimonial-card{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
        .testimonial-card:hover{transform:translateY(-4px) rotate(-.4deg);box-shadow:0 2px 4px rgba(17,24,38,.06),0 24px 48px -20px rgba(17,24,38,.18)}

        /* ── FAQ row hover ── */
        .faq-row{transition:background .18s}
        .faq-row summary:hover .faq-x{color:#4F46E5}
        .faq-x{transition:transform .22s,color .18s}

        /* ── CTA card shimmer ── */
        .cta-card{position:relative;overflow:hidden}
        .cta-card::before{content:'';position:absolute;top:-60%;left:-75%;width:55%;height:200%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.08) 50%,transparent 60%);transform:skewX(-20deg);animation:shimmer 4s ease-in-out infinite}
        @keyframes shimmer{0%,100%{left:-75%}50%{left:130%}}

        @media(prefers-reduced-motion:reduce){
          .card,.btn-em,.btn-in,.btn-ghost,.edu-particle,.cta-card::before,.seal{animation:none;transition:none;transform:none}
        }
      `}</style>


      {/* ═══ NAV ═══ */}
      <header style={{ background: 'rgba(251,251,249,.85)', borderBottom: '1px solid #E7E9E5', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-5 flex items-center gap-6" style={{ height: 62 }}>
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <span className="font-display" style={{ fontWeight: 800, fontSize: 18, color: '#111826', letterSpacing: '-.02em' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)', marginRight: 8, verticalAlign: 'middle' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              SkillProofAI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6" style={{ fontSize: 13.5, fontWeight: 500 }}>
            <a href="#how" className="nav-link">How it works</a>
            <a href="#candidates" className="nav-link">For candidates</a>
            <a href="#employers" className="nav-link">For employers</a>
            <a href="#badges" className="nav-link">Badges</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/login" style={{ fontSize: 13.5, color: '#4B5563', fontWeight: 500, textDecoration: 'none' }} className="hidden sm:block hover:text-[#111826]">Sign in</Link>
            <Link to="/register" className="btn-em px-4 py-2 soft-sm" style={{ fontSize: 13, textDecoration: 'none' }}>Get verified</Link>
          </div>
        </div>
      </header>

      <main id="top">

        {/* ═══ HERO ═══ */}
        <section className="relative hero-wash" style={{ borderBottom: '1px solid #E7E9E5', overflow: 'hidden' }}>
          <div className="absolute inset-0 dotgrid pointer-events-none" style={{ opacity: .5 }} />

          {/* Floating education & skill particles */}
          <div className="edu-canvas">
            {[
              { icon: '📚', left: '8%',  top: '70%', delay: '0s',   dur: '9s'  },
              { icon: '💡', left: '18%', top: '80%', delay: '1.5s', dur: '11s' },
              { icon: '🧠', left: '30%', top: '75%', delay: '3s',   dur: '8s'  },
              { icon: '⚙️', left: '50%', top: '85%', delay: '0.8s', dur: '10s' },
              { icon: '🔬', left: '62%', top: '72%', delay: '2.2s', dur: '12s' },
              { icon: '🏅', left: '75%', top: '80%', delay: '4s',   dur: '9s'  },
              { icon: '📊', left: '85%', top: '68%', delay: '1s',   dur: '13s' },
              { icon: '✍️', left: '93%', top: '78%', delay: '3.5s', dur: '10s' },
              { icon: '🎓', left: '42%', top: '82%', delay: '5s',   dur: '11s' },
              { icon: '💻', left: '55%', top: '88%', delay: '2s',   dur: '8s'  },
            ].map(({ icon, left, top, delay, dur }) => (
              <span
                key={icon + left}
                className="edu-particle"
                style={{ left, top, animationDelay: delay, animationDuration: dur }}
              >{icon}</span>
            ))}
          </div>

          <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#4F46E5', background: '#ECEBFE', border: '1px solid rgba(79,70,229,.15)', borderRadius: 999, padding: '6px 14px' }}>
                <span>✦</span> v1.1 — Public portfolios · AI recommendations · Interviews
              </div>
              
              {/* Dynamic Animated Hero Heading */}
              <h1 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.05, letterSpacing: '-.03em', marginTop: 24, minHeight: '2.4em' }}>
                Proof beats a résumé.<br />
                <span
                  style={{
                    color: '#059669',
                    display: 'inline-block',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isFading ? 0 : 1,
                    transform: isFading ? 'translateY(10px)' : 'translateY(0)',
                  }}
                >
                  {HERO_BENEFITS[benefitIdx]}
                </span>
              </h1>

              <p style={{ fontSize: 16, color: '#4B5563', lineHeight: 1.7, marginTop: 20, maxWidth: '54ch' }}>
                SkillProofAI turns the challenges you solve into <strong style={{ color: '#111826' }}>verified skill badges</strong> — earned through real sandbox code execution, behavioral psychometrics, and expert human review. Build a public portfolio and get in front of employers who trust it.
              </p>


              {/* Audience Toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 32, padding: 4, borderRadius: 12, background: '#fff', border: '1px solid #E7E9E5', fontSize: 13 }} className="soft-sm">
                <button
                  onClick={() => setAud('candidate')}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: aud === 'candidate' ? 600 : 500, background: aud === 'candidate' ? '#ECEBFE' : 'transparent', color: aud === 'candidate' ? '#4F46E5' : '#9AA3AF', transition: '.12s' }}
                >I'm a candidate</button>
                <button
                  onClick={() => setAud('employer')}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: aud === 'employer' ? 600 : 500, background: aud === 'employer' ? '#ECEBFE' : 'transparent', color: aud === 'employer' ? '#4F46E5' : '#9AA3AF', transition: '.12s' }}
                >I'm hiring</button>
              </div>

              {/* CTAs */}
              <div id="start" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
                {aud === 'candidate' ? (
                  <>
                    <Link to="/assessment" className="btn-in soft" style={{ padding: '14px 24px', fontSize: 14.5, textDecoration: 'none', display: 'inline-block' }}>Take the 15-min assessment →</Link>
                    <a href="#badges" className="btn-ghost" style={{ padding: '14px 24px', fontSize: 14.5, textDecoration: 'none', display: 'inline-block' }}>See a sample badge</a>
                  </>
                ) : (
                  <>
                    <Link to="/discover" className="btn-em soft" style={{ padding: '14px 24px', fontSize: 14.5, textDecoration: 'none', display: 'inline-block' }}>Discover verified talent →</Link>
                    <a href="#how" className="btn-ghost" style={{ padding: '14px 24px', fontSize: 14.5, textDecoration: 'none', display: 'inline-block' }}>How verification works</a>
                  </>
                )}
              </div>

              {/* Trust chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', marginTop: 32, fontSize: 12.5, color: '#4B5563' }}>
                {['3 verification layers', 'ERC-721 on Polygon', 'Real Docker sandbox', '<1.2s grading'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#059669' }}>✓</span>{t}</span>
                ))}
              </div>
            </div>

            {/* Badge Card */}
            <div style={{ position: 'relative' }}>
              <div className="seal" style={{ position: 'absolute', top: -24, left: -16, zIndex: 20, width: 96, height: 96, borderRadius: '50%', background: '#fff', border: '1px solid #E7E9E5', display: 'grid', placeItems: 'center' }} className="soft seal">
                <svg viewBox="0 0 200 200" width="82" height="82">
                  <defs><path id="ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/></defs>
                  <circle cx="100" cy="100" r="90" fill="#E7F7F0"/>
                  <circle cx="100" cy="100" r="78" fill="none" stroke="#10B981" strokeWidth="2"/>
                  <text fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="600" letterSpacing="3" fill="#059669">
                    <textPath href="#ring" startOffset="4%">VERIFIED · ON-CHAIN · POLYGON · </textPath>
                  </text>
                  <path d="M80 100l13 13 28-32" fill="none" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="card soft" style={{ padding: '28px 28px 28px 28px', paddingTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: '#059669', background: '#E7F7F0', padding: '4px 10px', borderRadius: 6 }}>◆ EXPERT VERIFIED</div>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: 23, lineHeight: 1.2, marginTop: 12 }}>Build a Load Balancer</div>
                    <div style={{ fontSize: 12.5, color: '#4B5563', marginTop: 4 }}>Architect tier · flagship challenge</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-display" style={{ fontWeight: 800, fontSize: 30, color: '#059669', lineHeight: 1 }}>98</div>
                    <div style={{ fontSize: 11, color: '#9AA3AF', fontFamily: 'JetBrains Mono,monospace' }}>/ 100</div>
                  </div>
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E7E9E5' }}>
                  {[['Correctness', '10 / 10 hidden tests'], ['Complexity', 'O(1) dispatch · verified'], ['Reviewer', 'Senior Architect ✓'], ['Chain record', '0xA41F…9b2 ↗']].map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontFamily: 'JetBrains Mono,monospace', marginBottom: i < 3 ? 10 : 0 }}>
                      <span style={{ color: '#4B5563' }}>{k}</span>
                      <span style={{ color: i === 3 ? '#059669' : '#111826' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <Link to="/verify" className="ulink font-mono-tf" style={{ fontSize: 12, display: 'inline-block', marginTop: 16 }}>Verify on PolygonScan →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TRUST STRIP ═══ */}
        <section style={{ borderBottom: '1px solid #E7E9E5', background: '#fff' }}>
          <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4" style={{ borderColor: '#E7E9E5' }}>
            {[['4-part', 'weighted fair score'], ['8', 'architect-grade problems'], ['10', 'hidden tests on the flagship'], ['100%', 'auditable on PolygonScan']].map(([num, label]) => (
              <div key={num} className="trust-item" style={{ padding: '32px 20px', borderRight: '1px solid #E7E9E5' }}>
                <div className="font-display trust-num" style={{ fontWeight: 800, fontSize: 28, color: '#059669', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 12, color: '#4B5563', marginTop: 8 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ VERIFICATION PIPELINE ═══ */}
        <section className="max-w-6xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 620 }}>
            <div className="eyebrow" style={{ color: '#4F46E5' }}>The verification engine</div>
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-.02em', marginTop: 12 }}>From code to cryptographic proof</h2>
            <p style={{ fontSize: 15, color: '#4B5563', marginTop: 12 }}>A claim only becomes a badge after it survives every layer. No self-attestation, no shortcuts.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4" style={{ marginTop: 40 }}>
            {[
              ['01', 'Submit in Monaco', 'Python, JS or Java — with an AI copilot alongside the editor.'],
              ['02', 'Security precheck', 'Blocks eval, subprocess and fs before any container spawns.'],
              ['03', 'Sandbox grading', 'Correctness, Big-O complexity and style, in an isolated Docker run.'],
              ['04', 'AI-verified', 'Passing the threshold earns a provisional badge.'],
              ['05', 'Expert review', 'A senior engineer approves it — or revokes it.'],
            ].map(([n, title, desc]) => (
              <div key={n} className="card soft-sm pipeline-card" style={{ padding: 24 }}>
                <div className="pipe-num" style={{ width: 32, height: 32, borderRadius: 8, background: '#ECEBFE', color: '#4F46E5', display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 600 }}>{n}</div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>{title}</div>
                <p style={{ fontSize: 13, color: '#4B5563', marginTop: 6 }}>{desc}</p>
              </div>
            ))}
            <div style={{ padding: 24, borderRadius: 18, border: '1px solid rgba(16,185,129,.3)', background: '#E7F7F0' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10B981', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 600 }}>06</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginTop: 12, color: '#059669' }}>Minted on Polygon</div>
              <p style={{ fontSize: 13, color: '#4B5563', marginTop: 6 }}>EXPERT_VERIFIED, as an ERC-721 you can link anywhere.</p>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
            <span style={{ color: '#4B5563' }}>Per-submission code score =</span>
            {['60% correctness', '30% complexity', '10% style'].map((t, i) => (
              <span key={t}>
                <span style={{ background: '#fff', border: '1px solid #E7E9E5', padding: '4px 10px', borderRadius: 6 }}>{t}</span>
                {i < 2 && <span style={{ color: '#9AA3AF', margin: '0 4px' }}>+</span>}
              </span>
            ))}
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" style={{ borderTop: '1px solid #E7E9E5', borderBottom: '1px solid #E7E9E5', background: '#F2F6F4' }}>
          <div className="max-w-6xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-.02em', textAlign: 'center' }}>Three steps to a verified profile</h2>
            <p style={{ fontSize: 15, color: '#4B5563', marginTop: 12, textAlign: 'center' }}>Cognitive fingerprint, real code evaluation, one fair score.</p>
            <div className="grid md:grid-cols-3 gap-5" style={{ marginTop: 48 }}>
              {[
                ['01', '15-minute psychometric', 'A diagnostic across five traits — Logical Reasoning, Attention to Detail, Persistence, Learning Speed, Architecture — drawn as your radar map.'],
                ['02', 'Solve real challenges', 'Explorer → Builder → Architect problems in Monaco, graded live in a sandbox. Results return in under 1.2 seconds.'],
                ['03', 'Earn one fair score', 'Your aggregate blends code, psychometrics, profile and GitHub, so no single signal can be gamed.'],
              ].map(([n, title, desc]) => (
                <div key={n} className="card soft-sm" style={{ padding: 24 }}>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: 30, color: '#4F46E5', lineHeight: 1 }}>{n}</div>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: 18, marginTop: 16 }}>{title}</h3>
                  <p style={{ fontSize: 13.5, color: '#4B5563', marginTop: 8, lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TWO-SIDED VALUE ═══ */}
        <section className="max-w-6xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>

          {/* For Candidates */}
          <div id="candidates" className="grid lg:grid-cols-[360px,1fr] gap-10 items-start" style={{ marginBottom: 64 }}>
            <div>
              <div className="eyebrow" style={{ color: '#4F46E5' }}>For candidates</div>
              <h2 className="font-display" style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-.02em', marginTop: 12, lineHeight: 1.05 }}>Stop sending PDFs.<br/>Send proof.</h2>
              <p style={{ fontSize: 14.5, color: '#4B5563', marginTop: 16, lineHeight: 1.7 }}>Every solve compounds into a public portfolio recruiters can verify without taking your word for it.</p>
              <Link to="/register" className="btn-in soft-sm" style={{ display: 'inline-block', padding: '12px 20px', fontSize: 14, marginTop: 24, textDecoration: 'none' }}>Start earning badges →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['◆', '#E7F7F0', '#059669', 'Verified skill badges', 'Backed by real test output and expert review — minted as ERC-721 on Polygon.'],
                ['◍', '#ECEBFE', '#4F46E5', 'Public portfolio /p/:id', 'A shareable page with skills, badges and an AI executive summary.'],
                ['▤', '#FEF4E4', '#F59E0B', 'PDF export & LinkedIn share', 'Print a clean résumé from the browser, or post a pre-filled, verified update in one click.'],
                ['✦', '#ECEBFE', '#4F46E5', 'Interview requests, in-app', 'Employers reach out with a calendar link straight to your dashboard.'],
              ].map(([icon, bg, color, title, desc]) => (
                <div key={title} className="card soft-sm" style={{ padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg as string, color: color as string, display: 'grid', placeItems: 'center', fontSize: 16 }}>{icon}</div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>{title}</div>
                  <p style={{ fontSize: 12.5, color: '#4B5563', marginTop: 6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div id="employers" className="grid lg:grid-cols-[1fr,360px] gap-10 items-start">
            <div className="grid sm:grid-cols-2 gap-4 order-2 lg:order-1">
              {[
                ['◎', '#E7F7F0', '#059669', 'Discover by verified score', 'Sort and filter candidates by aggregate score, badge and language — no résumé guesswork.'],
                ['▣', '#ECEBFE', '#4F46E5', 'Inspect drawer', 'Psychometric radar, score breakdown, and a read-only sample of their best code.'],
                ['✳', '#E7F7F0', '#059669', 'Smart Match AI', 'Paste a job description; get candidates ranked by real skill fit.'],
                ['◷', '#FEF4E4', '#F59E0B', 'One-click interviews', 'Send a Calendly link with a note; it arrives as an in-app notification instantly.'],
              ].map(([icon, bg, color, title, desc]) => (
                <div key={title} className="card soft-sm" style={{ padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg as string, color: color as string, display: 'grid', placeItems: 'center', fontSize: 16 }}>{icon}</div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>{title}</div>
                  <p style={{ fontSize: 12.5, color: '#4B5563', marginTop: 6 }}>{desc}</p>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <div className="eyebrow" style={{ color: '#059669' }}>For employers</div>
              <h2 className="font-display" style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-.02em', marginTop: 12, lineHeight: 1.05 }}>Screen in 90 seconds,<br/>not three calls.</h2>
              <p style={{ fontSize: 14.5, color: '#4B5563', marginTop: 16, lineHeight: 1.7 }}>See verified performance, inspect actual code, and reach out — all from one drawer.</p>
              <Link to="/discover" className="btn-em soft-sm" style={{ display: 'inline-block', padding: '12px 20px', fontSize: 14, marginTop: 24, textDecoration: 'none' }}>Open recruiter portal →</Link>
            </div>
          </div>
        </section>

        {/* ═══ FAIR SCORE SECTION ═══ */}
        <section style={{ borderTop: '1px solid #E7E9E5', borderBottom: '1px solid #E7E9E5', background: '#F8FAFC' }}>
          <div className="max-w-5xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
            
            {/* Header statement */}
            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#059669', background: '#E7F7F0', border: '1px solid rgba(16,185,129,.3)', borderRadius: 999, padding: '6px 16px' }} className="soft-sm">
                <span style={{ fontSize: 14 }}>🛡️</span> Uncheatable Multi-Signal Scoring Engine
              </div>

              <h2 className="font-display" style={{ fontWeight: 800, fontSize: 'clamp(28px,4.5vw,42px)', letterSpacing: '-.03em', marginTop: 20, lineHeight: 1.1, color: '#0F172A' }}>
                One Unified Score.<br />
                <span style={{ background: 'linear-gradient(135deg, #059669 0%, #4F46E5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Impossible to Game.
                </span>
              </h2>

              <p style={{ fontSize: 16, color: '#475569', marginTop: 16, lineHeight: 1.65, fontWeight: 450 }}>
                Resumes can be fluffed. Practice answers can be memorized. SkillProofAI eliminates hiring bias by combining <strong>4 distinct technical & cognitive signals</strong> into one transparent 100-point Aggregate Score — where <strong>75% is strictly backed by live code execution and psychometric data</strong>.
              </p>
            </div>

            {/* Why It's Impossible to Game - 3 Key Pillars */}
            <div className="grid md:grid-cols-3 gap-5" style={{ marginTop: 40 }}>
              {[
                { title: 'Zero Resume Fluff', icon: '🚫', color: '#059669', bg: '#E7F7F0', desc: 'Keyword stuffing carries zero weight. Real Docker code execution represents 50% of the total score.' },
                { title: 'Hidden Test Cases', icon: '⚡', color: '#4F46E5', bg: '#ECEBFE', desc: 'Hidden edge-case tests & Big-O runtime analysis immediately catch copied or hardcoded solutions.' },
                { title: 'Holistic Evaluation', icon: '🧠', color: '#F59E0B', bg: '#FEF4E4', desc: '20-question psychometrics (25%) + GitHub history (10%) ensure complete technical & behavioral proof.' },
              ].map((p) => (
                <div key={p.title} className="card soft-sm" style={{ padding: 22, background: '#fff', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: p.bg, color: p.color, display: 'grid', placeItems: 'center', fontSize: 18 }}>{p.icon}</span>
                    <span className="font-display" style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{p.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Visual Formula Showcase Container */}
            <div style={{ marginTop: 40, borderRadius: 24, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '32px 28px', color: '#fff', boxShadow: '0 20px 40px -15px rgba(15,23,42,0.25)', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#34D399', fontWeight: 700 }}>FIXED TRANSPARENT WEIGHTING</span>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginTop: 4, color: '#F8FAFC' }}>The 4-Part Aggregate Formula</h3>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', background: 'rgba(52,211,153,0.15)', color: '#34D399', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.3)' }}>
                  <span>✓ 100% Auditable Formula</span>
                </div>
              </div>

              {/* Stacked Segmented Progress Bar */}
              <div style={{ display: 'flex', height: 52, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700 }} className="soft">
                <div style={{ width: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} className="score-seg" title="Code Execution: 50%">
                  <span>💻 Code Sandbox</span>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 9px', borderRadius: 6 }}>50%</span>
                </div>
                <div style={{ width: '25%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} className="score-seg" title="Psychometrics: 25%">
                  <span>🧠 Psych</span>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 9px', borderRadius: 6 }}>25%</span>
                </div>
                <div style={{ width: '15%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }} className="score-seg" title="Profile Depth: 15%">
                  <span>👤 Profile</span>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 7px', borderRadius: 6 }}>15%</span>
                </div>
                <div style={{ width: '10%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }} className="score-seg" title="GitHub Activity: 10%">
                  <span>🐙 GH</span>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 7px', borderRadius: 6 }}>10%</span>
                </div>
              </div>

              {/* 4 Cards Explaining Each Component inside Dark Container */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: 24 }}>
                {[
                  { title: 'Code Execution', weight: '50%', icon: '💻', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', desc: 'Real Docker sandbox execution, Big-O complexity & style analysis.' },
                  { title: 'Psychometrics', weight: '25%', icon: '🧠', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', desc: '20-question diagnostic across 5 core engineering cognitive traits.' },
                  { title: 'Profile Depth', weight: '15%', icon: '👤', color: '#818CF8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', desc: 'Degree verification, portfolio links & verified resume parsing.' },
                  { title: 'GitHub Signal', weight: '10%', icon: '🐙', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', desc: 'Public repo activity, commit frequency, account age & followers.' },
                ].map((c) => (
                  <div key={c.title} style={{ padding: 18, borderRadius: 16, background: 'rgba(15,23,42,0.6)', border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, color: c.color, display: 'grid', placeItems: 'center', fontSize: 16 }}>{c.icon}</span>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, color: c.color, background: c.bg, padding: '3px 8px', borderRadius: 6, border: `1px solid ${c.border}` }}>{c.weight}</span>
                    </div>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginTop: 12, color: '#F8FAFC' }}>{c.title}</div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, lineHeight: 1.5 }}>{c.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#94A3B8', fontFamily: 'JetBrains Mono,monospace' }}>
                <span>💡 Recruiter Tooltip: Hover any candidate's score on the Employer Discover page to view their exact 4-part breakdown.</span>
              </div>
            </div>

          </div>
        </section>



        {/* ═══ BADGE SHOWCASE ═══ */}
        <section id="badges" className="max-w-6xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ color: '#059669' }}>Verified badge registry</div>
              <h2 className="font-display" style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-.02em', marginTop: 12 }}>Credentials you can audit</h2>
              <p style={{ fontSize: 15, color: '#4B5563', marginTop: 8 }}>Each badge links to its on-chain record and the exact test output behind it.</p>
            </div>
            <Link to="/problems" className="ulink" style={{ fontSize: 13.5 }}>Explore the badge gallery →</Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5" style={{ marginTop: 40 }}>
            {/* Badge 1 – Expert Verified */}
            <div className="card soft" style={{ padding: 24, position: 'relative', borderColor: 'rgba(16,185,129,.3)' }}>
              <div className="seal" style={{ position: 'absolute', top: -20, right: -16, width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '1px solid #E7E9E5', display: 'grid', placeItems: 'center' }} className="soft-sm seal">
                <svg viewBox="0 0 200 200" width="52" height="52"><circle cx="100" cy="100" r="92" fill="#E7F7F0"/><text x="100" y="88" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="800" fontSize="34" fill="#059669">98</text><text x="100" y="126" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="17" letterSpacing="1" fill="#059669">/100</text></svg>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: '#059669', background: '#E7F7F0', padding: '4px 10px', borderRadius: 6 }}>◆ EXPERT VERIFIED</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 19, marginTop: 12, lineHeight: 1.2 }}>Build a Load Balancer</div>
              <div style={{ fontSize: 12.5, color: '#4B5563' }}>Architect · flagship · 250 XP</div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E7E9E5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}><span style={{ color: '#4B5563' }}>Reviewer</span><span>Senior Architect</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}><span style={{ color: '#4B5563' }}>Hidden tests</span><span style={{ color: '#059669' }}>10 / 10 passed</span></div>
              </div>
              <Link to="/verify" className="ulink font-mono-tf" style={{ fontSize: 12, display: 'inline-block', marginTop: 16 }}>Verify on PolygonScan →</Link>
            </div>
            {/* Badge 2 */}
            <div className="card soft-sm" style={{ padding: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: '#4F46E5', background: '#ECEBFE', padding: '4px 10px', borderRadius: 6 }}>✦ AI VERIFIED</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 19, marginTop: 12 }}>LRU Cache System</div>
              <div style={{ fontSize: 12.5, color: '#4B5563' }}>Builder · O(1) eviction · 150 XP</div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E7E9E5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}><span style={{ color: '#4B5563' }}>Score</span><span style={{ color: '#059669' }}>95 / 100</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}><span style={{ color: '#4B5563' }}>Tests</span><span>8 / 8 passed</span></div>
              </div>
              <Link to="/verify" className="ulink font-mono-tf" style={{ fontSize: 12, display: 'inline-block', marginTop: 16 }}>Verify on PolygonScan →</Link>
            </div>
            {/* Badge 3 */}
            <div className="card soft-sm" style={{ padding: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: '#4F46E5', background: '#ECEBFE', padding: '4px 10px', borderRadius: 6 }}>✦ AI VERIFIED</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 19, marginTop: 12 }}>Token Bucket Rate Limiter</div>
              <div style={{ fontSize: 12.5, color: '#4B5563' }}>Builder · multi-client refill · 150 XP</div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E7E9E5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}><span style={{ color: '#4B5563' }}>Score</span><span style={{ color: '#059669' }}>92 / 100</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}><span style={{ color: '#4B5563' }}>Tests</span><span>8 / 8 passed</span></div>
              </div>
              <Link to="/verify" className="ulink font-mono-tf" style={{ fontSize: 12, display: 'inline-block', marginTop: 16 }}>Verify on PolygonScan →</Link>
            </div>
          </div>
        </section>


        {/* ═══ TESTIMONIALS ═══ */}
        <section style={{ borderTop: '1px solid #E7E9E5', borderBottom: '1px solid #E7E9E5', background: '#F2F6F4' }}>
          <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-5" style={{ paddingTop: 64, paddingBottom: 64 }}>
            <figure className="card soft-sm testimonial-card" style={{ padding: 28, margin: 0 }}>
              <div className="font-display" style={{ color: '#4F46E5', fontSize: 48, lineHeight: 1 }}>"</div>
              <blockquote style={{ fontSize: 16, lineHeight: 1.7, marginTop: 8 }}>I stopped attaching a résumé. I send my <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: '#059669' }}>/p</span> link and let the badges do the talking — recruiters check the code themselves.</blockquote>
              <figcaption style={{ fontSize: 12.5, color: '#4B5563', marginTop: 16, fontFamily: 'JetBrains Mono,monospace' }}>— Final-year CSE student · Architect tier</figcaption>
            </figure>
            <figure className="card soft-sm testimonial-card" style={{ padding: 28, margin: 0 }}>
              <div className="font-display" style={{ color: '#059669', fontSize: 48, lineHeight: 1 }}>"</div>
              <blockquote style={{ fontSize: 16, lineHeight: 1.7, marginTop: 8 }}>The inspect drawer told me more in ninety seconds than three phone screens. Verified score, radar, real code — then one click to schedule.</blockquote>
              <figcaption style={{ fontSize: 12.5, color: '#4B5563', marginTop: 16, fontFamily: 'JetBrains Mono,monospace' }}>— Engineering hiring lead · early-stage startup</figcaption>
            </figure>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="max-w-3xl mx-auto px-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <h2 className="font-display" style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-.02em', textAlign: 'center' }}>Questions, answered</h2>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Are the badges actually verifiable?', 'Yes. Every EXPERT_VERIFIED badge is minted as an ERC-721 on Polygon with a PolygonScan link, and each exposes the exact sandbox test output it was earned from. Anyone can audit it without an account.'],
              ['How long does it take to get started?', 'The psychometric diagnostic is about 15 minutes. Coding challenges vary by tier — Explorer problems take minutes; Architect problems like the Load Balancer are a deeper sit-down. You build your profile incrementally.'],
              ['Do employers really see my code?', 'Only if you make your profile public. When you do, employers see a read-only view of your best sample — never editable, never anything you\'ve kept private.'],
              ['What languages are supported?', 'Python, JavaScript and Java in the Monaco editor — each graded in an isolated container for correctness, Big-O complexity and style.'],
              ['Can I resubmit to improve a score?', 'Yes, with a 60-second cooldown between attempts. Your profile reflects your best verified result.'],
            ].map(([q, a]) => (
              <details key={q} className="card soft-sm faq-row" style={{ padding: '0 20px' }}>
                <summary style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 16, listStyle: 'none' }}>
                  {q}
                  <span className="faq-x" style={{ marginLeft: 'auto', color: '#059669', fontSize: 24, lineHeight: 1 }}>+</span>
                </summary>
                <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.7, paddingBottom: 20 }}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="max-w-6xl mx-auto px-5" style={{ paddingBottom: 80 }}>
          <div className="soft cta-card" style={{ borderRadius: 24, background: 'linear-gradient(135deg,#4F46E5,#3F37C9)', color: '#fff', padding: 'clamp(40px,6vw,56px)', textAlign: 'center' }}>
            <div className="absolute inset-0 dotgrid pointer-events-none" style={{ opacity: .2 }} />
            <div style={{ position: 'relative' }}>
              <h2 className="font-display" style={{ fontWeight: 800, fontSize: 36, letterSpacing: '-.02em' }}>Ready to prove it?</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', marginTop: 12, maxWidth: '52ch', marginLeft: 'auto', marginRight: 'auto' }}>Candidates earn verified badges. Employers hire on evidence. Pick your side.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                <Link to="/assessment" style={{ background: '#fff', color: '#4F46E5', padding: '14px 24px', fontSize: 14.5, borderRadius: 12, fontWeight: 600, textDecoration: 'none', transition: 'transform .1s,opacity .1s' }} onMouseEnter={e => (e.currentTarget.style.opacity='.9')} onMouseLeave={e => (e.currentTarget.style.opacity='1')}>Take the assessment</Link>
                <Link to="/register" style={{ border: '1px solid rgba(255,255,255,.5)', color: '#fff', padding: '14px 24px', fontSize: 14.5, borderRadius: 12, fontWeight: 600, textDecoration: 'none', transition: 'background .15s' }} onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.12)')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}>Create a recruiter account</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid #E7E9E5', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-4 gap-8" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'grid', placeItems: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <span className="font-display" style={{ fontWeight: 800, fontSize: 17 }}>SkillProofAI</span>
            </div>
            <p style={{ fontSize: 12.5, color: '#4B5563', marginTop: 12, maxWidth: '34ch' }}>The performance-verified talent marketplace. Proof over résumé inflation.</p>
          </div>
          <div>
            <div className="eyebrow" style={{ color: '#9AA3AF', marginBottom: 12 }}>Product</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#4B5563' }}>
              <li><a href="#how" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-[#111826]">How it works</a></li>
              <li><a href="#badges" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-[#111826]">Badge gallery</a></li>
              <li><Link to="/problems" style={{ color: 'inherit', textDecoration: 'none' }}>Problem board</Link></li>
              <li><Link to="/leaderboard" style={{ color: 'inherit', textDecoration: 'none' }}>Leaderboard</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow" style={{ color: '#9AA3AF', marginBottom: 12 }}>Sign in as</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#4B5563' }}>
              <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Student</Link></li>
              <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Reviewer</Link></li>
              <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Employer</Link></li>
              <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Admin</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow" style={{ color: '#9AA3AF', marginBottom: 12 }}>Resources</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#4B5563' }}>
              <li><Link to="/guide" style={{ color: 'inherit', textDecoration: 'none' }}>Platform guide</Link></li>
              <li><a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</a></li>
              <li><Link to="/verify" style={{ color: 'inherit', textDecoration: 'none' }}>Verify a badge</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E7E9E5' }}>
          <div className="max-w-6xl mx-auto px-5" style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: '#9AA3AF' }}>
            <span>© 2026 SkillProofAI</span><span>·</span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a><span>·</span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>◆ Badges verifiable on Polygon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
