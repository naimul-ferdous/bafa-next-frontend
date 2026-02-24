/**
 * Group Service
 * API calls for group management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemGroup } from '@/libs/types/system';

interface GroupQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface GroupPaginatedResponse {
  data: SystemGroup[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface GroupApiResponse {
  success: boolean;
  message: string;
  data: SystemGroup[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleGroupApiResponse {
  success: boolean;
  message: string;
  data: SystemGroup;
}

interface GroupActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemGroup;
}

interface GroupCreateData {
  name: string;
  code: string;
  description?: string;
  capacity?: number;
  current_strength?: number;
  formation_date?: string;
  is_active?: boolean;
}

export const groupService = {
  /**
   * Get all groups with pagination
   */
  async getAllGroups(params?: GroupQueryParams): Promise<GroupPaginatedResponse> {
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

      const endpoint = `/system-groups${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<GroupApiResponse>(endpoint, token);

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
      console.error('Failed to fetch groups:', error);
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
   * Get single group
   */
  async getGroup(id: number): Promise<SystemGroup | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleGroupApiResponse>(`/system-groups/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch group ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new group
   */
  async createGroup(data: GroupCreateData): Promise<SystemGroup | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<GroupActionApiResponse>('/system-groups', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create group');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create group:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update group
   */
  async updateGroup(id: number, data: Partial<GroupCreateData>): Promise<SystemGroup | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<GroupActionApiResponse>(`/system-groups/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update group');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update group ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete group
   */
  async deleteGroup(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<GroupActionApiResponse>(`/system-groups/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete group ${id}:`, error);
      return false;
    }
  },
};

export default groupService;
