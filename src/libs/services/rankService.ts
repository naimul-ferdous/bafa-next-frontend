/**
 * Rank Service
 * API calls for rank management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Rank } from '@/libs/types';

export interface RankQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface RankCreateData {
  name: string;
  short_name: string;
  hierarchy_level: number;
  is_active: boolean;
}

export interface RankPaginatedResponse {
  data: Rank[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface RankApiResponse {
  success: boolean;
  message: string;
  data: Rank[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SingleRankApiResponse {
  success: boolean;
  message: string;
  data: Rank;
}

interface RankActionApiResponse {
  success: boolean;
  message: string;
  data?: Rank | null;
}

export const rankService = {
  /**
   * Get all ranks with pagination
   */
  async getAllRanks(params?: RankQueryParams): Promise<RankPaginatedResponse> {
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

      const endpoint = `/ranks${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<RankApiResponse>(endpoint, token);

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
      console.error('Failed to fetch ranks:', error);
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
   * Get single rank
   */
  async getRank(id: number): Promise<Rank | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleRankApiResponse>(`/ranks/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch rank ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new rank
   */
  async createRank(data: RankCreateData): Promise<Rank | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<RankActionApiResponse>('/ranks', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create rank');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create rank:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update rank
   */
  async updateRank(id: number, data: Partial<RankCreateData>): Promise<Rank | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<RankActionApiResponse>(`/ranks/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update rank');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update rank ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete rank
   */
  async deleteRank(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<RankActionApiResponse>(`/ranks/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete rank ${id}:`, error);
      return false;
    }
  },
};

export default rankService;
