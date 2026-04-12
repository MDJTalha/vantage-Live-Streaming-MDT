'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// C-06 FIX: API URL required in production — no localhost fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL && process.env.NODE_ENV === 'production') {
  console.error('❌ NEXT_PUBLIC_API_URL is not configured');
}
const BASE_API = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// C-06 FIX: Demo mode ONLY enabled via explicit env var
const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Demo mode users for local development ONLY
 * Gated behind NEXT_PUBLIC_DEMO_MODE=true environment variable
 */
const DEMO_USERS: Record<string, { password: string; user: User }> = DEMO_MODE_ENABLED ? {
  'admin@vantage.live': {
    password: '@admin@123#',
    user: {
      id: 'admin-001',
      email: 'admin@vantage.live',
      name: 'VANTAGE Admin',
      role: 'ADMIN',
      emailVerified: true,
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
    }
  },
  'host@vantage.live': {
    password: '@host@123#',
    user: {
      id: 'host-001',
      email: 'host@vantage.live',
      name: 'Demo Host',
      role: 'HOST',
      emailVerified: true,
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
    }
  },
  'user@vantage.live': {
    password: '@user@123#',
    user: {
      id: 'user-001',
      email: 'user@vantage.live',
      name: 'Demo User',
      role: 'PARTICIPANT',
      emailVerified: true,
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
    }
  }
} : {};

/**
 * Check if a password matches a demo user (only when demo mode enabled)
 */
function checkDemoLogin(email: string, password: string): User | null {
  if (!DEMO_MODE_ENABLED) return null;

  const demoUser = DEMO_USERS[email.toLowerCase()];
  if (demoUser && demoUser.password === password) {
    return demoUser.user;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored user first
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoading(false);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        fetchUser(token);
      }
    } else if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser(token: string) {
    if (!BASE_API) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_API}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const user = userData.success ? (userData.data || userData) : userData;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // C-06 FIX: No silent fallback — if API is down, user is not authenticated
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // C-06 FIX: Demo login ONLY when explicitly enabled
    if (DEMO_MODE_ENABLED) {
      const demoUser = checkDemoLogin(email, password);
      if (demoUser) {
        const mockAccessToken = `demo-access-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const mockRefreshToken = `demo-refresh-token-${Date.now()}`;

        localStorage.setItem('accessToken', mockAccessToken);
        localStorage.setItem('refreshToken', mockRefreshToken);
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));

        console.log('✅ Demo login successful:', demoUser.email);
        return { success: true };
      }
    }

    // C-06 FIX: API login — fail hard if no API URL configured
    if (!BASE_API) {
      return { success: false, error: 'API is not configured. Set NEXT_PUBLIC_API_URL.' };
    }

    try {
      const response = await fetch(`${BASE_API}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user || (data.data && data.data.user);
        const accessToken = data.accessToken || (data.data && data.data.tokens && data.data.tokens.accessToken);
        const refreshToken = data.refreshToken || (data.data && data.data.tokens && data.data.tokens.refreshToken);

        if (!user || !accessToken) {
          return { success: false, error: 'Invalid response from server' };
        }

        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // C-06 FIX: No fallback to demo — return clear error
      return { success: false, error: 'Unable to connect to authentication server' };
    }
  }

  async function register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    // C-06 FIX: API registration — fail hard if no API URL configured
    if (!BASE_API) {
      return { success: false, error: 'API is not configured. Set NEXT_PUBLIC_API_URL.' };
    }

    try {
      const response = await fetch(`${BASE_API}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user || (data.data && data.data.user);
        const accessToken = data.accessToken || (data.data && data.data.tokens && data.data.tokens.accessToken);
        const refreshToken = data.refreshToken || (data.data && data.data.tokens && data.data.tokens.refreshToken);

        if (!user || !accessToken) {
          return { success: false, error: 'Invalid response from server' };
        }

        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        router.push('/dashboard');

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // C-06 FIX: No demo mode fallback — return clear error
      return { success: false, error: 'Unable to connect to registration server' };
    }
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');

      // C-06 FIX: Only call API logout for non-demo tokens when API is available
      if (refreshToken && accessToken && !accessToken.startsWith('demo-') && BASE_API) {
        await fetch(`${BASE_API}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  }

  async function updateUser(data: Partial<User>) {
    if (!BASE_API) return;

    try {
      const accessToken = localStorage.getItem('accessToken');

      // C-06 FIX: Demo tokens update locally only
      if (accessToken?.startsWith('demo-')) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return;
      }

      if (!accessToken) return;

      const response = await fetch(`${BASE_API}/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const userData = await response.json();
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
