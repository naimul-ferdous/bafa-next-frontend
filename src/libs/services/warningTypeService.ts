/**
 * Warning Type Service
 * API calls for warning type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemWarningType } from '@/libs/types/system';

interface WarningTypeQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface WarningTypePaginatedResponse {
  data: SystemWarningType[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface WarningTypeApiResponse {
  success: boolean;
  message: string;
  data: SystemWarningType[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleWarningTypeApiResponse {
  success: boolean;
  message: string;
  data: SystemWarningType;
}

interface WarningTypeActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemWarningType;
}

interface WarningTypeCreateData {
  name: string;
  code: string;
  description?: string;
  reduced_mark: number;
  category?: string;
  consequences?: string;
  is_active?: boolean;
}

export const warningTypeService = {
  async getAllWarningTypes(params?: WarningTypeQueryParams): Promise<WarningTypePaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/system-warning-types${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<WarningTypeApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page: result.pagination?.per_page || 10,
        total: result.pagination?.total || 0,
        last_page: result.pagination?.last_page || 1,
        from: result.pagination?.from || 0,
        to: result.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch warning types:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getWarningType(id: number): Promise<SystemWarningType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleWarningTypeApiResponse>(`/system-warning-types/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch warning type ${id}:`, error);
      return null;
    }
  },

  async createWarningType(data: WarningTypeCreateData): Promise<SystemWarningType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<WarningTypeActionApiResponse>('/system-warning-types', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create warning type');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create warning type:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateWarningType(id: number, data: Partial<WarningTypeCreateData>): Promise<SystemWarningType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<WarningTypeActionApiResponse>(`/system-warning-types/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update warning type');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update warning type ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteWarningType(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<WarningTypeActionApiResponse>(`/system-warning-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete warning type ${id}:`, error);
      return false;
    }
  },
};

export default warningTypeService;
