/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11SQN Flying Examination Cadet Approval Status Service
 * Handles individual cadet approval status
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CadetApprovalStatus } from '@/libs/types/approval';

interface QueryParams {
  page?: number;
  per_page?: number;
  cadet_id?: number;
  course_id?: number;
  semester_id?: number;
  progress_id?: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  allData?: boolean;
}

interface PaginatedResponse {
  data: CadetApprovalStatus[];
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
  data: CadetApprovalStatus[];
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
  data: CadetApprovalStatus;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: CadetApprovalStatus | CadetApprovalStatus[];
}

interface ApprovalSummary {
  total_cadets: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  approval_percentage: number;
}

interface SummaryApiResponse {
  success: boolean;
  message: string;
  data: ApprovalSummary;
}

export const ftw11sqnFlyingExamCadetApprovalStatusService = {
  /**
   * Get all cadet approval statuses with pagination and filters
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.cadet_id) query.append('cadet_id', params.cadet_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.progress_id) query.append('progress_id', params.progress_id.toString());
      if (params?.approval_status) query.append('approval_status', params.approval_status);
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-cadet-approval-status${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch cadet approval statuses:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get a single cadet approval status by ID
   */
  async getById(id: number): Promise<CadetApprovalStatus | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-exam-cadet-approval-status/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch cadet approval status ${id}:`, error);
      return null;
    }
  },

  /**
   * Get cadet approval statuses by course and semester
   */
  async getByCourseAndSemester(
    courseId: number,
    semesterId: number,
    params?: QueryParams
  ): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', courseId.toString());
      query.append('semester_id', semesterId.toString());
      if (params?.progress_id) query.append('progress_id', params.progress_id.toString());
      if (params?.approval_status) query.append('approval_status', params.approval_status);
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-cadet-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch cadet approval statuses by course and semester:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get cadet approval statuses by cadet ID
   */
  async getByCadet(cadetId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('cadet_id', cadetId.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-cadet-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch cadet approval statuses by cadet:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get cadet approval statuses by progress ID
   */
  async getByProgressId(progressId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('progress_id', progressId.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-cadet-approval-status?${query.toString()}`;
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
      console.error('Failed to fetch cadet approval statuses by progress:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get approval summary for a semester
   */
  async getApprovalSummary(
    courseId: number,
    semesterId: number,
    progressId: number
  ): Promise<ApprovalSummary | null> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', courseId.toString());
      query.append('semester_id', semesterId.toString());
      query.append('progress_id', progressId.toString());

      const endpoint = `/ftw-11sqn-flying-exam-cadet-approval-status/summary?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<SummaryApiResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch approval summary:', error);
      return null;
    }
  },

  /**
   * Create a new cadet approval status
   */
  async create(data: {
    cadet_id: number;
    course_id: number;
    semester_id: number;
    progress_id: number;
    send_progress_id?: number;
    next_progress_id?: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    remark?: string;
    approved_by?: number;
  }): Promise<CadetApprovalStatus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-exam-cadet-approval-status', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create cadet approval status');
      return (result.data as CadetApprovalStatus) || null;
    } catch (error) {
      console.error('Failed to create cadet approval status:', error);
      throw error;
    }
  },

  /**
   * Update an existing cadet approval status
   */
  async update(
    id: number,
    data: {
      cadet_id?: number;
      course_id?: number;
      semester_id?: number;
      progress_id?: number;
      send_progress_id?: number;
      next_progress_id?: number;
      approval_status?: 'pending' | 'approved' | 'rejected';
      remark?: string;
      approved_by?: number;
    }
  ): Promise<CadetApprovalStatus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-exam-cadet-approval-status/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update cadet approval status');
      return (result.data as CadetApprovalStatus) || null;
    } catch (error) {
      console.error(`Failed to update cadet approval status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a cadet approval status
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-exam-cadet-approval-status/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete cadet approval status ${id}:`, error);
      return false;
    }
  },

  /**
   * Bulk approve cadets
   */
  async bulkApprove(data: {
    cadet_ids: number[];
    course_id: number;
    semester_id: number;
    progress_id: number;
    send_progress_id?: number;
    next_progress_id?: number;
    remark?: string;
    approved_by?: number;
  }): Promise<CadetApprovalStatus[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-exam-cadet-approval-status/bulk-approve', data, token);

      if (result && result.message) {
        console.log('Bulk approval successful:', result.message);
        return (result.data as CadetApprovalStatus[]) || null;
      }

      if (!result) {
        throw new Error('Failed to bulk approve cadets - no response');
      }

      return (result.data as CadetApprovalStatus[]) || null;
    } catch (error) {
      console.error('Failed to bulk approve cadets:', error);
      throw error;
    }
  },

  /**
   * Bulk reject cadets
   */
  async bulkReject(data: {
    cadet_ids: number[];
    course_id: number;
    semester_id: number;
    progress_id: number;
    send_progress_id?: number;
    remark: string;
  }): Promise<CadetApprovalStatus[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-exam-cadet-approval-status/bulk-reject', data, token);

      if (result && result.message) {
        console.log('Bulk rejection successful:', result.message);
        return (result.data as CadetApprovalStatus[]) || null;
      }

      if (!result) {
        throw new Error('Failed to bulk reject cadets - no response');
      }

      return (result.data as CadetApprovalStatus[]) || null;
    } catch (error) {
      console.error('Failed to bulk reject cadets:', error);
      throw error;
    }
  },
};

export default ftw11sqnFlyingExamCadetApprovalStatusService;
