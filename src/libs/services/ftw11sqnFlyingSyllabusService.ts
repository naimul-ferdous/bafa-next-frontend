/**
 * FTW 11SQN Flying Syllabus Service
 * API calls for FTW 11SQN Flying Syllabus management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11sqnFlyingSyllabus, Ftw11sqnFlyingSyllabusCreateData } from '@/libs/types/ftw11sqnFlying';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  flying_phase_type_id?: number;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: Ftw11sqnFlyingSyllabus[];
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
  data: Ftw11sqnFlyingSyllabus[];
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
  data: Ftw11sqnFlyingSyllabus;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnFlyingSyllabus;
}

export const ftw11sqnFlyingSyllabusService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.flying_phase_type_id) query.append('flying_phase_type_id', params.flying_phase_type_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-flying-syllabus${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch flying syllabus:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getList(params?: { flying_phase_type_id?: number }): Promise<Ftw11sqnFlyingSyllabus[]> {
    try {
      const query = new URLSearchParams();
      if (params?.flying_phase_type_id) query.append('flying_phase_type_id', params.flying_phase_type_id.toString());

      const endpoint = `/ftw-11sqn-flying-syllabus/list${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw11sqnFlyingSyllabus[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch flying syllabus list:', error);
      return [];
    }
  },

  async get(id: number): Promise<Ftw11sqnFlyingSyllabus | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-syllabus/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch flying syllabus ${id}:`, error);
      return null;
    }
  },

  // Single API call to create syllabus with all nested data (syllabus_types and exercises)
  async create(data: Ftw11sqnFlyingSyllabusCreateData): Promise<Ftw11sqnFlyingSyllabus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-syllabus', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create flying syllabus');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create flying syllabus:', error);
      throw error;
    }
  },

  // Single API call to update syllabus with all nested data
  async update(id: number, data: Partial<Ftw11sqnFlyingSyllabusCreateData>): Promise<Ftw11sqnFlyingSyllabus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-syllabus/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update flying syllabus');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update flying syllabus ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-syllabus/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete flying syllabus ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnFlyingSyllabusService;
