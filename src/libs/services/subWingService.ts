/**
 * SubWing Service
 * API calls for sub-wing management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SubWing, Wing } from '@/libs/types/user';

interface SubWingQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  allData?: boolean;
  is_active?: boolean;
}

interface SubWingPaginatedResponse {
  data: SubWing[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SubWingApiResponse {
  success: boolean;
  message: string;
  data: SubWing[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSubWingApiResponse {
  success: boolean;
  message: string;
  data: SubWing;
}

interface SubWingActionApiResponse {
  success: boolean;
  message: string;
  data?: SubWing;
}

interface SubWingCreateData {
  wing_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export const subWingService = {
  /**
   * Get all sub-wings with pagination
   */
  async getAllSubWings(params?: SubWingQueryParams): Promise<SubWingPaginatedResponse> {
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

      if (params?.allData) {
        query.append('allData', 'true');
      }

      if (params?.is_active !== undefined) {
        query.append('is_active', params.is_active ? '1' : '0');
      }

      const endpoint = `/sub-wings${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<SubWingApiResponse>(endpoint, token);

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
      console.error('Failed to fetch sub-wings:', error);
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
   * Get single sub-wing
   */
  async getSubWing(id: number): Promise<SubWing | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSubWingApiResponse>(`/sub-wings/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch sub-wing ${id}:`, error);
      return null;
    }
  },

  /**
   * Get sub-wings by wing ID
   */
  async getSubWingsByWing(wingId: number): Promise<SubWing[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: SubWing[] }>(`/sub-wings/by-wing/${wingId}`, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error(`Failed to fetch sub-wings for wing ${wingId}:`, error);
      return [];
    }
  },

  /**
   * Create new sub-wing
   */
  async createSubWing(data: SubWingCreateData): Promise<SubWing | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<SubWingActionApiResponse>('/sub-wings', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create sub-wing');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create sub-wing:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update sub-wing
   */
  async updateSubWing(id: number, data: Partial<SubWingCreateData>): Promise<SubWing | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<SubWingActionApiResponse>(`/sub-wings/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update sub-wing');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update sub-wing ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete sub-wing
   */
  async deleteSubWing(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SubWingActionApiResponse>(`/sub-wings/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete sub-wing ${id}:`, error);
      return false;
    }
  },
};

export default subWingService;
