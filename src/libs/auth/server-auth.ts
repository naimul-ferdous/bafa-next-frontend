import { cookies } from 'next/headers';
import { User } from '@/libs/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'bafa_token_stored_credential';

export async function getServerAuth(): Promise<{
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  }

  // Fetch user profile from backend
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store', // Don't cache auth requests
    });

    if (!response.ok) {
      // Token is invalid or expired
      return {
        isAuthenticated: false,
        token: null,
        user: null,
      };
    }

    const data = await response.json();

    if (data.user) {
      return {
        isAuthenticated: true,
        token,
        user: data.user,
      };
    }

    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  } catch (error) {
    console.error('Server auth error:', error);
    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  }
}