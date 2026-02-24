/**
 * Cadet Service
 * API calls for cadet management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CadetProfile } from '@/libs/types/user';

interface CadetQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  rank_id?: number;
}

interface CadetPaginatedResponse {
  data: CadetProfile[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: CadetProfile[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: CadetProfile;
}

interface CadetActionApiResponse {
  success: boolean;
  message: string;
  data?: CadetProfile;
}

interface CadetCreateData {
  cadet_number: string;
  name: string;
  email?: string;
  phone?: string;
  rank_id?: number;
  date_of_birth?: string;
  date_of_joining?: string;
  gender?: 'male' | 'female' | 'other';
  have_professional?: boolean;
  blood_group?: string;
  address?: string;
  batch?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  medical_conditions?: string;
  is_active?: boolean;
}

export const cadetService = {
  async getAllCadets(params?: CadetQueryParams): Promise<CadetPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());
      if (params?.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params?.group_id) query.append('group_id', params.group_id.toString());
      if (params?.rank_id) query.append('rank_id', params.rank_id.toString());

      const endpoint = `/cadets${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(endpoint, token);

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
      console.error('Failed to fetch cadets:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getCadet(id: number): Promise<CadetProfile | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleCadetApiResponse>(`/cadets/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch cadet ${id}:`, error);
      return null;
    }
  },

  async createCadet(data: CadetCreateData): Promise<CadetProfile | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<CadetActionApiResponse>('/cadets', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create cadet');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create cadet:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateCadet(id: number, data: Partial<CadetCreateData>): Promise<CadetProfile | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<CadetActionApiResponse>(`/cadets/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update cadet');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update cadet ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteCadet(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<CadetActionApiResponse>(`/cadets/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete cadet ${id}:`, error);
      return false;
    }
  },

  // Progression Methods
  async promoteSemester(cadetId: number, data: { current_semester_assignment_id: number; next_semester_id: number; start_date: string; description?: string }): Promise<CadetActionApiResponse | null> {
    try {
      const token = getToken();
      return await apiClient.post<CadetActionApiResponse>(`/cadet-progression/${cadetId}/promote-semester`, data, token);
    } catch (error) {
      console.error(`Failed to promote cadet ${cadetId}:`, error);
      throw error;
    }
  },

  async failSemester(cadetId: number, data: { semester_assignment_id: number; description?: string }): Promise<CadetActionApiResponse | null> {
    try {
      const token = getToken();
      return await apiClient.post<CadetActionApiResponse>(`/cadet-progression/${cadetId}/fail-semester`, data, token);
    } catch (error) {
      console.error(`Failed to mark cadet ${cadetId} as failed:`, error);
      throw error;
    }
  },

  async downgradeSemester(cadetId: number, data: { 
    current_semester_assignment_id: number; 
    target_semester_id: number; 
    reason: string; 
    start_date: string;
    course_id?: number;
    program_id?: number;
    branch_id?: number;
    group_id?: number;
  }): Promise<CadetActionApiResponse | null> {
    try {
      const token = getToken();
      return await apiClient.post<CadetActionApiResponse>(`/cadet-progression/${cadetId}/downgrade-semester`, data, token);
    } catch (error) {
      console.error(`Failed to downgrade cadet ${cadetId}:`, error);
      throw error;
    }
  },

  async postponeCadet(cadetId: number, data: { reason: string; postpone_date: string }): Promise<CadetActionApiResponse | null> {
    try {
      const token = getToken();
      return await apiClient.post<CadetActionApiResponse>(`/cadet-progression/${cadetId}/postpone`, data, token);
    } catch (error) {
      console.error(`Failed to postpone cadet ${cadetId}:`, error);
      throw error;
    }
  },
};

export default cadetService;
