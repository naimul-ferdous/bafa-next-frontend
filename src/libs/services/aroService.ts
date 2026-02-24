/**
 * ARO (Academy Routine Orders) Service
 * API calls for ARO management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Aro, AroCreateData, AroStatus } from '@/libs/types/aro';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: AroStatus;
  from_date?: string;
  to_date?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** POST/PUT with multipart/form-data for file uploads */
async function formDataRequest<T>(
  method: 'POST' | 'PUT',
  endpoint: string,
  data: AroCreateData,
  token?: string
): Promise<T> {
  const form = new FormData();
  form.append('title', data.title);
  form.append('expired_date', data.expired_date);
  form.append('status', data.status);
  if (data.file) form.append('file', data.file);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: form,
  });

  const result = await response.json();
  if (!response.ok) throw result;
  return result;
}

export const aroService = {
  /** Get all AROs with pagination and filters */
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Aro>> {
    try {
      const query = new URLSearchParams();
      if (params?.page)      query.append('page', params.page.toString());
      if (params?.per_page)  query.append('per_page', params.per_page.toString());
      if (params?.search)    query.append('search', params.search);
      if (params?.status)    query.append('status', params.status);
      if (params?.from_date) query.append('from_date', params.from_date);
      if (params?.to_date)   query.append('to_date', params.to_date);

      const endpoint = `/aros${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse<Aro[]>>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page:     result.pagination?.per_page     || 15,
        total:        result.pagination?.total        || 0,
        last_page:    result.pagination?.last_page    || 1,
        from:         result.pagination?.from         || 0,
        to:           result.pagination?.to           || 0,
      };
    } catch (error) {
      console.error('Failed to fetch AROs:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /** Get single ARO */
  async getOne(id: number): Promise<Aro | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApiResponse<Aro>>(`/aros/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch ARO ${id}:`, error);
      return null;
    }
  },

  /** Create a new ARO (supports file upload) */
  async create(data: AroCreateData): Promise<Aro | null> {
    try {
      const token = getToken();
      const result = await formDataRequest<ApiResponse<Aro>>('POST', '/aros', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create ARO:', error);
      throw error;
    }
  },

  /** Update an ARO (supports file upload) */
  async update(id: number, data: AroCreateData): Promise<Aro | null> {
    try {
      const token = getToken();
      const result = await formDataRequest<ApiResponse<Aro>>('POST', `/aros/${id}?_method=PUT`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update ARO ${id}:`, error);
      throw error;
    }
  },

  /** Update only the status */
  async updateStatus(id: number, status: AroStatus): Promise<Aro | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<ApiResponse<Aro>>(`/aros/${id}/status`, { status }, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update ARO status ${id}:`, error);
      throw error;
    }
  },

  /** Delete an ARO */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ApiResponse<null>>(`/aros/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete ARO ${id}:`, error);
      return false;
    }
  },

  /** Get available statuses */
  async getStatuses(): Promise<Record<string, string>> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApiResponse<Record<string, string>>>('/aros/statuses', token);
      return result?.data || {};
    } catch (error) {
      console.error('Failed to fetch ARO statuses:', error);
      return {};
    }
  },
};
