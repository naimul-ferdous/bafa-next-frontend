/**
 * Permission Service
 * API calls for permission and permission action management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { 
  Permission, 
  PermissionQueryParams, 
  PermissionPaginatedResponse,
  PermissionApiResponse,
  SinglePermissionApiResponse,
  PermissionAction,
  PermissionActionArrayApiResponse,
  Menu,
  MenuArrayApiResponse,
  SingleMenuApiResponse
} from '@/libs/types/menu';

export const permissionService = {
  /**
   * Get all permissions with pagination
   */
  async getPermissions(params?: PermissionQueryParams): Promise<PermissionPaginatedResponse> {
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

      if (params?.sort_by) {
        query.append('sort_by', params.sort_by);
      }

      if (params?.sort_order) {
        query.append('sort_order', params.sort_order);
      }

      const queryString = query.toString();
      const endpoint = `/permissions${queryString ? `?${queryString}` : ''}`;

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
  async getPermission(id: number | string): Promise<Permission | null> {
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
   * Get all distinct module values from permissions
   */
  async getModules(): Promise<string[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: string[] }>('/permissions/get-modules', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch permission modules:', error);
      return [];
    }
  },

  /**
   * Get all available permission actions
   */
  async getAvailableActions(): Promise<PermissionAction[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<PermissionActionArrayApiResponse>('/permissions/get-actions', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch permission actions:', error);
      return [];
    }
  },

  /**
   * Get all modules (Menus) with their organized permissions
   */
  async getAllModules(): Promise<Menu[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MenuArrayApiResponse>('/permissions/all-modules', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      return [];
    }
  },

  /**
   * Sync permissions for a menu
   */
  async syncMenuPermissions(data: { menu_id: number; action_codes: string[] }): Promise<Menu | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found');

      const result = await apiClient.post<SingleMenuApiResponse>('/permissions/sync-menu-permissions', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to sync menu permissions');
      }

      return result.data || null;
    } catch (error) {
      console.error('Failed to sync menu permissions:', error);
      throw error;
    }
  },

  /**
   * Get permissions grouped by module
   * Response: { "module_name": [ ...permissions ] }
   */
  async getGroupedByModule(params?: { wing_id?: number; subwing_id?: number }): Promise<Record<string, Permission[]>> {
    try {
      const query = new URLSearchParams();
      if (params?.wing_id) query.append('wing_id', params.wing_id.toString());
      if (params?.subwing_id) query.append('subwing_id', params.subwing_id.toString());

      const queryString = query.toString();
      const endpoint = `/permissions/grouped-by-module${queryString ? `?${queryString}` : ''}`;
      
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Record<string, Permission[]> }>(endpoint, token);
      return result?.data || {};
    } catch (error) {
      console.error('Failed to fetch permissions grouped by module:', error);
      return {};
    }
  },

  /**
   * Get permissions grouped by code with pagination and search
   */
  async getGroupedByCode(params?: { page?: number; per_page?: number; search?: string; wing_id?: number; subwing_id?: number }): Promise<{
    data: Record<string, Permission[]>;
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  }> {
    const empty = { data: {}, current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    try {
      const query = new URLSearchParams();
      if (params?.page)     query.append('page',     params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search)   query.append('search',   params.search);
      if (params?.wing_id)  query.append('wing_id',  params.wing_id.toString());
      if (params?.subwing_id) query.append('subwing_id', params.subwing_id.toString());

      const queryString = query.toString();
      const endpoint = `/permissions/grouped-by-code${queryString ? `?${queryString}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<{
        success: boolean;
        data: Record<string, Permission[]>;
        pagination: { current_page: number; per_page: number; total: number; last_page: number; from: number; to: number };
      }>(endpoint, token);

      if (!result) return empty;

      return {
        data:         result.data                    || {},
        current_page: result.pagination?.current_page || 1,
        per_page:     result.pagination?.per_page     || 10,
        total:        result.pagination?.total         || 0,
        last_page:    result.pagination?.last_page     || 1,
        from:         result.pagination?.from          || 0,
        to:           result.pagination?.to            || 0,
      };
    } catch (error) {
      console.error('Failed to fetch permissions grouped by code:', error);
      return empty;
    }
  },

  /**
   * Create new permission
   */
  async createPermission(data: any): Promise<Permission | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<SinglePermissionApiResponse>('/permissions', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create permission:', error);
      throw error;
    }
  },

  /**
   * Update permission
   */
  async updatePermission(id: number | string, data: any): Promise<Permission | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SinglePermissionApiResponse>(`/permissions/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update permission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete permission
   */
  async deletePermission(id: number | string): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<any>(`/permissions/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete permission ${id}:`, error);
      return false;
    }
  },
};

export default permissionService;
