import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface CtwAttendenceType {
  id: number;
  name: string;
  short_name: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  creator?: { id: number; name: string } | null;
}

export interface CtwAttendenceTypeFormData {
  name: string;
  short_name: string;
  start_time?: string | null;
  end_time?: string | null;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: CtwAttendenceType[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiPaginatedResult {
  success: boolean;
  data: CtwAttendenceType[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export const ctwAttendenceTypeService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.search) query.set('search', params.search);
    const token = getToken();
    const result = await apiClient.get<ApiPaginatedResult>(
      `/ctw-attendence-types?${query.toString()}`, token
    );
    return {
      data: result.data ?? [],
      current_page: result.pagination?.current_page ?? 1,
      last_page: result.pagination?.last_page ?? 1,
      per_page: result.pagination?.per_page ?? 10,
      total: result.pagination?.total ?? 0,
      from: result.pagination?.from ?? 0,
      to: result.pagination?.to ?? 0,
    };
  },

  async create(data: CtwAttendenceTypeFormData): Promise<CtwAttendenceType> {
    const token = getToken();
    const result = await apiClient.post<{ success: boolean; data: CtwAttendenceType }>(
      '/ctw-attendence-types', data, token
    );
    return result.data;
  },

  async update(id: number, data: CtwAttendenceTypeFormData): Promise<CtwAttendenceType> {
    const token = getToken();
    const result = await apiClient.put<{ success: boolean; data: CtwAttendenceType }>(
      `/ctw-attendence-types/${id}`, data, token
    );
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const token = getToken();
    await apiClient.delete(`/ctw-attendence-types/${id}`, token);
  },
};
