/**
 * FTW 11SQN Assessment OLQ Result Service
 * API calls for FTW 11SQN Assessment OLQ result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw11sqnAssessmentOlqResult,
  Ftw11sqnAssessmentOlqResultCadet,
  Ftw11sqnAssessmentOlqResultMark,
  Ftw11sqnAssessmentOlqResultCreateData,
  Ftw11sqnAssessmentOlqResultCadetCreateData,
  Ftw11sqnAssessmentOlqResultMarkCreateData
} from '@/libs/types/ftw11sqnAssessmentOlq';

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
  data: Ftw11sqnAssessmentOlqResult[];
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
  data: Ftw11sqnAssessmentOlqResult[];
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
  data: Ftw11sqnAssessmentOlqResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnAssessmentOlqResult;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnAssessmentOlqResultCadet[];
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnAssessmentOlqResultCadet;
}

interface MarkApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnAssessmentOlqResultMark[];
}

interface SingleMarkApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnAssessmentOlqResultMark;
}

export const ftw11sqnAssessmentOlqResultService = {
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

      const endpoint = `/ftw-11sqn-assessment-olq-results${query.toString() ? `?${query.toString()}` : ''}`;
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

  async getResult(id: number): Promise<Ftw11sqnAssessmentOlqResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/ftw-11sqn-assessment-olq-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch OLQ result ${id}:`, error);
      return null;
    }
  },

  async createResult(data: Ftw11sqnAssessmentOlqResultCreateData): Promise<Ftw11sqnAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ResultActionApiResponse>('/ftw-11sqn-assessment-olq-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create OLQ result');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create OLQ result:', error);
      throw error;
    }
  },

  async updateResult(id: number, data: Partial<Ftw11sqnAssessmentOlqResultCreateData>): Promise<Ftw11sqnAssessmentOlqResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ResultActionApiResponse>(`/ftw-11sqn-assessment-olq-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update OLQ result');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update OLQ result ${id}:`, error);
      throw error;
    }
  },

  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/ftw-11sqn-assessment-olq-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete OLQ result ${id}:`, error);
      return false;
    }
  },

  // Result Cadets Management
  async getResultCadets(resultId: number): Promise<Ftw11sqnAssessmentOlqResultCadet[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch result cadets:', error);
      return [];
    }
  },

  async addResultCadet(resultId: number, data: Ftw11sqnAssessmentOlqResultCadetCreateData): Promise<Ftw11sqnAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<SingleCadetApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add cadet');
      return result.data || null;
    } catch (error) {
      console.error('Failed to add cadet:', error);
      throw error;
    }
  },

  async updateResultCadet(resultId: number, cadetId: number, data: Partial<Ftw11sqnAssessmentOlqResultCadetCreateData>): Promise<Ftw11sqnAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<SingleCadetApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets/${cadetId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update cadet');
      return result.data || null;
    } catch (error) {
      console.error('Failed to update cadet:', error);
      throw error;
    }
  },

  async deleteResultCadet(resultId: number, cadetId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets/${cadetId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete cadet:', error);
      return false;
    }
  },

  // Cadet Marks Management
  async getCadetMarks(resultId: number, cadetId: number): Promise<Ftw11sqnAssessmentOlqResultMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MarkApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets/${cadetId}/marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return [];
    }
  },

  async updateCadetMark(resultId: number, cadetId: number, markId: number, data: { achieved_mark: number; is_active?: boolean }): Promise<Ftw11sqnAssessmentOlqResultMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<SingleMarkApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets/${cadetId}/marks/${markId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to update mark:', error);
      throw error;
    }
  },

  async saveCadetMarks(resultId: number, cadetId: number, marks: Ftw11sqnAssessmentOlqResultMarkCreateData[]): Promise<Ftw11sqnAssessmentOlqResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<SingleCadetApiResponse>(`/ftw-11sqn-assessment-olq-results/${resultId}/cadets/${cadetId}/marks/save`, { marks }, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to save marks');
      return result.data || null;
    } catch (error) {
      console.error('Failed to save marks:', error);
      throw error;
    }
  },
};

export default ftw11sqnAssessmentOlqResultService;
