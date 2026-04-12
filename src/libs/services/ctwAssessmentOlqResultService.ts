/**
 * CTW Assessment OLQ Result Service
 * API calls for CTW Assessment OLQ result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  CtwAssessmentOlqResult,
  CtwAssessmentOlqResultCadet,
  CtwAssessmentOlqResultMark,
  CtwAssessmentOlqResultCreateData,
  CtwAssessmentOlqResultCadetCreateData,
  CtwAssessmentOlqResultMarkCreateData
} from '@/libs/types/ctwAssessmentOlq';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  group_id?: number;
  olq_type_id?: number;
}

interface ResultPaginatedResponse {
  data: CtwAssessmentOlqResult[];
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
  data: CtwAssessmentOlqResult[];
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
  data: CtwAssessmentOlqResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: CtwAssessmentOlqResult;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: CtwAssessmentOlqResultCadet[];
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: CtwAssessmentOlqResultCadet;
}

interface MarkApiResponse {
  success: boolean;
  message: string;
  data: CtwAssessmentOlqResultMark[];
}

interface SingleMarkApiResponse {
  success: boolean;
  message: string;
  data: CtwAssessmentOlqResultMark;
}

export const ctwAssessmentOlqResultService = {
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
      if (params?.group_id) query.append('group_id', params.group_id.toString());
      if (params?.olq_type_id) query.append('olq_type_id', params.olq_type_id.toString());

      const endpoint = `/ctw-assessment-olq-results${query.toString() ? `?${query.toString()}` : ''}`;
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
  async getResult(id: number): Promise<CtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/ctw-assessment-olq-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch OLQ result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new OLQ result
   */
  async createResult(data: CtwAssessmentOlqResultCreateData): Promise<CtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ResultActionApiResponse>('/ctw-assessment-olq-results', data, token);
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
  async updateResult(id: number, data: Partial<CtwAssessmentOlqResultCreateData>): Promise<CtwAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ResultActionApiResponse>(`/ctw-assessment-olq-results/${id}`, data, token);
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
      const result = await apiClient.delete<ResultActionApiResponse>(`/ctw-assessment-olq-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete OLQ result ${id}:`, error);
      return false;
    }
  },

  // ==================== Result Cadets Management ====================

  /**
   * Get result cadets
   */
  async getResultCadets(resultId: number): Promise<CtwAssessmentOlqResultCadet[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch result cadets:', error);
      return [];
    }
  },

  /**
   * Add cadet to result
   */
  async addResultCadet(resultId: number, data: CtwAssessmentOlqResultCadetCreateData): Promise<CtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleCadetApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets`, data, token);
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
  async updateResultCadet(resultId: number, cadetId: number, data: Partial<CtwAssessmentOlqResultCadetCreateData>): Promise<CtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleCadetApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets/${cadetId}`, data, token);
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
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-assessment-olq-results/${resultId}/cadets/${cadetId}`, token);
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
  async getCadetMarks(resultId: number, cadetId: number): Promise<CtwAssessmentOlqResultMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MarkApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks`, token);
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
  }): Promise<CtwAssessmentOlqResultMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleMarkApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks/${markId}`, data, token);
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
  async saveCadetMarks(resultId: number, cadetId: number, marks: CtwAssessmentOlqResultMarkCreateData[]): Promise<CtwAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleCadetApiResponse>(`/ctw-assessment-olq-results/${resultId}/cadets/${cadetId}/marks`, { marks }, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to save marks');

      return result.data || null;
    } catch (error) {
      console.error('Failed to save marks:', error);
      throw error;
    }
  },

  /**
   * Bulk approve cadets
   */
  async bulkApprove(data: { result_id: number; cadet_ids: number[]; authority_id: number }): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<any>('/ctw-assessment-olq-results/bulk-approve', data, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      throw error;
    }
  },

  /**
   * Bulk reject cadets
   */
  async bulkReject(data: { result_id: number; cadet_ids: number[]; authority_id: number; reason?: string }): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<any>('/ctw-assessment-olq-results/bulk-reject', data, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk reject:', error);
      throw error;
    }
  },
};

export default ctwAssessmentOlqResultService;
