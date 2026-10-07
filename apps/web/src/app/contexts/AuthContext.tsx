'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  orgId: string;
  name?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const COMPAT_MARKER = 'cookie-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    const response = await fetch('/api/auth/profile', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Session is no longer valid');
    const profile = await response.json();
    setUser(profile);
    // Transitional marker only. It is not a credential; server proxies authenticate with
    // the HttpOnly cookie. Existing screens use this marker to avoid a breaking rewrite.
    localStorage.setItem('token', COMPAT_MARKER);
    return profile as User;
  }, []);

  useEffect(() => {
    void loadProfile()
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Invalid credentials');
      }
      await loadProfile();
      router.replace('/dashboard');
    },
    [loadProfile, router],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => undefined);
    localStorage.removeItem('token');
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
