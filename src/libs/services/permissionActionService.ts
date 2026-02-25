/**
 * Permission Action Service
 * API calls for permission action management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { PermissionAction, PermissionActionArrayApiResponse } from '@/libs/types/menu';

interface SinglePermissionActionApiResponse {
  success: boolean;
  message: string;
  data: PermissionAction;
}

export const permissionActionService = {
  /**
   * Get all permission actions
   */
  async getAllActions(): Promise<PermissionAction[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<PermissionActionArrayApiResponse>('/permission-actions', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch permission actions:', error);
      return [];
    }
  },

  /**
   * Get active permission actions
   */
  async getActiveActions(): Promise<PermissionAction[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<PermissionActionArrayApiResponse>('/permission-actions/active', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch active permission actions:', error);
      return [];
    }
  },

  /**
   * Get single action
   */
  async getAction(id: number | string): Promise<PermissionAction | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SinglePermissionActionApiResponse>(`/permission-actions/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch permission action ${id}:`, error);
      return null;
    }
  },

  /**
   * Create action
   */
  async createAction(data: any): Promise<PermissionAction | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<SinglePermissionActionApiResponse>('/permission-actions', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create permission action:', error);
      throw error;
    }
  },

  /**
   * Update action
   */
  async updateAction(id: number | string, data: any): Promise<PermissionAction | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<SinglePermissionActionApiResponse>(`/permission-actions/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update permission action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete action
   */
  async deleteAction(id: number | string): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<any>(`/permission-actions/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete permission action ${id}:`, error);
      return false;
    }
  },
};

export default permissionActionService;
