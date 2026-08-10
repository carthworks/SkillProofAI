import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  LayoutDashboard, 
  Code2, 
  BrainCircuit, 
  History, 
  BookOpen, 
  Trophy, 
  User, 
  HelpCircle, 
  Search, 
  BookmarkCheck, 
  ShieldCheck, 
  MessageSquareText,
  Shield,
  Cpu,
  Briefcase,
  Settings as SettingsIcon
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import OnboardingTour from './OnboardingTour';
import CopilotDrawer from './CopilotDrawer';
import FeedbackWidget from './FeedbackWidget';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NavItem {
  name: string;
  path: string;
  roles: string[];
  icon: JSX.Element;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const userRole = (user?.role || 'STUDENT').toUpperCase();

  // Sidebar Collapsed State (Compact vs Expanded)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tf_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tf_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Notification Bell State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      userId: 'user-1',
      title: 'Expert Verification Approved! ⭐ 5/5',
      message: 'Your Two Sum solution was approved by Senior Architect. Badge status flipped to Expert Verified.',
      type: 'EXPERT_APPROVAL',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<{ status: string; name: string }>({ status: 'loading', name: '...' });

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

  useEffect(() => {
    async function fetchNotifications() {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await api.get(`/students/notifications`);
        if (res.data?.notifications) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {}
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);

    async function fetchAiStatus() {
      try {
        const { getSystemHealth } = await import('../services/api');
        const health = await getSystemHealth();
        setAiProvider({ status: health.status, name: health.aiProvider });
      } catch {
        setAiProvider({ status: 'error', name: 'Offline' });
      }
    }
    fetchAiStatus();

    document.addEventListener('visibilitychange', fetchNotifications);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', fetchNotifications);
    };
  }, [apiUrl]);

  const handleMarkAllRead = async () => {
    try {
      await api.post(`/students/notifications/read`);
    } catch (e) {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Grouped Navigation Definition
  const allNavGroups: NavGroup[] = [
    {
      section: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', roles: ['STUDENT', 'ADMIN'], icon: <LayoutDashboard className="h-5 w-5" /> },
        { name: 'Problems', path: '/problems', roles: ['STUDENT', 'ADMIN'], icon: <Code2 className="h-5 w-5" /> },
        { name: 'Assessment', path: '/assessment', roles: ['STUDENT', 'ADMIN'], icon: <BrainCircuit className="h-5 w-5" /> },
        { name: 'Submissions', path: '/submissions', roles: ['STUDENT', 'ADMIN'], icon: <History className="h-5 w-5" /> },
        { name: 'Reviewer Portal', path: '/reviewer', roles: ['REVIEWER', 'ADMIN'], icon: <ShieldCheck className="h-5 w-5 text-purple-400" /> },
        { name: 'Discover Talent', path: '/discover', roles: ['EMPLOYER', 'ADMIN'], icon: <Search className="h-5 w-5 text-indigo-400" /> },
        { name: 'Shortlist', path: '/shortlist', roles: ['EMPLOYER', 'ADMIN'], icon: <BookmarkCheck className="h-5 w-5 text-amber-400" /> },
      ],
    },
    {
      section: 'LEARN',
      items: [
        { name: 'Learning Center', path: '/learning', roles: ['STUDENT', 'ADMIN'], icon: <BookOpen className="h-5 w-5" /> },
        { name: 'Leaderboard', path: '/leaderboard', roles: ['STUDENT', 'REVIEWER', 'EMPLOYER', 'ADMIN'], icon: <Trophy className="h-5 w-5" /> },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { name: 'Profile', path: '/profile', roles: ['STUDENT', 'REVIEWER', 'EMPLOYER', 'ADMIN'], icon: <User className="h-5 w-5" /> },
        { name: 'Hiring Profile', path: '/employer-onboarding', roles: ['EMPLOYER'], icon: <Briefcase className="h-5 w-5" /> },
        { name: 'Settings', path: '/settings', roles: ['STUDENT', 'REVIEWER', 'EMPLOYER', 'ADMIN'], icon: <SettingsIcon className="h-5 w-5" /> },
        { name: 'Guide', path: '/guide', roles: ['STUDENT', 'REVIEWER', 'EMPLOYER', 'ADMIN'], icon: <HelpCircle className="h-5 w-5" /> },
      ],
    },
  ];

  const filteredGroups = allNavGroups
    .map((group) => ({
      section: group.section,
      items: group.items.filter((item) => userRole === 'ADMIN' || item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="tf-shell flex h-screen w-screen overflow-hidden dark:bg-slate-950 midnight:bg-bg font-sans dark:text-slate-100 midnight:text-tx transition-colors duration-200" style={{ fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif' }}>
      
      {/* ─── SIDEBAR NAVIGATION (Compact vs Expanded) ───────────────────────── */}
      <aside
        className={`tf-sidebar flex flex-col border-r dark:border-slate-800 midnight:border-line dark:bg-slate-900 midnight:bg-panel transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b dark:border-slate-800 midnight:border-line" style={{ borderColor: 'var(--border)' }}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'mx-auto' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
              TF
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight dark:text-white truncate" style={{ color: 'var(--ink)', letterSpacing: '-.02em', fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                  TalentForge
                </h1>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  PCC • Workspace
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Sidebar Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand Toggle Button (when collapsed) */}
        {isCollapsed && (
          <div className="flex justify-center py-2 border-b dark:border-slate-800/60" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-white transition"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.section} className="space-y-1">
              {/* Group Section Label */}
              {!isCollapsed ? (
                <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 select-none">
                  {group.section}
                </h3>
              ) : (
                <div className="h-px bg-slate-800 my-2" />
              )}

              {group.items.map((item) => {
                const active = isLinkActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions Area */}
        <div className="p-3 border-t dark:border-slate-800 midnight:border-line space-y-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
          
          {/* Ask Assistant AI Button */}
          {!isCollapsed ? (
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquareText className="h-4 w-4 text-indigo-500" />
                <span>Ask Assistant</span>
              </div>
              <span className="rounded-md bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5">AI</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCopilotOpen(true)}
              title="Ask Assistant AI"
              className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 transition hover:scale-105"
            >
              <MessageSquareText className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[9px] font-bold">AI</span>
            </button>
          )}

          {/* Notifications Button */}
          {!isCollapsed ? (
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-slate-500" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="Notifications"
              className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          )}

          {/* User Profile Card */}
          {!isCollapsed ? (
            <Link
              to="/profile"
              className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30">
                  {user?.name?.[0]?.toUpperCase() || 'K'}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Karthikeyan T'}</p>
                  <p className="text-[11px] text-slate-500 truncate">View Profile</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </Link>
          ) : (
            <Link
              to="/profile"
              title={`${user?.name || 'User'} - View Profile`}
              className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30 transition hover:scale-105"
            >
              {user?.name?.[0]?.toUpperCase() || 'K'}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </Link>
          )}

        </div>
      </aside>

      {/* ─── MAIN LAYOUT AREA ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Header */}
        <header className="tf-topbar flex h-16 items-center justify-between border-b dark:border-slate-800 dark:bg-slate-900 px-8 transition-colors duration-200" style={{ boxShadow: '0 1px 0 var(--border)' }}>
          <div>
            <h2 className="text-sm font-medium dark:text-slate-400" style={{ color: 'var(--ink3)', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {location.pathname === '/' && 'Platform Overview'}
              {location.pathname === '/dashboard' && 'Student Dashboard'}
              {location.pathname.startsWith('/problems') && 'Verified Execution Environment'}
              {location.pathname === '/assessment' && 'Diagnostic Psychometric Assessment'}
              {location.pathname === '/reviewer' && 'Expert Reviewer Evaluation Portal'}
              {location.pathname === '/profile' && 'Psychometric & Skill Profile'}
              {location.pathname === '/discover' && 'Employer Recruiter Discover Portal'}
              {location.pathname === '/shortlist' && 'Employer Talent Pipeline & Shortlist'}
              {location.pathname === '/login' && 'Account Authentication'}
              {location.pathname === '/register' && 'Platform Onboarding'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-24 top-14 z-50 w-80 overflow-hidden rounded-2xl dark:border-slate-800 dark:bg-slate-900 p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(17,24,38,.06),0 20px 50px -16px rgba(17,24,38,.18)', borderRadius: 16 }}>
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="text-xs font-bold dark:text-white flex items-center gap-1.5" style={{ color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--indigo)' }} /> Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Mark Read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-center py-3" style={{ color: 'var(--ink3)' }}>No notifications right now.</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        style={!item.read
                          ? { background: 'var(--in-dim)', border: '1px solid rgba(79,70,229,.2)', borderRadius: 10, padding: 12 }
                          : { background: 'var(--tint)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }
                        }
                        className="text-xs space-y-1 transition"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1" style={{ color: 'var(--ink)' }}>
                            <Shield className="h-3.5 w-3.5" style={{ color: 'var(--indigo)' }} /> {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* AI Model Status Badge */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 border text-xs font-semibold shadow-sm transition"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
              title={`Active AI Provider: ${aiProvider.name}`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] tracking-tight">{aiProvider.name}</span>
                <div
                  className={`h-2 w-2 rounded-full ${
                    aiProvider.status === 'ok'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                      : aiProvider.status === 'loading'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 transition-all flex items-center gap-1.5 text-xs font-semibold"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink2)' }}
              aria-label="Toggle Theme"
              title={`Current Theme: ${theme.toUpperCase()} (Click to toggle: Light → Dark → Midnight)`}
            >
              {theme === 'light' && (
                <>
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  <span className="hidden sm:inline text-[11px] font-mono">Light</span>
                </>
              )}
              {theme === 'dark' && (
                <>
                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="hidden sm:inline text-[11px] font-mono">Dark</span>
                </>
              )}
              {theme === 'midnight' && (
                <>
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="hidden sm:inline text-[11px] font-mono">Midnight</span>
                </>
              )}
            </button>

            {isAuthenticated ? (
              <button
                onClick={logout}
                className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold dark:text-slate-300 transition-all dark:hover:bg-slate-700 dark:hover:text-white"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink2)' }}
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-700 shadow-md shadow-brand-500/10"
                >
                  Join TalentForge
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="tf-content flex-1 overflow-y-auto p-8 dark:bg-slate-950/20 midnight:bg-transparent transition-colors duration-200 relative">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>

          {/* Global Copilot FAB */}
          {isAuthenticated && (
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'var(--indigo)', boxShadow: '0 8px 24px rgba(79,70,229,.4)' }}
              aria-label="Open AI Copilot"
            >
              <Sparkles className="h-6 w-6" />
            </button>
          )}
        </main>
      </div>

      <CopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      <OnboardingTour />
      <FeedbackWidget />
    </div>
  );
}
