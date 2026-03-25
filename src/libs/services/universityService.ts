import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemUniversity } from '@/libs/types/system';

export interface UniversityDepartmentInput {
  name: string;
  code: string;
  is_current?: boolean;
  is_active?: boolean;
}

interface UniversityQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface UniversityPaginatedResponse {
  data: SystemUniversity[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface UniversityApiResponse {
  success: boolean;
  message: string;
  data: SystemUniversity[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleUniversityApiResponse {
  success: boolean;
  message: string;
  data: SystemUniversity;
}

interface UniversityActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemUniversity;
}

interface UniversityCreateData {
  name: string;
  short_name: string;
  is_current?: boolean;
  is_active?: boolean;
  departments?: UniversityDepartmentInput[];
}

export const universityService = {
  async getAllUniversities(params?: UniversityQueryParams): Promise<UniversityPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const token = getToken();
      const result = await apiClient.get<UniversityApiResponse>(
        `/system-universities${query.toString() ? `?${query.toString()}` : ''}`,
        token
      );

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
      console.error('Failed to fetch universities:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getUniversity(id: number): Promise<SystemUniversity | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleUniversityApiResponse>(`/system-universities/${id}`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch university ${id}:`, error);
      return null;
    }
  },

  async createUniversity(data: UniversityCreateData): Promise<SystemUniversity | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<UniversityActionApiResponse>('/system-universities', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create university');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create university:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateUniversity(id: number, data: Partial<UniversityCreateData>): Promise<SystemUniversity | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<UniversityActionApiResponse>(`/system-universities/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update university');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update university ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteUniversity(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<UniversityActionApiResponse>(`/system-universities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete university ${id}:`, error);
      return false;
    }
  },
};

export default universityService;
