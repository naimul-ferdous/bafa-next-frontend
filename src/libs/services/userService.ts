/**
 * User Service
 * API calls for user management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { User } from '@/libs/types/user';

interface UserQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

interface UserPaginatedResponse {
  data: User[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface UserApiResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleUserApiResponse {
  success: boolean;
  message: string;
  data: User;
}

interface UserActionApiResponse {
  success: boolean;
  message: string;
  data?: User;
}

interface UserCreateData {
  service_number: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  rank_id?: number;
  date_of_birth?: string;
  date_of_joining?: string;
  blood_group?: string;
  address?: string;
  profile_photo?: string;
  signature?: string;
  is_active?: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
}

export const userService = {
  async getBlockedUsers(): Promise<User[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: User[] }>('/users/blocked', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
      return [];
    }
  },

  async getAllUsers(params?: UserQueryParams): Promise<UserPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.status) query.append('status', params.status);

      const endpoint = `/users${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<UserApiResponse>(endpoint, token);

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
      console.error('Failed to fetch users:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getUser(id: number): Promise<User | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleUserApiResponse>(`/users/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return null;
    }
  },

  async createUser(data: UserCreateData): Promise<User | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<UserActionApiResponse>('/users', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create user');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateUser(id: number, data: Partial<UserCreateData>): Promise<User | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<UserActionApiResponse>(`/users/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update user');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update user ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<UserActionApiResponse>(`/users/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      return false;
    }
  },

  async findUserByServiceNumber(serviceNumber: string): Promise<User | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<UserApiResponse>(`/users?search=${serviceNumber}`, token);

      if (result && result.success && result.data && result.data.length > 0) {
        // Only return exact match
        const exactMatch = result.data.find(u => u.service_number === serviceNumber);
        if (!exactMatch) return null;
        // Fetch full user details to get roles
        const fullUser = await this.getUser(exactMatch.id);
        return fullUser || exactMatch;
      }
      return null;
    } catch (error) {
      console.error(`Failed to find user with service number ${serviceNumber}:`, error);
      return null;
    }
  },

  async assignRole(userId: number, data: { role_id: number; wing_id?: number | null; sub_wing_id?: number | null; is_primary?: boolean }): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<UserActionApiResponse>(`/users/${userId}/assign-role`, data, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to assign role to user ${userId}:`, error);
      return false;
    }
  },

  async removeRole(userId: number, assignmentId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<UserActionApiResponse>(`/users/${userId}/remove-role/${assignmentId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to remove role from user ${userId}:`, error);
      return false;
    }
  },

  async syncRoles(userId: number, roleIds: number[], wingId?: number | string | null, subWingId?: number | string | null): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<UserActionApiResponse>(`/users/${userId}/sync-roles`, { 
        role_ids: roleIds,
        wing_id: wingId || null,
        sub_wing_id: subWingId || null
      }, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to sync roles for user ${userId}:`, error);
      return false;
    }
  },
};

export default userService;
