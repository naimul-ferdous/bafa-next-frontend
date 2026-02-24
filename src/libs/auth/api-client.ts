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
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

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
      body: JSON.stringify(data),
      token,
    });
  }

  async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const apiClient = new ApiClient();
export default apiClient;