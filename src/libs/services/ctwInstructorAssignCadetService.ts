import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface CtwInstructorAssignCadet {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id: number | null;
  ctw_results_module_id: number;
  cadet_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  instructor?: { id: number; name: string; service_number?: string };
  course?: { id: number; name: string };
  semester?: { id: number; name: string };
  program?: { id: number; name: string };
  branch?: { id: number; name: string };
  group?: { id: number; name: string } | null;
  module?: { id: number; full_name: string; short_name?: string; code: string };
  cadet?: {
    id: number;
    name: string;
    cadet_number?: string;
    is_active?: boolean;
    gender?: string;
    assigned_ranks?: {
      id: number;
      rank?: { id: number; name: string; short_name: string };
    }[];
    assigned_branchs?: {
      id: number;
      is_current?: boolean;
      branch?: { id: number; name: string; code: string };
    }[];
  };
}

interface CtwInstructorAssignCadetQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  ctw_results_module_id?: number;
  instructor_id?: number;
  cadet_id?: number;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export const ctwInstructorAssignCadetService = {
  async getAll(params?: CtwInstructorAssignCadetQueryParams): Promise<PaginatedResponse<CtwInstructorAssignCadet>> {
    try {
      const token = getToken();
      const query = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            query.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<{ success: boolean; data: CtwInstructorAssignCadet[]; pagination: any }>(
        `/ctw-instructor-assign-cadets${query.toString() ? `?${query.toString()}` : ''}`,
        token
      );

      return {
        data: response.data || [],
        pagination: response.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch CTW instructor assigned cadets:', error);
      throw error;
    }
  },

  async create(data: {
    instructor_id: number;
    course_id: number;
    semester_id: number;
    program_id?: number;
    branch_id?: number;
    group_id?: number;
    ctw_results_module_id: number;
    cadet_ids: number[];
    is_active?: boolean;
  }): Promise<CtwInstructorAssignCadet[]> {
    try {
      const token = getToken();
      const response = await apiClient.post<{ success: boolean; data: CtwInstructorAssignCadet[] }>(
        '/ctw-instructor-assign-cadets',
        data,
        token
      );
      return response.data;
    } catch (error) {
      console.error('Failed to assign CTW cadets:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const token = getToken();
      await apiClient.delete(`/ctw-instructor-assign-cadets/${id}`, token);
    } catch (error) {
      console.error('Failed to delete CTW cadet assignment:', error);
      throw error;
    }
  },
};
