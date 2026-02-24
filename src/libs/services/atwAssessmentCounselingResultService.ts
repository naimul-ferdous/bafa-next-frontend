/**
 * ATW Assessment Counseling Result Service
 * API calls for counseling result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  AtwAssessmentCounselingResult,
  AtwAssessmentCounselingResultCreateData
} from '@/libs/types/atwAssessmentCounseling';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  instructor_id?: number;
  cadet_id?: number;
}

interface ResultPaginatedResponse {
  data: AtwAssessmentCounselingResult[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ResultApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingResult[];
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
  data: AtwAssessmentCounselingResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentCounselingResult;
}

export const atwAssessmentCounselingResultService = {
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
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.cadet_id) query.append('cadet_id', params.cadet_id.toString());

      const endpoint = `/atw-assessment-counseling-results${query.toString() ? `?${query.toString()}` : ''}`;
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

  /**
   * Get single result
   */
  async getResult(id: number): Promise<AtwAssessmentCounselingResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/atw-assessment-counseling-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new result
   */
  async createResult(data: AtwAssessmentCounselingResultCreateData): Promise<AtwAssessmentCounselingResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ResultActionApiResponse>('/atw-assessment-counseling-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create result');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create result:', error);
      throw error;
    }
  },

  /**
   * Update result
   */
  async updateResult(id: number, data: Partial<AtwAssessmentCounselingResultCreateData>): Promise<AtwAssessmentCounselingResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ResultActionApiResponse>(`/atw-assessment-counseling-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update result');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update result ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete result
   */
  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/atw-assessment-counseling-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  /**
   * Get grouped results by course and semester
   */
  async getGroupedResults(params?: { course_id?: number; semester_id?: number; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/atw-assessment-counseling-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return [];
    }
  },
};

export default atwAssessmentCounselingResultService;
