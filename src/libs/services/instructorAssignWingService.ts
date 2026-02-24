/**
 * Instructor Assign Wing Service
 * API calls for instructor wing assignment management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { InstructorAssignWing } from '@/libs/types/user';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  wing_id?: number;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: InstructorAssignWing[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: InstructorAssignWing[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleApiResponse {
  success: boolean;
  message: string;
  data: InstructorAssignWing;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: InstructorAssignWing;
}

interface CreateData {
  wing_id: number;
  subwing_id?: number | null;
  instructor_id: number;
  is_active?: boolean;
  status?: 'pending' | 'processing' | 'approved';
}

interface UpdateData {
  wing_id?: number;
  subwing_id?: number | null;
  instructor_id?: number;
  is_active?: boolean;
  status?: 'pending' | 'processing' | 'approved';
}

export const instructorAssignWingService = {
  /**
   * Get all instructor wing assignments with pagination
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.status) query.append('status', params.status);
      if (params?.wing_id) query.append('wing_id', params.wing_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/instructor-assign-wings${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);

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
      console.error('Failed to fetch instructor wing assignments:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single assignment
   */
  async getById(id: number): Promise<InstructorAssignWing | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/instructor-assign-wings/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch assignment ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new assignment
   */
  async create(data: CreateData): Promise<InstructorAssignWing | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ActionApiResponse>('/instructor-assign-wings', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create assignment');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create assignment:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update assignment
   */
  async update(id: number, data: UpdateData): Promise<InstructorAssignWing | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ActionApiResponse>(`/instructor-assign-wings/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update assignment');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update assignment ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete assignment
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/instructor-assign-wings/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete assignment ${id}:`, error);
      return false;
    }
  },

  /**
   * Update status
   */
  async updateStatus(id: number, status: 'pending' | 'processing' | 'approved'): Promise<InstructorAssignWing | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ActionApiResponse>(`/instructor-assign-wings/${id}/status`, { status }, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update status');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update status for assignment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<InstructorAssignWing | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ActionApiResponse>(`/instructor-assign-wings/${id}/toggle-active`, {}, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to toggle active status');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to toggle active for assignment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get assignments by wing
   */
  async getByWing(wingId: number): Promise<InstructorAssignWing[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: InstructorAssignWing[] }>(`/instructor-assign-wings/by-wing/${wingId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch assignments for wing ${wingId}:`, error);
      return [];
    }
  },

  /**
   * Get assignments by subwing
   */
  async getBySubWing(subwingId: number): Promise<InstructorAssignWing[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: InstructorAssignWing[] }>(`/instructor-assign-wings/by-subwing/${subwingId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch assignments for subwing ${subwingId}:`, error);
      return [];
    }
  },

  /**
   * Get assignments by instructor
   */
  async getByInstructor(instructorId: number): Promise<InstructorAssignWing[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: InstructorAssignWing[] }>(`/instructor-assign-wings/by-instructor/${instructorId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch assignments for instructor ${instructorId}:`, error);
      return [];
    }
  },

  /**
   * Bulk approve assignments
   */
  async bulkApprove(ids: number[]): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ActionApiResponse>('/instructor-assign-wings/bulk-approve', { ids }, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk approve assignments:', error);
      return false;
    }
  },
};

export default instructorAssignWingService;
