/**
 * ATW Assessment OLQ Type Service
 * API calls for ATW Assessment OLQ type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  AtwAssessmentOlqType,
  AtwAssessmentOlqTypeEstimatedMark,
  AtwAssessmentOlqTypeAssignment,
  AtwAssessmentOlqTypeCreateData
} from '@/libs/types/atwAssessmentOlq';

interface TypeQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
}

interface TypePaginatedResponse {
  data: AtwAssessmentOlqType[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface TypeApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqType[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleTypeApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqType;
}

interface TypeActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentOlqType;
}

interface EstimatedMarkApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqTypeEstimatedMark[];
}

interface SingleEstimatedMarkApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqTypeEstimatedMark;
}

interface AssignmentPaginatedResponse {
  data: AtwAssessmentOlqTypeAssignment[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface AssignmentApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentOlqTypeAssignment[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export const atwAssessmentOlqTypeService = {
  /**
   * Get all OLQ types with pagination
   */
  async getAllTypes(params?: TypeQueryParams): Promise<TypePaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/atw-assessment-olq-types${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<TypeApiResponse>(endpoint, token);

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
      console.error('Failed to fetch OLQ types:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single OLQ type
   */
  async getType(id: number): Promise<AtwAssessmentOlqType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleTypeApiResponse>(`/atw-assessment-olq-types/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch OLQ type ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new OLQ type
   */
  async createType(data: AtwAssessmentOlqTypeCreateData): Promise<AtwAssessmentOlqType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<TypeActionApiResponse>('/atw-assessment-olq-types', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create OLQ type');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create OLQ type:', error);
      throw error;
    }
  },

  /**
   * Update OLQ type
   */
  async updateType(id: number, data: Partial<AtwAssessmentOlqTypeCreateData>): Promise<AtwAssessmentOlqType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<TypeActionApiResponse>(`/atw-assessment-olq-types/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update OLQ type');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update OLQ type ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete OLQ type
   */
  async deleteType(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<TypeActionApiResponse>(`/atw-assessment-olq-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete OLQ type ${id}:`, error);
      return false;
    }
  },

  // ==================== Estimated Marks Management ====================

  /**
   * Get estimated marks for OLQ type
   */
  async getEstimatedMarks(typeId: number): Promise<AtwAssessmentOlqTypeEstimatedMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<EstimatedMarkApiResponse>(`/atw-assessment-olq-types/${typeId}/estimated-marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch estimated marks:', error);
      return [];
    }
  },

  /**
   * Add estimated mark to OLQ type
   */
  async addEstimatedMark(typeId: number, data: {
    event_name: string;
    event_code: string;
    estimated_mark: number;
    remarks?: string;
  }): Promise<AtwAssessmentOlqTypeEstimatedMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleEstimatedMarkApiResponse>(`/atw-assessment-olq-types/${typeId}/estimated-marks`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add estimated mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add estimated mark:', error);
      throw error;
    }
  },

  /**
   * Update estimated mark
   */
  async updateEstimatedMark(typeId: number, markId: number, data: {
    event_name: string;
    event_code: string;
    estimated_mark: number;
    remarks?: string;
    is_active?: boolean;
  }): Promise<AtwAssessmentOlqTypeEstimatedMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleEstimatedMarkApiResponse>(`/atw-assessment-olq-types/${typeId}/estimated-marks/${markId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update estimated mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update estimated mark:', error);
      throw error;
    }
  },

  /**
   * Delete estimated mark
   */
  async deleteEstimatedMark(typeId: number, markId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-assessment-olq-types/${typeId}/estimated-marks/${markId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete estimated mark:', error);
      return false;
    }
  },

  /**
   * Reorder estimated marks
   */
  async reorderEstimatedMarks(typeId: number, orders: number[]): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<{ success: boolean }>(`/atw-assessment-olq-types/${typeId}/estimated-marks/reorder`, { orders }, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to reorder estimated marks:', error);
      return false;
    }
  },

  // ==================== Assignment Management ====================

  /**
   * Get all OLQ type assignments
   */
  async getAllAssignments(params?: {
    page?: number;
    per_page?: number;
    course_id?: number;
    atw_assessment_olq_type_id?: number;
  }): Promise<AssignmentPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.atw_assessment_olq_type_id) query.append('atw_assessment_olq_type_id', params.atw_assessment_olq_type_id.toString());

      const endpoint = `/atw-assessment-olq-assigned${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<AssignmentApiResponse>(endpoint, token);

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
      console.error('Failed to fetch assignments:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Assign OLQ type to course
   */
  async assignType(data: {
    atw_assessment_olq_type_id: number;
    course_id: number;
    is_active?: boolean;
  }): Promise<AtwAssessmentOlqTypeAssignment | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean; data: AtwAssessmentOlqTypeAssignment }>('/atw-assessment-olq-assigned', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to assign OLQ type:', error);
      throw error;
    }
  },

  /**
   * Delete assignment
   */
  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-assessment-olq-assigned/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete assignment ${id}:`, error);
      return false;
    }
  },
};

export default atwAssessmentOlqTypeService;
