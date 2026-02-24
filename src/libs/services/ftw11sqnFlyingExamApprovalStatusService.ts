/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11SQN Flying Examination Approval Status Service
 * Handles overall approval status per course/semester
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { ApprovalStatus } from '@/libs/types/approval';

interface QueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  progress_id?: number;
  status?: 'active' | 'inactive' | 'draft';
  approval_status?: 'pending' | 'approved' | 'rejected';
  allData?: boolean;
}

interface PaginatedResponse {
  data: ApprovalStatus[];
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
  data: ApprovalStatus[];
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
  data: ApprovalStatus;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: ApprovalStatus;
}

export const ftw11sqnFlyingExamApprovalStatusService = {
  /**
   * Get all approval statuses with pagination and filters
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.progress_id) query.append('progress_id', params.progress_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.approval_status) query.append('approval_status', params.approval_status);
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-status${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch approval statuses:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get a single approval status by ID
   */
  async getById(id: number): Promise<ApprovalStatus | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-exam-approval-status/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch approval status ${id}:`, error);
      return null;
    }
  },

  /**
   * Get latest approval status by course and semester
   */
  async getLatestByCourseAndSemester(courseId: number, semesterId: number): Promise<ApprovalStatus | null> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', courseId.toString());
      query.append('semester_id', semesterId.toString());

      const endpoint = `/ftw-11sqn-flying-exam-approval-status/latest?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch latest approval status:', error);
      return null;
    }
  },

  /**
   * Get approval statuses by course
   */
  async getByCourse(courseId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', courseId.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch approval statuses by course:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get approval statuses by semester
   */
  async getBySemester(semesterId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('semester_id', semesterId.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch approval statuses by semester:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get approval statuses by progress ID
   */
  async getByProgressId(progressId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('progress_id', progressId.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch approval statuses by progress:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Create a new approval status
   */
  async create(data: {
    course_id: number;
    semester_id: number;
    exam_type?: string;
    progress_id?: number;
    send_progress_id?: number;
    next_progress_id?: number;
    status: 'active' | 'inactive' | 'draft';
    approval_status?: 'pending' | 'approved' | 'rejected';
    remark?: string;
    created_by?: number;
  }): Promise<ApprovalStatus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-exam-approval-status', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create approval status');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create approval status:', error);
      throw error;
    }
  },

  /**
   * Update an existing approval status
   */
  async update(
    id: number,
    data: {
      course_id?: number;
      semester_id?: number;
      exam_type?: string;
      progress_id?: number;
      send_progress_id?: number;
      next_progress_id?: number;
      status?: 'active' | 'inactive' | 'draft';
      approval_status?: 'pending' | 'approved' | 'rejected';
      remark?: string;
    }
  ): Promise<ApprovalStatus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-exam-approval-status/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update approval status');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update approval status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an approval status
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-exam-approval-status/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete approval status ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnFlyingExamApprovalStatusService;
