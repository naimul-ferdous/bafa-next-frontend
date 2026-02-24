import Cookies from 'js-cookie';

const TOKEN_KEY = 'bafa_token_stored_credential';

/**
 * Store token in client-side cookie
 */
export const setToken = async (token: string): Promise<void> => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

/**
 * Get token from client-side cookie
 */
export const getToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

/**
 * Remove token from client-side cookie
 */
export const removeToken = async (): Promise<void> => {
  Cookies.remove(TOKEN_KEY, { path: '/' });
};