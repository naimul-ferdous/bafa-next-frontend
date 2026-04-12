/**
 * FTW 11SQN Assessment Command Result Service
 * API calls for FTW 11SQN Assessment Command result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw11SqnAssessmentCommandResult,
  Ftw11SqnAssessmentCommandResultCadet,
  Ftw11SqnAssessmentCommandResultMark,
  Ftw11SqnAssessmentCommandResultCreateData,
  Ftw11SqnAssessmentCommandResultCadetCreateData,
  Ftw11SqnAssessmentCommandResultMarkCreateData
} from '@/libs/types/ftw11sqnAssessmentCommand';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  command_type_id?: number;
}

interface ResultPaginatedResponse {
  data: Ftw11SqnAssessmentCommandResult[];
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
  data: Ftw11SqnAssessmentCommandResult[];
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
  data: Ftw11SqnAssessmentCommandResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11SqnAssessmentCommandResult;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCommandResultCadet[];
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCommandResultCadet;
}

interface MarkApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCommandResultMark[];
}

interface SingleMarkApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCommandResultMark;
}

export const Ftw11SqnAssessmentCommandResultService = {
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
      if (params?.command_type_id) query.append('command_type_id', params.command_type_id.toString());

      const endpoint = `/ftw-11sqn-assessment-command-results${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch Command results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getResult(id: number): Promise<Ftw11SqnAssessmentCommandResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/ftw-11sqn-assessment-command-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch Command result ${id}:`, error);
      return null;
    }
  },

  async createResult(data: Ftw11SqnAssessmentCommandResultCreateData): Promise<Ftw11SqnAssessmentCommandResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ResultActionApiResponse>('/ftw-11sqn-assessment-command-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create Command result');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create Command result:', error);
      throw error;
    }
  },

  async updateResult(id: number, data: Partial<Ftw11SqnAssessmentCommandResultCreateData>): Promise<Ftw11SqnAssessmentCommandResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ResultActionApiResponse>(`/ftw-11sqn-assessment-command-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update Command result');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update Command result ${id}:`, error);
      throw error;
    }
  },

  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/ftw-11sqn-assessment-command-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete Command result ${id}:`, error);
      return false;
    }
  },

  // Result Cadets Management
  async getResultCadets(resultId: number): Promise<Ftw11SqnAssessmentCommandResultCadet[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch result cadets:', error);
      return [];
    }
  },

  async addResultCadet(resultId: number, data: Ftw11SqnAssessmentCommandResultCadetCreateData): Promise<Ftw11SqnAssessmentCommandResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<SingleCadetApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add cadet');
      return result.data || null;
    } catch (error) {
      console.error('Failed to add cadet:', error);
      throw error;
    }
  },

  async updateResultCadet(resultId: number, cadetId: number, data: Partial<Ftw11SqnAssessmentCommandResultCadetCreateData>): Promise<Ftw11SqnAssessmentCommandResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<SingleCadetApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets/${cadetId}`, data, token);
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
      const result = await apiClient.delete<{ success: boolean }>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets/${cadetId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete cadet:', error);
      return false;
    }
  },

  // Cadet Marks Management
  async getCadetMarks(resultId: number, cadetId: number): Promise<Ftw11SqnAssessmentCommandResultMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MarkApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets/${cadetId}/marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return [];
    }
  },

  async updateCadetMark(resultId: number, cadetId: number, markId: number, data: { achieved_mark: number; is_active?: boolean }): Promise<Ftw11SqnAssessmentCommandResultMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<SingleMarkApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets/${cadetId}/marks/${markId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to update mark:', error);
      throw error;
    }
  },

  async saveCadetMarks(resultId: number, cadetId: number, marks: Ftw11SqnAssessmentCommandResultMarkCreateData[]): Promise<Ftw11SqnAssessmentCommandResultCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
        const result = await apiClient.post<SingleCadetApiResponse>(`/ftw-11sqn-assessment-command-results/${resultId}/cadets/${cadetId}/marks/save`, { marks }, token);
        if (!result || !result.success) throw new Error(result?.message || 'Failed to save marks');
      return result.data || null;
    } catch (error) {
      console.error('Failed to save marks:', error);
      throw error;
    }
  },

  // Bulk Actions
  async bulkApprove(data: { result_id: number; cadet_ids: number[]; authority_id: number }): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean }>('/ftw-11sqn-assessment-command-results/bulk-approve', data, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      return false;
    }
  },

  async bulkReject(data: { result_id: number; cadet_ids: number[]; authority_id: number; reason?: string }): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean }>('/ftw-11sqn-assessment-command-results/bulk-reject', data, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk reject:', error);
      return false;
    }
  },
};

export default Ftw11SqnAssessmentCommandResultService;


