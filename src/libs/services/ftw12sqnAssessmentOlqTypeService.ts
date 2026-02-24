/**
 * FTW 12sqn Assessment OLQ Type Service
 * API calls for FTW 12sqn Assessment OLQ type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw12sqnAssessmentOlqType,
  Ftw12sqnAssessmentOlqTypeCreateData
} from '@/libs/types/ftw12sqnAssessmentOlq';

interface TypeQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  semester_id?: number;
  course_id?: number;
}

interface TypePaginatedResponse {
  data: Ftw12sqnAssessmentOlqType[];
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
  data: Ftw12sqnAssessmentOlqType[];
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
  data: Ftw12sqnAssessmentOlqType;
}

export const ftw12sqnAssessmentOlqTypeService = {
  async getAllTypes(params?: TypeQueryParams): Promise<TypePaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/ftw-12sqn-assessment-olq-types${query.toString() ? `?${query.toString()}` : ''}`;
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

  async getType(id: number): Promise<Ftw12sqnAssessmentOlqType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleTypeApiResponse>(`/ftw-12sqn-assessment-olq-types/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch OLQ type ${id}:`, error);
      return null;
    }
  },

  async createType(data: Ftw12sqnAssessmentOlqTypeCreateData): Promise<Ftw12sqnAssessmentOlqType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<SingleTypeApiResponse>('/ftw-12sqn-assessment-olq-types', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create OLQ type');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create OLQ type:', error);
      throw error;
    }
  },

  async updateType(id: number, data: Partial<Ftw12sqnAssessmentOlqTypeCreateData>): Promise<Ftw12sqnAssessmentOlqType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<SingleTypeApiResponse>(`/ftw-12sqn-assessment-olq-types/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update OLQ type');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update OLQ type ${id}:`, error);
      throw error;
    }
  },

  async deleteType(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ftw-12sqn-assessment-olq-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete OLQ type ${id}:`, error);
      return false;
    }
  },

  async reorderEstimatedMarks(typeId: number, orders: number[]): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<{ success: boolean }>(`/ftw-12sqn-assessment-olq-types/${typeId}/estimated-marks/reorder`, { orders }, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to reorder estimated marks:', error);
      return false;
    }
  },
};

export default ftw12sqnAssessmentOlqTypeService;
