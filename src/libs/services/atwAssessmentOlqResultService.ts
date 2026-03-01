/**
 * ATW Assessment OLQ Result Service
 * API calls for ATW Assessment OLQ result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  AtwAssessmentOlqResult,
  AtwAssessmentOlqResultCadet,
  AtwAssessmentOlqResultMark,
  AtwAssessmentOlqResultCreateData,
  AtwAssessmentOlqResultCadetCreateData,
  AtwAssessmentOlqResultMarkCreateData
} from '@/libs/types/atwAssessmentOlq';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  olq_type_id?: number;
}

interface ResultPaginatedResponse {
  data: AtwAssessmentOlqResult[];
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
  data: AtwAssessmentOlqResult[];
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
  data: AtwAssessmentOlqResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentOlqResult;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqResultCadet[];
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqResultCadet;
}

interface MarkApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqResultMark[];
}

interface SingleMarkApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqResultMark;
}

export const atwAssessmentOlqResultService = {
  /**
   * Get all OLQ results with pagination
   */
  async getAllResults(params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());
      if (params?.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params?.group_id) query.append('group_id', params.group_id.toString());
      if (params?.olq_type_id) query.append('olq_type_id', params.olq_type_id.toString());

      const endpoint = `/atw-assessment-olq-results${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch OLQ results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single OLQ result
   */
  async getResult(id: number): Promise<AtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/atw-assessment-olq-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch OLQ result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new OLQ result
   */
  async createResult(data: AtwAssessmentOlqResultCreateData): Promise<AtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ResultActionApiResponse>('/atw-assessment-olq-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create OLQ result');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create OLQ result:', error);
      throw error;
    }
  },

  /**
   * Update OLQ result
   */
  async updateResult(id: number, data: Partial<AtwAssessmentOlqResultCreateData>): Promise<AtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ResultActionApiResponse>(`/atw-assessment-olq-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update OLQ result');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update OLQ result ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete OLQ result
   */
  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/atw-assessment-olq-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete OLQ result ${id}:`, error);
      return false;
    }
  },

  /**
   * Get results grouped by course and semester with pagination
   */
  async getGroupedResults(params?: { page?: number; per_page?: number; search?: string }): Promise<ResultPaginatedResponse & { data: any[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/atw-assessment-olq-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

      return {
        data: result?.data || [],
        current_page: result?.pagination?.current_page || 1,
        last_page: result?.pagination?.last_page || 1,
        per_page: result?.pagination?.per_page || 10,
        total: result?.pagination?.total || 0,
        from: result?.pagination?.from || 0,
        to: result?.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch grouped OLQ results:', error);
      return { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
    }
  },

  // ==================== Result Cadets Management ====================

  /**
   * Get result cadets
   */
  async getResultCadets(resultId: number): Promise<AtwAssessmentOlqResultCadet[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch result cadets:', error);
      return [];
    }
  },

  /**
   * Add cadet to result
   */
  async addResultCadet(resultId: number, data: AtwAssessmentOlqResultCadetCreateData): Promise<AtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleCadetApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add cadet');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add cadet:', error);
      throw error;
    }
  },

  /**
   * Update result cadet
   */
  async updateResultCadet(resultId: number, cadetId: number, data: Partial<AtwAssessmentOlqResultCadetCreateData>): Promise<AtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleCadetApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets/${cadetId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update cadet');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update cadet:', error);
      throw error;
    }
  },

  /**
   * Delete result cadet
   */
  async deleteResultCadet(resultId: number, cadetId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-assessment-olq-results/${resultId}/cadets/${cadetId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete cadet:', error);
      return false;
    }
  },

  // ==================== Cadet Marks Management ====================

  /**
   * Get cadet marks
   */
  async getCadetMarks(resultId: number, cadetId: number): Promise<AtwAssessmentOlqResultMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MarkApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return [];
    }
  },

  /**
   * Update cadet mark
   */
  async updateCadetMark(resultId: number, cadetId: number, markId: number, data: {
    achieved_mark: number;
    is_active?: boolean;
  }): Promise<AtwAssessmentOlqResultMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleMarkApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks/${markId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update mark:', error);
      throw error;
    }
  },

  /**
   * Save all cadet marks (replaces existing marks)
   */
  async saveCadetMarks(resultId: number, cadetId: number, marks: AtwAssessmentOlqResultMarkCreateData[]): Promise<AtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleCadetApiResponse>(`/atw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks`, { marks }, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to save marks');

      return result.data || null;
    } catch (error) {
      console.error('Failed to save marks:', error);
      throw error;
    }
  },
};

export default atwAssessmentOlqResultService;
