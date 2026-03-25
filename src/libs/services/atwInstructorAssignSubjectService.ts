/**
 * ATW Instructor Assign Subject Service
 * API calls for instructor subject assignments
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwInstructorAssignSubject } from '@/libs/types/user';

interface AssignSubjectQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  instructor_id?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  system_programs_changeable_semester_id?: number | null;
  changeable_semester_null?: boolean;
  subject_id?: number;
  is_active?: boolean | number;
}

interface AssignSubjectPaginatedResponse {
  data: AtwInstructorAssignSubject[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface AssignSubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwInstructorAssignSubject[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleAssignSubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwInstructorAssignSubject;
}

interface BulkAssignResponse {
  success: boolean;
  message: string;
  data: {
    created: AtwInstructorAssignSubject[];
    skipped_subject_ids: number[];
    created_count: number;
    skipped_count: number;
  };
}

export const atwInstructorAssignSubjectService = {
  /**
   * Get all assignments with pagination and filters
   */
  async getAll(params?: AssignSubjectQueryParams): Promise<AssignSubjectPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) query.append(key, value.toString());
        });
      }

      const token = getToken();
      const result = await apiClient.get<AssignSubjectApiResponse>(`/atw-instructor-assign-subjects?${query.toString()}`, token);

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
      console.error('Failed to fetch instructor subject assignments:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get assignments by instructor
   */
  async getByInstructor(instructorId: number): Promise<AtwInstructorAssignSubject[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: AtwInstructorAssignSubject[] }>(
        `/atw-instructor-assign-subjects/by-instructor/${instructorId}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch assignments for instructor ${instructorId}:`, error);
      return [];
    }
  },

  /**
   * Create bulk subject assignments
   */
  async bulkAssign(data: {
    instructor_id: number;
    course_id: number;
    semester_id: number;
    program_id: number;
    system_programs_changeable_semester_id?: number | null;
    subject_ids: number[];
  }): Promise<BulkAssignResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<BulkAssignResponse>('/atw-instructor-assign-subjects/bulk', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to bulk assign subjects:', error);
      throw error;
    }
  },

  /**
   * Delete assignment
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-instructor-assign-subjects/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete assignment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle assignment active status
   */
  async toggleActive(id: number): Promise<AtwInstructorAssignSubject | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAssignSubjectApiResponse>(`/atw-instructor-assign-subjects/${id}/toggle-active`, {}, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to toggle assignment ${id} status:`, error);
      return null;
    }
  },

  /**
   * Get grouped assignments for report
   */
  async getGrouped(params?: AssignSubjectQueryParams): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) query.append(key, value.toString());
        });
      }

      const token = getToken();
      const result = await apiClient.get<any>(`/atw-instructor-assign-subjects/grouped?${query.toString()}`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped instructor subject assignments:', error);
      return [];
    }
  }
};

export default atwInstructorAssignSubjectService;
