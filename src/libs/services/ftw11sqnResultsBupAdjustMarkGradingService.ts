/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11SQN Results BUP Adjust Mark Grading Service
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface Ftw11sqnResultsBupAdjustMarkGrading {
  id: number;
  obtain_mark: string | number | null;
  adjusted_mark: string | number | null;
  grade: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  creator?: { id: number; name: string } | null;
  updater?: { id: number; name: string } | null;
}

export interface Ftw11sqnResultsBupAdjustMarkGradingPayload {
  obtain_mark?: number | string | null;
  adjusted_mark?: number | string | null;
  grade?: string | null;
}

interface QueryParams {
  page?: number;
  per_page?: number;
}

interface PaginatedResponse {
  data: Ftw11sqnResultsBupAdjustMarkGrading[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnResultsBupAdjustMarkGrading[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnResultsBupAdjustMarkGrading;
}

const BASE = '/ftw-11sqn-results-bup-adjust-mark-grading';

export const ftw11sqnResultsBupAdjustMarkGradingService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());

      const endpoint = `${BASE}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);

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
      console.error('Failed to fetch bup adjust mark grading records:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getById(id: number): Promise<Ftw11sqnResultsBupAdjustMarkGrading | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`${BASE}/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch bup adjust mark grading record ${id}:`, error);
      return null;
    }
  },

  async create(data: Ftw11sqnResultsBupAdjustMarkGradingPayload): Promise<Ftw11sqnResultsBupAdjustMarkGrading | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<SingleApiResponse>(BASE, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create record');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create bup adjust mark grading record:', error);
      throw error;
    }
  },

  async update(id: number, data: Ftw11sqnResultsBupAdjustMarkGradingPayload): Promise<Ftw11sqnResultsBupAdjustMarkGrading | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<SingleApiResponse>(`${BASE}/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update record');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update bup adjust mark grading record ${id}:`, error);
      throw error;
    }
  },

  async remove(id: number): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.delete<{ success: boolean; message: string }>(`${BASE}/${id}`, token);
      return !!result?.success;
    } catch (error) {
      console.error(`Failed to delete bup adjust mark grading record ${id}:`, error);
      throw error;
    }
  },
};

export default ftw11sqnResultsBupAdjustMarkGradingService;
