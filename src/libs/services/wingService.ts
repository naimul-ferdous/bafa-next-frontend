/**
 * Wing Service
 * API calls for wing management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Wing } from '@/libs/types/user';

interface WingQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface WingPaginatedResponse {
  data: Wing[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface WingApiResponse {
  success: boolean;
  message: string;
  data: Wing[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleWingApiResponse {
  success: boolean;
  message: string;
  data: Wing;
}

interface WingActionApiResponse {
  success: boolean;
  message: string;
  data?: Wing;
}

interface WingCreateData {
  name: string;
  code: string;
  description?: string;
  location?: string;
  is_active?: boolean;
}

export const wingService = {
  /**
   * Get all wings with pagination
   */
  async getAllWings(params?: WingQueryParams): Promise<WingPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.search) {
        query.append('search', params.search);
      }

      const endpoint = `/wings${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<WingApiResponse>(endpoint, token);

      if (!result) {
        return {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        };
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
      console.error('Failed to fetch wings:', error);
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      };
    }
  },

  /**
   * Get single wing
   */
  async getWing(id: number): Promise<Wing | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleWingApiResponse>(`/wings/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch wing ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new wing
   */
  async createWing(data: WingCreateData): Promise<Wing | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<WingActionApiResponse>('/wings', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create wing');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create wing:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update wing
   */
  async updateWing(id: number, data: Partial<WingCreateData>): Promise<Wing | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<WingActionApiResponse>(`/wings/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update wing');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update wing ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete wing
   */
  async deleteWing(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<WingActionApiResponse>(`/wings/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete wing ${id}:`, error);
      return false;
    }
  },
};

export default wingService;
