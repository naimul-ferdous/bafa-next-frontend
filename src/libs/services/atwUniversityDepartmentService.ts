import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwUniversityDepartment } from '@/libs/types/system';

interface DepartmentQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  university_id?: number;
}

interface DepartmentPaginatedResponse {
  data: AtwUniversityDepartment[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface DepartmentApiResponse {
  success: boolean;
  message: string;
  data: AtwUniversityDepartment[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleDepartmentApiResponse {
  success: boolean;
  message: string;
  data: AtwUniversityDepartment;
}

interface DepartmentActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwUniversityDepartment;
}

export interface DepartmentCreateData {
  name: string;
  code: string;
  university_id: number;
  is_current?: boolean;
  is_active?: boolean;
}

const emptyPage: DepartmentPaginatedResponse = { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };

export const atwUniversityDepartmentService = {
  async getAllDepartments(params?: DepartmentQueryParams): Promise<DepartmentPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.university_id) query.append('university_id', params.university_id.toString());

      const token = getToken();
      const result = await apiClient.get<DepartmentApiResponse>(
        `/atw-university-departments${query.toString() ? `?${query.toString()}` : ''}`,
        token
      );

      if (!result) return emptyPage;

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
      console.error('Failed to fetch departments:', error);
      return emptyPage;
    }
  },

  async getDepartment(id: number): Promise<AtwUniversityDepartment | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleDepartmentApiResponse>(`/atw-university-departments/${id}`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch department ${id}:`, error);
      return null;
    }
  },

  async createDepartment(data: DepartmentCreateData): Promise<AtwUniversityDepartment | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<DepartmentActionApiResponse>('/atw-university-departments', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create department');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create department:', error);
      throw error;
    }
  },

  async updateDepartment(id: number, data: Partial<DepartmentCreateData>): Promise<AtwUniversityDepartment | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<DepartmentActionApiResponse>(`/atw-university-departments/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update department');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update department ${id}:`, error);
      throw error;
    }
  },

  async deleteDepartment(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<DepartmentActionApiResponse>(`/atw-university-departments/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete department ${id}:`, error);
      return false;
    }
  },
};

export default atwUniversityDepartmentService;
