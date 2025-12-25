'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { username: string; email: string; password: string; full_name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'tx_monitor_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from cookies on mount
  useEffect(() => {
    const savedToken = Cookies.get(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user data
  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        // Token invalid, clear it
        Cookies.remove(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      Cookies.remove(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        Cookies.set(TOKEN_KEY, data.token, { expires: 7 }); // 7 days
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  };

  // Register
  const register = async (data: { username: string; email: string; password: string; full_name?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.success && result.token) {
        Cookies.set(TOKEN_KEY, result.token, { expires: 7 });
        setToken(result.token);
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error || 'สมัครสมาชิกไม่สำเร็จ' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  };

  // Logout
  const logout = () => {
    Cookies.remove(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Refresh user
  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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

// Hook to get auth headers
export function useAuthHeaders() {
  const { token } = useAuth();
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
}
