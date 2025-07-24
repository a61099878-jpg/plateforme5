import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, type AuthUser } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'student') => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: (forceLogoutOnRestart?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if app should force logout on restart
    const shouldForceLogout = localStorage.getItem('force_logout_on_restart');
    
    if (shouldForceLogout === 'true') {
      // Force logout and clear everything
      api.clearToken();
      localStorage.removeItem('force_logout_on_restart');
      setUser(null);
      setLoading(false);
      return;
    }

    // Verify token on app start
    const verifyToken = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('auth_token');
        const tokenTimestamp = localStorage.getItem('auth_token_timestamp');
        
        if (!token) {
          throw new Error('No token found');
        }
        
        // Check token age (24 hours max)
        if (tokenTimestamp) {
          const tokenAge = Date.now() - parseInt(tokenTimestamp);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (tokenAge > maxAge) {
            throw new Error('Token expired');
          }
        }
        
        const response = await api.verifyToken();
        
        // Verify user data consistency
        const cachedUser = localStorage.getItem('user_data');
        if (cachedUser) {
          const parsedCachedUser = JSON.parse(cachedUser);
          if (parsedCachedUser.id !== response.user.id) {
            throw new Error('User data mismatch - security issue');
          }
        }
        
        setUser(response.user);
      } catch (error) {
        console.log('Token verification failed:', error);
        api.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'student') => {
    try {
      const response = await api.login(email, password, role);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // Clear any existing token/user data first
      api.clearToken();
      setUser(null);
      
      // Register new account
      await api.register(email, password);
      
      // Automatically login the user after successful registration
      const response = await api.login(email, password, 'student');
      setUser(response.user);
    } catch (error) {
      // If register succeeded but login failed, clear everything
      api.clearToken();
      setUser(null);
      throw error;
    }
  };

  const logout = (forceLogoutOnRestart: boolean = false) => {
    api.clearToken();
    setUser(null);
    
    // If requested, set flag to force logout on next app restart
    if (forceLogoutOnRestart) {
      localStorage.setItem('force_logout_on_restart', 'true');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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