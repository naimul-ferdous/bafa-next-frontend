/**
 * Role Service
 * API calls for role management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Role } from '@/libs/types/user';

export interface RoleQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  wing_id?: number;
  subwing_id?: number;
}

export interface RoleCreateData {
  name: string;
  slug?: string;
  description?: string;
  wing_id?: number | null;
  subwing_id?: number | null;
  is_active: boolean;
  is_role_switch?: boolean;
  is_manage?: boolean;
  is_marge_role?: boolean;
}

export interface RolePaginatedResponse {
  data: Role[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface RoleApiResponse {
  success: boolean;
  message: string;
  data: Role[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SingleRoleApiResponse {
  success: boolean;
  message: string;
  data: Role;
}

interface RoleActionApiResponse {
  success: boolean;
  message: string;
  data?: Role | null;
}

export const roleService = {
  /**
   * Get all roles with pagination
   */
  async getAllRoles(params?: RoleQueryParams): Promise<RolePaginatedResponse> {
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

      if (params?.wing_id) {
        query.append('wing_id', params.wing_id.toString());
      }

      if (params?.subwing_id) {
        query.append('subwing_id', params.subwing_id.toString());
      }

      const endpoint = `/roles${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<RoleApiResponse>(endpoint, token);

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
      console.error('Failed to fetch roles:', error);
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
   * Get single role
   */
  async getRole(id: number): Promise<Role | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleRoleApiResponse>(`/roles/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch role ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new role
   */
  async createRole(data: RoleCreateData): Promise<Role | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<RoleActionApiResponse>('/roles', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create role');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create role:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update role
   */
  async updateRole(id: number, data: Partial<RoleCreateData>): Promise<Role | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<RoleActionApiResponse>(`/roles/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update role');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update role ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<RoleActionApiResponse>(`/roles/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete role ${id}:`, error);
      return false;
    }
  },

  /**
   * Assign permissions to role
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.post<RoleActionApiResponse>(
        `/roles/${roleId}/permissions`,
        { permission_ids: permissionIds },
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to assign permissions to role ${roleId}:`, error);
      return false;
    }
  },
};

export default roleService;
