import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CtwMedicalDisposalSyllabus, CtwMedicalDisposalSyllabusPayload } from '@/libs/types/ctwMedicalDisposal';

interface PaginatedResponse {
  data: CtwMedicalDisposalSyllabus[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export const ctwMedicalDisposalSyllabusService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; allData?: boolean }): Promise<PaginatedResponse> {
    const token = getToken();
    const query = new URLSearchParams();
    if (params?.page)     query.set('page',     String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.search)   query.set('search',   params.search);
    if (params?.allData)  query.set('allData',  '1');
    const res = await apiClient.get<ApiResponse<CtwMedicalDisposalSyllabus[]>>(
      `/ctw-medical-disposal-syllabus?${query}`, token
    );
    return {
      data: res.data || [],
      current_page: res.pagination?.current_page || 1,
      last_page:    res.pagination?.last_page    || 1,
      per_page:     res.pagination?.per_page     || 10,
      total:        res.pagination?.total        || 0,
      from:         res.pagination?.from         || 0,
      to:           res.pagination?.to           || 0,
    };
  },

  async getOne(id: number): Promise<CtwMedicalDisposalSyllabus> {
    const token = getToken();
    const res = await apiClient.get<ApiResponse<CtwMedicalDisposalSyllabus>>(
      `/ctw-medical-disposal-syllabus/${id}`, token
    );
    return res.data;
  },

  async create(data: CtwMedicalDisposalSyllabusPayload): Promise<CtwMedicalDisposalSyllabus> {
    const token = getToken();
    const res = await apiClient.post<ApiResponse<CtwMedicalDisposalSyllabus>>(
      '/ctw-medical-disposal-syllabus', data, token
    );
    return res.data;
  },

  async update(id: number, data: CtwMedicalDisposalSyllabusPayload | Partial<CtwMedicalDisposalSyllabus>): Promise<CtwMedicalDisposalSyllabus> {
    const token = getToken();
    const res = await apiClient.put<ApiResponse<CtwMedicalDisposalSyllabus>>(
      `/ctw-medical-disposal-syllabus/${id}`, data, token
    );
    return res.data;
  },

  async delete(id: number): Promise<void> {
    const token = getToken();
    await apiClient.delete<ApiResponse<null>>(
      `/ctw-medical-disposal-syllabus/${id}`, token
    );
  },
};
