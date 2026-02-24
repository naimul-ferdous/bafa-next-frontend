/**
 * Auth Provider Component
 * Wrapper component for authentication context
 */

'use client';

import { AuthContextProvider } from '@/context/AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

export default AuthProvider;
