/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11SQN Flying Exam Result Approval Process Service
 * Handles the approval hierarchy/levels for flying examination results
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { ApprovalProcess } from '@/libs/types/approval';

interface QueryParams {
  page?: number;
  per_page?: number;
  role_id?: number;
  status?: 'active' | 'inactive' | 'draft';
  allData?: boolean;
}

interface PaginatedResponse {
  data: ApprovalProcess[];
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
  data: ApprovalProcess[];
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
  data: ApprovalProcess;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: ApprovalProcess;
}

export const ftw11sqnFlyingExamApprovalProcessService = {
  /**
   * Get all approval processes with pagination and filters
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.role_id) query.append('role_id', params.role_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-process${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch approval processes:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get active approval processes only
   */
  async getActive(): Promise<ApprovalProcess[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApiResponse>('/ftw-11sqn-flying-exam-approval-process/active', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch active approval processes:', error);
      return [];
    }
  },

  /**
   * Get a single approval process by ID
   */
  async getById(id: number): Promise<ApprovalProcess | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-exam-approval-process/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch approval process ${id}:`, error);
      return null;
    }
  },

  /**
   * Get approval process by role ID
   */
  async getByRoleId(roleId: number, params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      query.append('role_id', roleId.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-11sqn-flying-exam-approval-process?${query.toString()}`;
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
      console.error('Failed to fetch approval process by role:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Create a new approval process
   */
  async create(data: {
    status_code: string;
    role_id: number;
    description?: string;
    status: 'active' | 'inactive' | 'draft';
  }): Promise<ApprovalProcess | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-exam-approval-process', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create approval process');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create approval process:', error);
      throw error;
    }
  },

  /**
   * Update an existing approval process
   */
  async update(
    id: number,
    data: {
      status_code?: string;
      role_id?: number;
      description?: string;
      status?: 'active' | 'inactive' | 'draft';
    }
  ): Promise<ApprovalProcess | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-exam-approval-process/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update approval process');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update approval process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an approval process
   */
  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-exam-approval-process/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete approval process ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnFlyingExamApprovalProcessService;
