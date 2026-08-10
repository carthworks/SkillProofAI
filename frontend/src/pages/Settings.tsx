import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  Globe, 
  Cpu, 
  Bell, 
  Key, 
  Save, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Link2, 
  Clock, 
  Bot, 
  Layers 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'integrations' | 'branding' | 'ai' | 'notifications'>('integrations');
  const [isSaved, setIsSaved] = useState(false);

  // Settings Form State
  const [settings, setSettings] = useState({
    // 1. Generic Provider & Calendar Integration
    bookingProvider: 'calendly',
    bookingUrl: 'https://calendly.com/carthworks/30min',
    bookingDuration: '30',
    bookingBuffer: '15',
    customWebhookUrl: '',

    // 2. Common & Branding
    brandName: 'TalentForge',
    workspaceDomain: 'cse',
    defaultTier: 'Explorer',
    supportEmail: 'support@talentforge.in',
    companyWebsite: 'https://talentforge.in',

    // 3. AI & LLM Provider Settings
    aiProvider: 'ollama',
    ollamaModel: 'qwen2.5-coder:7b',
    ollamaEndpoint: 'http://localhost:11434',
    aiTemperature: 0.3,
    enableAiCoaching: true,

    // 4. Notifications & Alerts
    emailNotifications: true,
    whatsappAlerts: true,
    recruiterAlerts: true,
    badgeMintingAlerts: true,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tf_app_settings');
    if (savedSettings) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('tf_app_settings', JSON.stringify(settings));
    setIsSaved(true);
    toast.success('Workspace settings updated successfully!');
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="h-6 w-6 text-brand-500" />
            Workspace & Provider Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure generic booking links (Calendly), workspace branding, AI model providers, and notification channels.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-md shadow-brand-500/20 active:scale-95"
        >
          {isSaved ? <Check className="h-4 w-4 text-emerald-200" /> : <Save className="h-4 w-4" />}
          {isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'integrations', label: 'Calendar & Booking Links', icon: <Calendar className="h-4 w-4" /> },
          { id: 'branding', label: 'Brand & Workspace', icon: <Building2 className="h-4 w-4" /> },
          { id: 'ai', label: 'AI Model & Providers', icon: <Cpu className="h-4 w-4" /> },
          { id: 'notifications', label: 'Notifications & Alerts', icon: <Bell className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: GENERIC PROVIDER & CALENDAR REGISTRATION ──────────────── */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-brand-500" /> Generic Interview Booking Provider
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register your scheduling link (e.g. Calendly, Cal.com, Google Meet). Employers & recruiters will use this link to book 1-on-1 interviews with candidates.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active Provider
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Provider Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Provider Type
                </label>
                <select
                  value={settings.bookingProvider}
                  onChange={(e) => setSettings({ ...settings, bookingProvider: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="calendly">Calendly (e.g., calendly.com/user/30min)</option>
                  <option value="cal">Cal.com (Open Source Scheduling)</option>
                  <option value="google">Google Meet / Calendar Booking</option>
                  <option value="msbook">Microsoft Bookings</option>
                  <option value="custom">Custom Webhook / Custom Booking URL</option>
                </select>
              </div>

              {/* Default Slot Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Default Slot Duration
                </label>
                <select
                  value={settings.bookingDuration}
                  onChange={(e) => setSettings({ ...settings, bookingDuration: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="15">15 Minutes Quick Sync</option>
                  <option value="30">30 Minutes Technical Interview (Recommended)</option>
                  <option value="45">45 Minutes Deep Dive</option>
                  <option value="60">60 Minutes System Design Round</option>
                </select>
              </div>
            </div>

            {/* Registration Booking Link Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Generic Booking Registration URL</span>
                {settings.bookingUrl && (
                  <a
                    href={settings.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold"
                  >
                    Test & Open Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={settings.bookingUrl}
                onChange={(e) => setSettings({ ...settings, bookingUrl: e.target.value })}
                placeholder="https://calendly.com/carthworks/30min"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-xs font-mono text-slate-900 dark:text-emerald-400 focus:border-brand-500 focus:outline-none shadow-inner"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Example: <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-brand-600 dark:text-brand-400">https://calendly.com/carthworks/30min</code>
              </p>
            </div>

            {/* Custom Webhook Endpoint (Optional) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Webhook Event Receiver (Optional)
              </label>
              <input
                type="url"
                value={settings.customWebhookUrl}
                onChange={(e) => setSettings({ ...settings, customWebhookUrl: e.target.value })}
                placeholder="https://api.yourdomain.com/webhooks/talentforge-bookings"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: COMMON & BRANDING SETTINGS ──────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Common Workspace Branding
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Platform Brand Name
                </label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Engineering Domain
                </label>
                <select
                  value={settings.workspaceDomain}
                  onChange={(e) => setSettings({ ...settings, workspaceDomain: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="cse">Computer Science & Engineering (CSE)</option>
                  <option value="ece">Electronics & Communication (ECE)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Organization Website
                </label>
                <input
                  type="url"
                  value={settings.companyWebsite}
                  onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: AI MODEL & PROVIDERS ─────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" /> Active AI Model Provider
              </h3>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-300 border border-purple-500/20">
                Ollama / Gemini Dual Engine
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  AI Model Architecture
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="ollama">Ollama Local (qwen2.5-coder:7b)</option>
                  <option value="gemini">Google Gemini 1.5 Flash</option>
                  <option value="openai">OpenAI GPT-4o</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ollama Endpoint Host
                </label>
                <input
                  type="text"
                  value={settings.ollamaEndpoint}
                  onChange={(e) => setSettings({ ...settings, ollamaEndpoint: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-emerald-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: NOTIFICATIONS ────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Notification Channels & Alert Triggers
            </h3>

            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email alerts when recruiters view or shortlist your profile.' },
              { key: 'whatsappAlerts', label: 'WhatsApp & SMS Alerts', desc: 'Instant WhatsApp updates when a sandbox evaluation finishes.' },
              { key: 'recruiterAlerts', label: 'Recruiter Match Notifications', desc: 'Notify recruiters when you achieve 10+ verified submission badges.' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(settings as any)[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
