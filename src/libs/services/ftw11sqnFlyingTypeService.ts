/**
 * FTW 11SQN Flying Type Service
 * API calls for FTW 11SQN Flying Type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11sqnFlyingType, Ftw11sqnFlyingTypeCreateData } from '@/libs/types/ftw11sqnFlying';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: Ftw11sqnFlyingType[];
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
  data: Ftw11sqnFlyingType[];
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
  data: Ftw11sqnFlyingType;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnFlyingType;
}

export const ftw11sqnFlyingTypeService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-flying-types${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch flying types:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getList(): Promise<Ftw11sqnFlyingType[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw11sqnFlyingType[] }>('/ftw-11sqn-flying-types/list', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch flying types list:', error);
      return [];
    }
  },

  async get(id: number): Promise<Ftw11sqnFlyingType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-types/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch flying type ${id}:`, error);
      return null;
    }
  },

  async create(data: Ftw11sqnFlyingTypeCreateData): Promise<Ftw11sqnFlyingType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-types', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create flying type');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create flying type:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<Ftw11sqnFlyingTypeCreateData>): Promise<Ftw11sqnFlyingType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-types/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update flying type');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update flying type ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete flying type ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnFlyingTypeService;
