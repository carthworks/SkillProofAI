import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppShell from './components/AppShell';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProblemBoard = lazy(() => import('./pages/ProblemBoard'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Submissions = lazy(() => import('./pages/Submissions'));
const Assessment = lazy(() => import('./pages/Assessment'));
const ReviewerPortal = lazy(() => import('./pages/ReviewerPortal'));
const EmployerDiscover = lazy(() => import('./pages/EmployerDiscover'));
const EmployerShortlist = lazy(() => import('./pages/EmployerShortlist'));
const Guide = lazy(() => import('./pages/Guide'));
const Learning = lazy(() => import('./pages/Learning'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const VerifyBadge = lazy(() => import('./pages/VerifyBadge'));
const Settings = lazy(() => import('./pages/Settings'));
const EmployerOnboarding = lazy(() => import('./pages/EmployerOnboarding'));
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-500">Loading TalentForge...</p>
              </div>
            </div>
          }>
            <Routes>
            {/* Public Unrestricted Routes */}
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/verify/:id" element={<VerifyBadge />} />
            <Route path="/p/:id" element={<PublicProfile />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Workspace Layout (Require Authentication) */}
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                {/* Candidate Student Routes */}
                <Route element={<RequireRole allowedRoles={['STUDENT']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/problems" element={<ProblemBoard />} />
                  <Route path="/problems/:slug" element={<ProblemDetail />} />
                  <Route path="/assessment" element={<Assessment />} />
                  <Route path="/submissions" element={<Submissions />} />
                  <Route path="/learning" element={<Learning />} />
                </Route>

                {/* Expert Reviewer Routes */}
                <Route element={<RequireRole allowedRoles={['REVIEWER']} />}>
                  <Route path="/reviewer" element={<ReviewerPortal />} />
                </Route>

                {/* Employer Recruiter Routes */}
                <Route element={<RequireRole allowedRoles={['EMPLOYER']} />}>
                  <Route path="/discover" element={<EmployerDiscover />} />
                  <Route path="/shortlist" element={<EmployerShortlist />} />
                  <Route path="/employer-onboarding" element={<EmployerOnboarding />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminPortal />} />
                </Route>

                {/* Shared Multi-Role Routes */}
                <Route element={<RequireRole allowedRoles={['STUDENT', 'REVIEWER', 'EMPLOYER', 'ADMIN']} />}>
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/guide" element={<Guide />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
