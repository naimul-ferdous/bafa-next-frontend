/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Client for communicating with Laravel backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    // Use Record type for better type safety
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Only set Content-Type to application/json if body is not FormData
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add existing headers from fetchOptions
    if (fetchOptions.headers) {
      const existingHeaders = new Headers(fetchOptions.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // console.log('[API Client] Token added to request:', endpoint, 'Token exists:', !!token);
    } else {
      // console.warn('[API Client] No token provided for request:', endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error response formats
        // 1. { message: "...", errors: ... } (Standard Laravel 422)
        // 2. { error: "..." } (Our custom 401/403)
        // 3. { message: "..." } (Our custom 422)

        // Dispatch session expired event so AuthContext can auto-logout
        if (response.status === 401 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { message: data.message || 'Session expired. Please log in again.' } }));       
        }

        const errorMessage = data.error || data.message || 'Request failed';

        const errorObj = {
          status: response.status,
          message: errorMessage,
          error: data.error, // Keep raw error field just in case
          errors: data.errors,
          url,
          data: data // Keep full data for debugging
        };

        console.error('[API Client] Request failed:', JSON.stringify(errorObj, null, 2));
        throw errorObj;
      }

      return data;
    } catch (error: any) {
      // If it's already our formatted error, rethrow it
      if (error.status) {
        throw error;
      }

      // Network or parsing error
      const networkError = {
        status: 500,
        message: error.message || 'Network error',
        url,
        originalError: error
      };
      console.error('[API Client] Network error:', networkError);
      throw networkError;
    }
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      token,
    });
  }

  async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      token,
    });
  }

  async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
    // For Laravel, PUT with FormData sometimes doesn't work well due to PHP parsing.
    // If it's FormData, we might need to send it as POST with _method=PUT.
    // We'll pass it as is, and the caller should handle appending _method=PUT if it's FormData.
    const isFormData = data instanceof FormData;
    if (isFormData) {
      data.append('_method', 'PUT');
    }

    return this.request<T>(endpoint, {
      method: isFormData ? 'POST' : 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      token,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const apiClient = new ApiClient();
export default apiClient;