/**
 * CTW Instructor Assign Module Service
 * API calls for instructor module assignments
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CtwInstructorAssignModule } from '@/libs/types/user';

interface AssignModuleQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  instructor_id?: number;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  ctw_results_module_id?: number;
  module_code?: string;
  is_active?: boolean;
  allData?: boolean;
}

interface AssignModulePaginatedResponse {
  data: CtwInstructorAssignModule[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface AssignModuleApiResponse {
  success: boolean;
  message: string;
  data: CtwInstructorAssignModule[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleAssignModuleApiResponse {
  success: boolean;
  message: string;
  data: CtwInstructorAssignModule;
}

interface BulkAssignResponse {
  success: boolean;
  message: string;
  data: {
    created: CtwInstructorAssignModule[];
    skipped_module_ids: number[];
    created_count: number;
    skipped_count: number;
  };
}

export const ctwInstructorAssignModuleService = {
  /**
   * Get all assignments with pagination and filters
   */
  async getAll(params?: AssignModuleQueryParams): Promise<AssignModulePaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) query.append(key, value.toString());
        });
      }

      const token = getToken();
      const result = await apiClient.get<AssignModuleApiResponse>(`/ctw-instructor-assign-modules?${query.toString()}`, token);

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
      console.error('Failed to fetch instructor module assignments:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get assignments by instructor
   */
  async getByInstructor(instructorId: number): Promise<CtwInstructorAssignModule[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: CtwInstructorAssignModule[] }>(
        `/ctw-instructor-assign-modules/by-instructor/${instructorId}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch assignments for instructor ${instructorId}:`, error);
      return [];
    }
  },

  /**
   * Create bulk module assignments
   */
  async bulkAssign(data: {
    instructor_id: number;
    course_id: number;
    semester_id: number;
    program_id: number;
    branch_id: number;
    group_id?: number;
    module_ids: number[];
  }): Promise<BulkAssignResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<BulkAssignResponse>('/ctw-instructor-assign-modules/bulk', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to bulk assign modules:', error);
      throw error;
    }
  },

  /**
   * Delete assignment
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-instructor-assign-modules/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete assignment ${id}:`, error);
      return false;
    }
  },

  /**
   * Toggle assignment active status
   */
  async toggleActive(id: number): Promise<CtwInstructorAssignModule | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAssignModuleApiResponse>(`/ctw-instructor-assign-modules/${id}/toggle-active`, {}, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to toggle assignment ${id} status:`, error);
      return null;
    }
  }
};

export default ctwInstructorAssignModuleService;
