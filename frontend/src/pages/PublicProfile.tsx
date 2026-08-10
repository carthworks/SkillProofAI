import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Download, Linkedin, MapPin, Building2, GraduationCap, Github, Briefcase, Award } from 'lucide-react';

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // We use axios directly since api.ts includes auth interceptors that might redirect if not logged in.
        const res = await axios.get(`http://localhost:5001/api/public/profile/${id}`);
        setProfile(res.data.profile);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Unavailable</h1>
        <p className="text-slate-500">{error}</p>
        <Link to="/" className="mt-6 text-brand-600 font-medium hover:underline">Return Home</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleLinkedInShare = () => {
    const url = window.location.href;
    const text = `I've just verified my technical skills on TalentForge! 🚀\n\nCheck out my verified profile here:\n${url}\n\n#TalentForge #VerifiedSkills #SoftwareEngineering`;
    // Use the feed shareActive endpoint to pre-fill text since localhost URLs can't be scraped by LinkedIn's share-offsite
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank', 'width=800,height=600');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Top Action Bar - Hidden in Print */}
      <div className="max-w-4xl mx-auto flex justify-end gap-3 mb-6 print:hidden">
        <button 
          onClick={handleLinkedInShare}
          className="flex items-center gap-2 px-4 py-2 bg-[#0077B5] hover:bg-[#006396] text-white text-sm font-semibold rounded-xl transition"
        >
          <Linkedin className="h-4 w-4" /> Share to LinkedIn
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Download className="h-4 w-4" /> Export as PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-brand-600 to-indigo-600 print:bg-brand-600 print:h-24">
          <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
            <span className="text-3xl font-bold text-slate-400">{profile.name.charAt(0)}</span>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 flex justify-between items-start print:pt-14">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              {profile.name} 
            </h1>
            <p className="text-lg text-slate-500 font-medium capitalize mt-1">
              {profile.domain} Engineer • {profile.tier} Tier
            </p>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 font-medium">
              {profile.college && (
                <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-slate-400" /> {profile.college}</div>
              )}
              {profile.githubUsername && (
                <div className="flex items-center gap-1.5"><Github className="h-4 w-4 text-slate-400" /> {profile.githubUsername}</div>
              )}
            </div>
          </div>

          {/* VERIFIED SEAL */}
          <div className="flex flex-col items-center bg-brand-50 border border-brand-100 rounded-xl p-4 min-w-[140px] shadow-sm">
            <ShieldCheck className="h-8 w-8 text-brand-600 mb-1" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-600">TalentForge</span>
            <span className="text-sm font-bold text-slate-900 leading-tight">VERIFIED</span>
          </div>
        </div>

        <hr className="border-slate-100 mx-8 print:border-slate-200" />

        {/* Content Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-10">
            
            {/* AI Recommendation */}
            {profile.aiSummary && (
              <section className="bg-brand-50 rounded-2xl p-6 border border-brand-100 print:bg-white print:border-slate-300 print:p-0 print:mb-8">
                <h2 className="text-sm font-bold text-brand-600 flex items-center gap-2 mb-3 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> AI Talent Recommendation
                </h2>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {profile.aiSummary}
                </p>
              </section>
            )}

            {/* Verified Skills */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-brand-500" /> Verified Skills
              </h2>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                      <span>{s.name}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-slate-500 text-xs">{s.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No skills listed yet.</p>
              )}
            </section>

            {/* Badges / Certifications */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-amber-500" /> Earned Badges
              </h2>
              {profile.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.badges.map((b: any) => (
                    <div key={b.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col gap-2 relative overflow-hidden print:border-slate-300 print:bg-white">
                      <div className="absolute -right-4 -bottom-4 opacity-5 text-amber-900"><Award className="h-24 w-24" /></div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">VERIFIED SKILL</span>
                      <h3 className="font-bold text-slate-900 leading-tight">{b.title}</h3>
                      <div className="flex justify-between items-center mt-2 text-xs font-semibold">
                        <span className="text-emerald-600">{b.score}% Correct</span>
                        <span className="text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No badges earned yet.</p>
              )}
            </section>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Stats */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 print:bg-white print:border-slate-300">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Platform Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{profile.successfulSubmissions}</div>
                  <div className="text-xs font-medium text-slate-500">Challenges Solved</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{profile.badgesEarned}</div>
                  <div className="text-xs font-medium text-slate-500">Verified Badges</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{profile.tier}</div>
                  <div className="text-xs font-medium text-slate-500">Current Tier</div>
                </div>
              </div>
            </div>

            {/* Links */}
            {profile.links && profile.links.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Links</h3>
                <div className="space-y-2">
                  {profile.links.map((link: any, idx: number) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-brand-600 hover:underline truncate">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block text-center mt-8 text-xs text-slate-400 font-medium">
        This profile and its skills were independently verified by TalentForge.
        <br/>Verify online at talentforge.in/p/{id}
      </div>

    </div>
  );
}
