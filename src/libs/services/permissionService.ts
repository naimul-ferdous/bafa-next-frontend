/**
 * Permission Service
 * API calls for permission management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Permission } from '@/libs/types/menu';

export interface PermissionQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface PermissionCreateData {
  name: string;
  slug: string;
  description?: string;
  module: string;
  is_active: boolean;
}

export interface PermissionPaginatedResponse {
  data: Permission[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface PermissionApiResponse {
  success: boolean;
  message: string;
  data: Permission[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SinglePermissionApiResponse {
  success: boolean;
  message: string;
  data: Permission;
}

interface PermissionActionApiResponse {
  success: boolean;
  message: string;
  data?: Permission | null;
}

export const permissionService = {
  /**
   * Get all permissions with pagination
   */
  async getAllPermissions(params?: PermissionQueryParams): Promise<PermissionPaginatedResponse> {
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

      const endpoint = `/permissions${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<PermissionApiResponse>(endpoint, token);

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
      console.error('Failed to fetch permissions:', error);
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
   * Get single permission
   */
  async getPermission(id: number): Promise<Permission | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SinglePermissionApiResponse>(`/permissions/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch permission ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new permission
   */
  async createPermission(data: PermissionCreateData): Promise<Permission | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<PermissionActionApiResponse>('/permissions', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create permission');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create permission:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update permission
   */
  async updatePermission(id: number, data: Partial<PermissionCreateData>): Promise<Permission | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<PermissionActionApiResponse>(`/permissions/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update permission');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update permission ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete permission
   */
  async deletePermission(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<PermissionActionApiResponse>(`/permissions/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete permission ${id}:`, error);
      return false;
    }
  },
};

export default permissionService;
