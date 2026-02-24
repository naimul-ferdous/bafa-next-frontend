import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface AtwInstructorAssignCadet {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id: number;
  subject_id: number;
  cadet_id: number;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  instructor?: { id: number; name: string; service_number: string };
  course?: { id: number; name: string };
  semester?: { id: number; name: string };
  program?: { id: number; name: string };
  branch?: { id: number; name: string };
  group?: { id: number; name: string };
  subject?: { id: number; name: string };
  cadet?: { 
    id: number; 
    name: string; 
    cadet_number: string; 
    gender?: string;
    assigned_ranks?: {
      id: number;
      rank?: {
        id: number;
        name: string;
        short_name: string;
      };
    }[];
    assigned_branchs?: {
      id: number;
      is_current: boolean;
      branch?: {
        id: number;
        name: string;
        code: string;
      };
    }[];
  };
}

interface AtwInstructorAssignCadetQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  subject_id?: number;
  instructor_id?: number;
  cadet_id?: number;
  is_current?: boolean;
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

export const atwInstructorAssignCadetService = {
  async getAll(params?: AtwInstructorAssignCadetQueryParams): Promise<PaginatedResponse<AtwInstructorAssignCadet>> {
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

      const response = await apiClient.get<{ success: boolean; data: AtwInstructorAssignCadet[]; pagination: any }>(
        `/atw-instructor-assign-cadets${query.toString() ? `?${query.toString()}` : ''}`,
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
      console.error('Failed to fetch instructor assigned cadets:', error);
      throw error;
    }
  },

  async create(data: Partial<AtwInstructorAssignCadet> & { cadet_ids?: number[] }): Promise<AtwInstructorAssignCadet | AtwInstructorAssignCadet[]> {
    try {
      const token = getToken();
      const response = await apiClient.post<{ success: boolean; data: AtwInstructorAssignCadet | AtwInstructorAssignCadet[] }>(
        '/atw-instructor-assign-cadets',
        data,
        token
      );
      return response.data;
    } catch (error) {
      console.error('Failed to assign cadet(s):', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<AtwInstructorAssignCadet>): Promise<AtwInstructorAssignCadet> {
    try {
      const token = getToken();
      const response = await apiClient.put<{ success: boolean; data: AtwInstructorAssignCadet }>(
        `/atw-instructor-assign-cadets/${id}`,
        data,
        token
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update cadet assignment:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const token = getToken();
      await apiClient.delete(`/atw-instructor-assign-cadets/${id}`, token);
    } catch (error) {
      console.error('Failed to delete cadet assignment:', error);
      throw error;
    }
  },
};
