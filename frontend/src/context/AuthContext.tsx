import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  domain: string;
  role?: 'STUDENT' | 'REVIEWER' | 'EMPLOYER' | 'ADMIN' | string;
  tier: string;
  xp: number;
  isAnonymized?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, domain: 'cse' | 'ece', password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
  switchRole: (newRole: string) => void;
}

const MOCK_USER: User = {
  id: 'mock-user-id-123',
  email: 'tkarthikeyan@gmail.com',
  name: 'Karthikeyan',
  domain: 'cse',
  role: 'STUDENT',
  tier: 'Explorer',
  xp: 150,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function inferRoleFromEmail(email: string): string {
  const lower = email.toLowerCase();
  if (lower.includes('reviewer')) return 'REVIEWER';
  if (lower.includes('employer') || lower.includes('recruiter') || lower.includes('company')) return 'EMPLOYER';
  if (lower.includes('admin')) return 'ADMIN';
  return 'STUDENT';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  const setSession = async (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    setAccessToken(access);

    try {
      const response = await api.get('/auth/me');
      const u = response.data.user;
      const role = u.role || inferRoleFromEmail(u.email);
      setUser({ ...u, role });
      toast.success(`Authenticated as ${u.name}`);
    } catch (err) {
      console.warn('Backend unavailable, using mock user profile');
      const storedEmail = localStorage.getItem('userEmail') || MOCK_USER.email;
      const role = inferRoleFromEmail(storedEmail);
      const u = {
        ...MOCK_USER,
        email: storedEmail,
        name: storedEmail.split('@')[0],
        role,
      };
      setUser(u);
      toast.info(`Session active (${u.name})`);
    }
  };

  const logoutState = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    setAccessToken(null);
    setUser(null);
    toast.info('Signed out of TalentForge');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: loggedUser } = response.data;
      const role = loggedUser.role || inferRoleFromEmail(loggedUser.email);
      const fullUser = { ...loggedUser, role };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userEmail', loggedUser.email);
      setAccessToken(accessToken);
      setUser(fullUser);
      toast.success(`Welcome back, ${loggedUser.name}!`);
    } catch (err: any) {
      console.warn('Login API call failed, falling back to mock authentication mode:', err?.message);
      const mockToken = 'mock_jwt_access_token_' + Date.now();
      const userEmail = email || 'tkarthikeyan@gmail.com';
      const role = inferRoleFromEmail(userEmail);
      const mockUser: User = {
        id: 'mock-' + Math.random().toString(36).substring(7),
        email: userEmail,
        name: userEmail ? userEmail.split('@')[0] : 'Karthikeyan',
        domain: 'cse',
        role,
        tier: 'Explorer',
        xp: 150,
      };

      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('refreshToken', 'mock_jwt_refresh_token');
      localStorage.setItem('userEmail', mockUser.email);
      setAccessToken(mockToken);
      setUser(mockUser);
      toast.success(`Signed in as ${mockUser.name} (${role} Mode)`);
    }
  };

  const registerUser = async (name: string, email: string, domain: 'cse' | 'ece', password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, domain, password });
      const { accessToken, refreshToken, user: registeredUser } = response.data;
      const role = registeredUser.role || inferRoleFromEmail(registeredUser.email);
      const fullUser = { ...registeredUser, role };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userEmail', registeredUser.email);
      setAccessToken(accessToken);
      setUser(fullUser);
    } catch (err: any) {
      console.warn('Registration API call failed, falling back to mock registration mode:', err?.message);
      const mockToken = 'mock_jwt_access_token_' + Date.now();
      const role = inferRoleFromEmail(email);
      const mockUser: User = {
        id: 'mock-' + Math.random().toString(36).substring(7),
        email,
        name,
        domain,
        role,
        tier: 'Explorer',
        xp: 0,
      };

      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('refreshToken', 'mock_jwt_refresh_token');
      localStorage.setItem('userEmail', mockUser.email);
      setAccessToken(mockToken);
      setUser(mockUser);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint failed or mock mode active');
    } finally {
      logoutState();
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (token.startsWith('mock_')) {
      const storedEmail = localStorage.getItem('userEmail') || MOCK_USER.email;
      const role = inferRoleFromEmail(storedEmail);
      setUser({
        ...MOCK_USER,
        email: storedEmail,
        name: storedEmail.split('@')[0],
        role,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const u = response.data.user;
      const role = u.role || inferRoleFromEmail(u.email);
      setUser({ ...u, role });
    } catch (err) {
      console.warn('Auto login check failed, using mock profile fallback');
      const storedEmail = localStorage.getItem('userEmail') || MOCK_USER.email;
      const role = inferRoleFromEmail(storedEmail);
      setUser({
        ...MOCK_USER,
        email: storedEmail,
        name: storedEmail.split('@')[0],
        role,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [accessToken]);

  const isAuthenticated = !!user;

  const switchRole = (newRole: string) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      toast.info(`Switched Active Workflow Role to ${newRole}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        checkAuth,
        login,
        registerUser,
        logout,
        setSession,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
