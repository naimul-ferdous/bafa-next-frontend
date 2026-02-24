/**
 * Branch Service
 * API calls for branch management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemBranch } from '@/libs/types/system';

interface BranchQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface BranchPaginatedResponse {
  data: SystemBranch[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface BranchApiResponse {
  success: boolean;
  message: string;
  data: SystemBranch[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleBranchApiResponse {
  success: boolean;
  message: string;
  data: SystemBranch;
}

interface BranchActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemBranch;
}

interface BranchCreateData {
  name: string;
  code: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export const branchService = {
  /**
   * Get all branches with pagination
   */
  async getAllBranches(params?: BranchQueryParams): Promise<BranchPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.search) {
        query.append('search', params.search);
      }

      const endpoint = `/system-branches${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<BranchApiResponse>(endpoint, token);

      if (!result) {
        return {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        };
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
      console.error('Failed to fetch branches:', error);
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      };
    }
  },

  /**
   * Get single branch
   */
  async getBranch(id: number): Promise<SystemBranch | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleBranchApiResponse>(`/system-branches/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch branch ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new branch
   */
  async createBranch(data: BranchCreateData): Promise<SystemBranch | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<BranchActionApiResponse>('/system-branches', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create branch');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create branch:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update branch
   */
  async updateBranch(id: number, data: Partial<BranchCreateData>): Promise<SystemBranch | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<BranchActionApiResponse>(`/system-branches/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update branch');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update branch ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete branch
   */
  async deleteBranch(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<BranchActionApiResponse>(`/system-branches/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete branch ${id}:`, error);
      return false;
    }
  },
};

export default branchService;
