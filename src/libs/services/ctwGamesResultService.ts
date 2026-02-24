/**
 * CTW Games Result Service
 * API calls for CTW Games results management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  CtwGamesResult,
  CtwGamesResultCreateData
} from '@/libs/types/ctwGames';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  exam_type_id?: number;
  instructor_id?: number;
}

interface ResultPaginatedResponse {
  data: CtwGamesResult[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ResultApiResponse {
  success: boolean;
  message: string;
  data: CtwGamesResult[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleResultApiResponse {
  success: boolean;
  message: string;
  data: CtwGamesResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: CtwGamesResult;
}

export const ctwGamesResultService = {
  async getAllResults(ctwResultsModuleId: number, params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      query.append('ctw_results_module_id', ctwResultsModuleId.toString());

      const endpoint = `/ctw-results${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(endpoint, token);

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
      console.error('Failed to fetch results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getResult(ctwResultsModuleId: number, id: number): Promise<CtwGamesResult | null> {
    try {
      const query = new URLSearchParams();
      query.append('ctw_results_module_id', ctwResultsModuleId.toString());
      const endpoint = `/ctw-results/${id}?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch result ${id}:`, error);
      return null;
    }
  },

  async createResult(data: CtwGamesResultCreateData): Promise<CtwGamesResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ResultActionApiResponse>('/ctw-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create result');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create result:', error);
      throw error;
    }
  },

  async updateResult(id: number, data: Partial<CtwGamesResultCreateData>): Promise<CtwGamesResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ResultActionApiResponse>(`/ctw-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update result');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update result ${id}:`, error);
      throw error;
    }
  },

  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/ctw-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  async getGroupedResults(params?: { course_id?: number; semester_id?: number; ctw_results_module_id?: number; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.ctw_results_module_id) query.append('ctw_results_module_id', params.ctw_results_module_id.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/ctw-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return [];
    }
  },

  async getInitialFetchData(params: { module_code: string; course_id: number; semester_id: number }): Promise<any> {
    try {
      const query = new URLSearchParams();
      query.append('module_code', params.module_code);
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ctw-results/initial-fetch?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch initial module data:', error);
      return null;
    }
  },
};

export default ctwGamesResultService;
