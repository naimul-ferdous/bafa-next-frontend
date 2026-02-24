/**
 * CPTC Professional Result Service
 * API calls for CPTC professional result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  CptcProfessionalResult,
  CptcProfessionalResultFormData,
  CptcProfessionalCadetMark
} from '@/libs/types/cptcProfessionalResult';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
}

interface ResultPaginatedResponse {
  data: CptcProfessionalResult[];
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
  data: CptcProfessionalResult[];
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
  data: CptcProfessionalResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: CptcProfessionalResult;
}

export const cptcProfessionalResultService = {
  /**
   * Get all results with pagination
   */
  async getAllResults(params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());
      if (params?.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params?.group_id) query.append('group_id', params.group_id.toString());

      const endpoint = `/cptc-professional-results${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch professional results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get results by course
   */
  async getResultsByCourse(courseId: number): Promise<CptcProfessionalResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: CptcProfessionalResult[] }>(`/cptc-professional-results/by-course/${courseId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch professional results by course:', error);
      return [];
    }
  },

  /**
   * Get single result
   */
  async getResult(id: number): Promise<CptcProfessionalResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/cptc-professional-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch professional result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new result
   */
  async createResult(data: CptcProfessionalResultFormData): Promise<CptcProfessionalResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ResultActionApiResponse>('/cptc-professional-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create professional result');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create professional result:', error);
      throw error;
    }
  },

  /**
   * Update result
   */
  async updateResult(id: number, data: CptcProfessionalResultFormData): Promise<CptcProfessionalResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ResultActionApiResponse>(`/cptc-professional-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update professional result');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update professional result:', error);
      throw error;
    }
  },

  /**
   * Delete result
   */
  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.delete<ResultActionApiResponse>(`/cptc-professional-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete professional result:', error);
      throw error;
    }
  },

  /**
   * Get cadet marks for a result
   */
  async getCadetMarks(resultId: number): Promise<CptcProfessionalCadetMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: CptcProfessionalCadetMark[] }>(`/cptc-professional-results/${resultId}/cadet-marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return [];
    }
  },
};
