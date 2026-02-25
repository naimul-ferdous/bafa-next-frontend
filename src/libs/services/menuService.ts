/**
 * Menu Service
 * API calls for menu management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Menu,
  MenuQueryParams,
  MenuCreateData,
  MenuPaginatedResponse,
  MenuApiResponse,
  SingleMenuApiResponse,
  MenuArrayApiResponse,
  MenuActionApiResponse,
} from '@/libs/types/menu';

export const menuService = {
  /**
   * Get all menus with pagination
   */
  async getAllMenus(params?: MenuQueryParams): Promise<MenuPaginatedResponse> {
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

      const endpoint = `/menus${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<MenuApiResponse>(endpoint, token);

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
      console.error('Failed to fetch menus:', error);
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
   * Get user-accessible menus
   */
  async getUserMenus(): Promise<Menu[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MenuArrayApiResponse>('/menus/user-menus', token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch user menus:', error);
      return [];
    }
  },

  /**
   * Get all menus as a flat raw list with pagination and search
   */
  async getRawMenus(params?: { page?: number; per_page?: number; search?: string }): Promise<MenuPaginatedResponse> {
    const empty = { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    try {
      const query = new URLSearchParams();
      if (params?.page)     query.append('page',     params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search)   query.append('search',   params.search);
      const endpoint = `/menus/raw${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<MenuApiResponse>(endpoint, token);
      if (!result) return empty;
      return {
        data:         result.data                     || [],
        current_page: result.pagination?.current_page  || 1,
        per_page:     result.pagination?.per_page      || 10,
        total:        result.pagination?.total          || 0,
        last_page:    result.pagination?.last_page      || 1,
        from:         result.pagination?.from           || 0,
        to:           result.pagination?.to             || 0,
      };
    } catch (error) {
      console.error('Failed to fetch raw menus:', error);
      return empty;
    }
  },

  /**
   * Get single menu
   */
  async getMenu(id: number): Promise<Menu | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleMenuApiResponse>(`/menus/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch menu ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new menu
   */
  async createMenu(data: MenuCreateData): Promise<Menu | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('[MenuService] Creating menu with token:', token ? 'Token exists' : 'No token');
      const result = await apiClient.post<MenuActionApiResponse>('/menus', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create menu');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create menu:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update menu
   */
  async updateMenu(id: number, data: Partial<MenuCreateData>): Promise<Menu | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('[MenuService] Updating menu with token:', token ? 'Token exists' : 'No token');
      const result = await apiClient.put<MenuActionApiResponse>(`/menus/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update menu');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update menu ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete menu
   */
  async deleteMenu(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<MenuActionApiResponse>(`/menus/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete menu ${id}:`, error);
      return false;
    }
  },

  /**
   * Assign permissions to menu
   */
  async assignPermissions(menuId: number, permissionIds: number[]): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.post<MenuActionApiResponse>(
        `/menus/${menuId}/permissions`,
        { permission_ids: permissionIds },
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to assign permissions to menu ${menuId}:`, error);
      return false;
    }
  },

  /**
   * Sync permission action codes with menu
   */
  async syncPermissions(menuId: number, actionCodes: string[]): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.post<MenuActionApiResponse>(
        '/permissions/sync-menu-permissions',
        { menu_id: menuId, action_codes: actionCodes },
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to sync permissions for menu ${menuId}:`, error);
      return false;
    }
  },
};

export default menuService;
