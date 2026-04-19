import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemExtension } from '@/libs/types/systemExtension';

export interface UserAssignedExtension {
  id: number;
  user_id: number | null;
  extension_id: number;
  extension?: SystemExtension | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const userAssignedExtensionService = {
  async getByUser(userId: number): Promise<UserAssignedExtension[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApiResponse<UserAssignedExtension[]>>(
        `/user-assigned-extensions?user_id=${userId}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch user extension assignments:', error);
      return [];
    }
  },

  async assign(userId: number, extensionId: number): Promise<UserAssignedExtension | null> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found. Please login again.');
    const result = await apiClient.post<ApiResponse<UserAssignedExtension>>(
      '/user-assigned-extensions',
      { user_id: userId, extension_id: extensionId },
      token
    );
    if (!result?.success) throw new Error(result?.message || 'Failed to assign extension');
    return result.data || null;
  },

  async remove(assignmentId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ApiResponse<null>>(
        `/user-assigned-extensions/${assignmentId}`,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to remove extension assignment:', error);
      return false;
    }
  },
};

export default userAssignedExtensionService;
