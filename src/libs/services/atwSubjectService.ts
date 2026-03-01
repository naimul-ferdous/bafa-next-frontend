/**
 * ATW Subject Service
 * API calls for ATW subject mapping management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwSubject } from '@/libs/types/system';

interface SubjectQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
}

interface SubjectPaginatedResponse {
  data: AtwSubject[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwSubject[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwSubject;
}

interface SubjectActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwSubject;
}

interface SubjectCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number | null;
  group_id?: number | null;
  atw_subject_module_id: number;
  is_current?: boolean;
  is_active?: boolean;
}

export const atwSubjectService = {
  /**
   * Get all subject mappings with pagination
   */
  async getAllSubjects(params?: SubjectQueryParams): Promise<SubjectPaginatedResponse> {
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

      const endpoint = `/atw-subjects${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<SubjectApiResponse>(endpoint, token);

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
      console.error('Failed to fetch ATW subjects:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single subject mapping
   */
  async getSubject(id: number): Promise<AtwSubject | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSubjectApiResponse>(`/atw-subjects/${id}`, token);
      return (result && result.success) ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch ATW subject ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new subject mapping
   */
  async createSubject(data: SubjectCreateData): Promise<AtwSubject | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<SubjectActionApiResponse>('/atw-subjects', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create ATW subject');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create ATW subject:', error);
      throw error;
    }
  },

  /**
   * Update subject mapping
   */
  async updateSubject(id: number, data: Partial<SubjectCreateData>): Promise<AtwSubject | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SubjectActionApiResponse>(`/atw-subjects/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update ATW subject');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update ATW subject ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete subject mapping
   */
  async deleteSubject(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SubjectActionApiResponse>(`/atw-subjects/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete ATW subject ${id}:`, error);
      return false;
    }
  },
};

export default atwSubjectService;
