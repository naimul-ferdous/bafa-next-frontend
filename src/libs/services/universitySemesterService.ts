import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface SystemUniversitySemester {
  id: number;
  university_id: number;
  name: string;
  short_name: string | null;
  code: string | null;
  is_active: boolean;
  university?: { id: number; name: string; short_name: string | null } | null;
  created_at?: string;
  updated_at?: string;
}

export interface UniversitySemesterCreateData {
  university_id: number;
  name: string;
  short_name?: string | null;
  code?: string | null;
  is_active?: boolean;
}

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  university_id?: number;
}

interface PaginatedResponse {
  data: SystemUniversitySemester[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export const universitySemesterService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.university_id) query.append('university_id', params.university_id.toString());

      const token = getToken();
      const result = await apiClient.get<any>(
        `/system-university-semesters${query.toString() ? `?${query.toString()}` : ''}`,
        token
      );

      return {
        data: result?.data || [],
        current_page: result?.pagination?.current_page || 1,
        per_page: result?.pagination?.per_page || 10,
        total: result?.pagination?.total || 0,
        last_page: result?.pagination?.last_page || 1,
        from: result?.pagination?.from || 0,
        to: result?.pagination?.to || 0,
      };
    } catch {
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async create(data: UniversitySemesterCreateData): Promise<SystemUniversitySemester> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<any>('/system-university-semesters', data, token);
    if (!result?.success) throw new Error(result?.message || 'Failed to create university semester');
    return result.data;
  },

  async update(id: number, data: Partial<UniversitySemesterCreateData>): Promise<SystemUniversitySemester> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.put<any>(`/system-university-semesters/${id}`, data, token);
    if (!result?.success) throw new Error(result?.message || 'Failed to update university semester');
    return result.data;
  },

  async delete(id: number): Promise<boolean> {
    const token = getToken();
    const result = await apiClient.delete<any>(`/system-university-semesters/${id}`, token);
    return result?.success || false;
  },
};

export default universitySemesterService;
