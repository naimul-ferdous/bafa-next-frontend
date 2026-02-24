/**
 * CTW Sword Drill Assessment Estimated Mark Service
 * API calls for CTW Sword Drill estimated marks management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  CtwSwordDrillAssessmentEstimatedMark,
  CtwSwordDrillAssessmentEstimatedMarkCreateData
} from '@/libs/types/ctwSwordDrill';

interface EstimatedMarkQueryParams {
  page?: number;
  per_page?: number;
  semester_id?: number;
  exam_type_id?: number;
}

interface EstimatedMarkPaginatedResponse {
  data: CtwSwordDrillAssessmentEstimatedMark[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface EstimatedMarkApiResponse {
  success: boolean;
  message: string;
  data: CtwSwordDrillAssessmentEstimatedMark[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleEstimatedMarkApiResponse {
  success: boolean;
  message: string;
  data: CtwSwordDrillAssessmentEstimatedMark;
}

interface EstimatedMarkActionApiResponse {
  success: boolean;
  message: string;
  data?: CtwSwordDrillAssessmentEstimatedMark;
}

export const ctwSwordDrillAssessmentEstimatedMarkService = {
  /**
   * Get all estimated marks with pagination
   */
  async getAllEstimatedMarks(params?: EstimatedMarkQueryParams): Promise<EstimatedMarkPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ctw-sword-drill-assessment-estimated-marks${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<EstimatedMarkApiResponse>(endpoint, token);

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
      console.error('Failed to fetch estimated marks:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single estimated mark
   */
  async getEstimatedMark(id: number): Promise<CtwSwordDrillAssessmentEstimatedMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleEstimatedMarkApiResponse>(`/ctw-sword-drill-assessment-estimated-marks/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch estimated mark ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new estimated mark
   */
  async createEstimatedMark(data: CtwSwordDrillAssessmentEstimatedMarkCreateData): Promise<CtwSwordDrillAssessmentEstimatedMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<EstimatedMarkActionApiResponse>('/ctw-sword-drill-assessment-estimated-marks', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create estimated mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create estimated mark:', error);
      throw error;
    }
  },

  /**
   * Update estimated mark
   */
  async updateEstimatedMark(id: number, data: Partial<CtwSwordDrillAssessmentEstimatedMarkCreateData>): Promise<CtwSwordDrillAssessmentEstimatedMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<EstimatedMarkActionApiResponse>(`/ctw-sword-drill-assessment-estimated-marks/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update estimated mark');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update estimated mark ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete estimated mark
   */
  async deleteEstimatedMark(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<EstimatedMarkActionApiResponse>(`/ctw-sword-drill-assessment-estimated-marks/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete estimated mark ${id}:`, error);
      return false;
    }
  },
};

export default ctwSwordDrillAssessmentEstimatedMarkService;
