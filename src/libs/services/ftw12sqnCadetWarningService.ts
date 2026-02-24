/**
 * FTW 12SQN Cadet Warning Service
 * API calls for FTW 12SQN cadet warning management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CadetWarning } from '@/libs/types/system';

interface WarningQueryParams {
  page?: number;
  per_page?: number;
  cadet_id?: number;
  course_id?: number;
  semester_id?: number;
  warning_id?: number;
  is_active?: boolean;
  allData?: boolean;
}

interface WarningPaginatedResponse {
  data: CadetWarning[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface WarningApiResponse {
  success: boolean;
  message: string;
  data: CadetWarning[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleWarningApiResponse {
  success: boolean;
  message: string;
  data: CadetWarning;
}

interface WarningCreateData {
  cadet_id: number;
  warning_id: number;
  course_id?: number;
  semester_id?: number;
  remarks?: string;
  is_active?: boolean;
  created_by?: number;
}

export const ftw12sqnCadetWarningService = {
  async getAll(params?: WarningQueryParams): Promise<WarningPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.cadet_id) query.append('cadet_id', params.cadet_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.warning_id) query.append('warning_id', params.warning_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw-12sqn-cadet-warnings${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<WarningApiResponse>(endpoint, token);

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
      console.error('Failed to fetch FTW 12SQN cadet warnings:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getById(id: number): Promise<CadetWarning | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleWarningApiResponse>(`/ftw-12sqn-cadet-warnings/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch FTW 12SQN cadet warning ${id}:`, error);
      return null;
    }
  },

  async getByCadet(cadetId: number): Promise<CadetWarning[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<WarningApiResponse>(`/ftw-12sqn-cadet-warnings/cadet/${cadetId}`, token);
      if (!result || !result.success) return [];
      return result.data || [];
    } catch (error) {
      console.error(`Failed to fetch FTW 12SQN warnings for cadet ${cadetId}:`, error);
      return [];
    }
  },

  async create(data: WarningCreateData): Promise<CadetWarning | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<SingleWarningApiResponse>('/ftw-12sqn-cadet-warnings', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create warning');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create FTW 12SQN cadet warning:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<WarningCreateData>): Promise<CadetWarning | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<SingleWarningApiResponse>(`/ftw-12sqn-cadet-warnings/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update warning');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update FTW 12SQN cadet warning ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ftw-12sqn-cadet-warnings/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete FTW 12SQN cadet warning ${id}:`, error);
      return false;
    }
  },

  async getGroupedResults(params?: { course_id?: number; semester_id?: number; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/ftw-12sqn-cadet-warnings/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return [];
    }
  },
};

export default ftw12sqnCadetWarningService;
