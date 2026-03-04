/**
 * ATW Subject Group Service
 * API calls for ATW subject group mappings management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwSubject, SystemSemester, SystemProgram, AtwSubjectModule } from '@/libs/types/system';

export interface AtwSubjectGroup {
  id: number;
  atw_subject_id: number;
  semester_id: number;
  program_id: number;
  atw_subject_module_id: number;
  is_current: boolean;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  subject?: AtwSubject;
  semester?: SystemSemester;
  program?: SystemProgram;
  module?: AtwSubjectModule;
}

interface SubjectGroupQueryParams {
  page?: number;
  per_page?: number;
  atw_subject_id?: number;
  semester_id?: number;
  program_id?: number;
}

interface SubjectGroupPaginatedResponse {
  data: AtwSubjectGroup[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SubjectGroupApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectGroup[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSubjectGroupApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectGroup;
}

interface SubjectGroupActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwSubjectGroup;
}

export interface SubjectGroupCreateData {
  atw_subject_id: number;
  semester_id: number;
  program_id: number;
  atw_subject_module_id: number;
  is_current?: boolean;
  is_active?: boolean;
}

export const atwSubjectGroupService = {
  /**
   * Get all subject groups with pagination
   */
  async getAllSubjectGroups(params?: SubjectGroupQueryParams): Promise<SubjectGroupPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.atw_subject_id) query.append('atw_subject_id', params.atw_subject_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());

      const endpoint = `/atw-subject-groups${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<SubjectGroupApiResponse>(endpoint, token);

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
      console.error('Failed to fetch ATW subject groups:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single subject group
   */
  async getSubjectGroup(id: number): Promise<AtwSubjectGroup | null> {
    if (!id || isNaN(id)) return null;
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSubjectGroupApiResponse>(`/atw-subject-groups/${id}`, token);
      return (result && result.success) ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch ATW subject group ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new subject group
   */
  async createSubjectGroup(data: SubjectGroupCreateData): Promise<AtwSubjectGroup | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<SubjectGroupActionApiResponse>('/atw-subject-groups', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create ATW subject group');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create ATW subject group:', error);
      throw error;
    }
  },

  /**
   * Update subject group
   */
  async updateSubjectGroup(id: number, data: Partial<SubjectGroupCreateData>): Promise<AtwSubjectGroup | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SubjectGroupActionApiResponse>(`/atw-subject-groups/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update ATW subject group');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update ATW subject group ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete subject group
   */
  async deleteSubjectGroup(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SubjectGroupActionApiResponse>(`/atw-subject-groups/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete ATW subject group ${id}:`, error);
      return false;
    }
  },
};

export default atwSubjectGroupService;
