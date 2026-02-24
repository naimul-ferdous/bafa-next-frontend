/**
 * Semester Service
 * API calls for semester management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemSemester } from '@/libs/types/system';

interface SemesterQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface SemesterPaginatedResponse {
  data: SystemSemester[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SemesterApiResponse {
  success: boolean;
  message: string;
  data: SystemSemester[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSemesterApiResponse {
  success: boolean;
  message: string;
  data: SystemSemester;
}

interface SemesterActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemSemester;
}

interface SemesterCreateData {
  name: string;
  code: string;
  year: number;
  session?: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  is_active?: boolean;
}

export const semesterService = {
  async getAllSemesters(params?: SemesterQueryParams): Promise<SemesterPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/system-semesters${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<SemesterApiResponse>(endpoint, token);

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
      console.error('Failed to fetch semesters:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getSemester(id: number): Promise<SystemSemester | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSemesterApiResponse>(`/system-semesters/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch semester ${id}:`, error);
      return null;
    }
  },

  async createSemester(data: SemesterCreateData): Promise<SystemSemester | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<SemesterActionApiResponse>('/system-semesters', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create semester');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create semester:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateSemester(id: number, data: Partial<SemesterCreateData>): Promise<SystemSemester | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<SemesterActionApiResponse>(`/system-semesters/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update semester');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update semester ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteSemester(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SemesterActionApiResponse>(`/system-semesters/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete semester ${id}:`, error);
      return false;
    }
  },
};

export default semesterService;
