/**
 * Authentication Context
 * Manages authentication state for the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthContextType } from '@/libs/types';
import { authService } from '@/libs/services/authService';
import { getErrorMessage } from '@/libs/utils/api-error-handler';
import { getToken, setToken, removeToken } from '@/libs/auth/auth-token';

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthContext Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const router = useRouter();

  /**
   * Check if token exists
   */
  const hasToken = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!getToken();
  };

  /**
   * Load user from session on mount
   */
  useEffect(() => {
    // Only load user if we have a token
    if (hasToken()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Listen for session expiration or displacement (logged in from another device)
   */
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      removeToken();
      setUser(null);
      setMenus([]);
      setError(detail?.message || 'Your session has expired. Please log in again.');
      router.push('/signin');
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [router]);

  /**
   * Load user data from API
   */
  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();

      if (response.user) {
        setUser(response.user);
        setMenus(response.menus || []);
        setError(null);
      } else {
        setUser(null);
        setMenus([]);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      // Ensure token is removed and user is redirected on 401/error
      await removeToken();
      setUser(null);
      setMenus([]);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(email, password);

      if (response.token && response.user) {
        // Store access token
        await setToken(response.token);

        // Fetch user with menus
        const userResponse = await authService.getCurrentUser();

        // Set user state and menus
        setUser(userResponse.user);
        setMenus(userResponse.menus || []);
        setError(null);

        // Redirect to dashboard
        router.push('/');
        router.refresh();
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Call logout API
      await authService.logout();

      // Clear token
      await removeToken();

      // Clear user state and menus
      setUser(null);
      setMenus([]);
      setError(null);

      // Redirect to login
      router.push('/signin');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      // Clear state anyway
      await removeToken();
      setUser(null);
      setMenus([]);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await loadUser();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user;

  /**
   * Check user administrative levels
   */
  const userIsSuperAdmin = !!user?.roles?.some(role => role.is_super_admin);
  
  const userIsSystemAdmin = userIsSuperAdmin || 
    !!user?.roles?.some(role => role.slug === 'cptc') ||
    !!user?.roleAssignments?.some(ra => ra.wing?.code === 'CPTC');

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    clearError,
    menus,
    userIsSuperAdmin,
    userIsSystemAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Backward compatibility export
export const AuthContextProvider = AuthProvider;
