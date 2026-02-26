/**
 * FTW 11SQN Ground Syllabus Service
 * API calls for FTW 11SQN Ground Syllabus management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusCreateData } from '@/libs/types/ftw11sqnFlying';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  course_id?: number;
  semester_id?: number;
}

interface PaginatedResponse {
  data: Ftw11sqnGroundSyllabus[];
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
  data: Ftw11sqnGroundSyllabus[];
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
  data: Ftw11sqnGroundSyllabus;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnGroundSyllabus;
}

export const ftw11sqnGroundSyllabusService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-ground-syllabus${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch ground syllabus:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getList(params?: { course_id?: number; semester_id?: number }): Promise<Ftw11sqnGroundSyllabus[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ftw-11sqn-ground-syllabus/list${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw11sqnGroundSyllabus[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch ground syllabus list:', error);
      return [];
    }
  },

  async get(id: number, params?: { include_inactive?: boolean }): Promise<Ftw11sqnGroundSyllabus | null> {
    try {
      const query = new URLSearchParams();
      if (params?.include_inactive) query.append('include_inactive', '1');
      
      const endpoint = `/ftw-11sqn-ground-syllabus/${id}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch ground syllabus ${id}:`, error);
      return null;
    }
  },

  async create(data: Ftw11sqnGroundSyllabusCreateData): Promise<Ftw11sqnGroundSyllabus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-ground-syllabus', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create ground syllabus');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create ground syllabus:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<Ftw11sqnGroundSyllabusCreateData>): Promise<Ftw11sqnGroundSyllabus | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-ground-syllabus/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update ground syllabus');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update ground syllabus ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-ground-syllabus/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete ground syllabus ${id}:`, error);
      return false;
    }
  },

  async getCourseGrouped(params?: { course_id?: number; include_inactive?: boolean }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.include_inactive) query.append('include_inactive', '1');

      const endpoint = `/ftw-11sqn-ground-syllabus/grouped/course${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch course grouped ground syllabus:', error);
      return [];
    }
  },

  async getSemesterGrouped(params?: { semester_id?: number; include_inactive?: boolean }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.include_inactive) query.append('include_inactive', '1');

      const endpoint = `/ftw-11sqn-ground-syllabus/grouped/semester${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semester grouped ground syllabus:', error);
      return [];
    }
  },
};

export default ftw11sqnGroundSyllabusService;
