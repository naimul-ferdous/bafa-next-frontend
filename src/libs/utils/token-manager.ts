/**
 * Client-side Token Manager
 * Handles token storage and validation in the browser
 */

'use client';

import { AuthTokens } from '@/libs/types';

const TOKEN_STORAGE_KEY = 'auth_tokens';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store tokens in localStorage (fallback/backup storage)
 */
export function storeTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  try {
    const tokenData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      timestamp: Date.now(),
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

/**
 * Get stored tokens from localStorage
 */
export function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;

  try {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenData) return null;

    const parsed = JSON.parse(tokenData);
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresIn: parsed.expiresIn,
      tokenType: parsed.tokenType,
    };
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Clear all stored tokens
 */
export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return true;
  }
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
}

/**
 * Check if token is about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
  return Date.now() >= (expiration - threshold);
}
