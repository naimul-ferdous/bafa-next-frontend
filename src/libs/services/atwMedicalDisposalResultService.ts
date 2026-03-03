import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwMedicalDisposalResult, AtwMedicalDisposalResultPayload } from '@/libs/types/atwMedicalDisposal';

interface PaginatedResponse<T> {
  data: T[];
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

export const atwMedicalDisposalResultService = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    course_id?: number;
    semester_id?: number;
    program_id?: number;
    branch_id?: number;
    cadet_id?: number;
    atw_medical_disposal_id?: number;
  }): Promise<PaginatedResponse<AtwMedicalDisposalResult>> {
    const token = getToken();
    const query = new URLSearchParams();
    if (params?.page)                    query.set('page',                    String(params.page));
    if (params?.per_page)                query.set('per_page',                String(params.per_page));
    if (params?.course_id)               query.set('course_id',               String(params.course_id));
    if (params?.semester_id)             query.set('semester_id',             String(params.semester_id));
    if (params?.program_id)              query.set('program_id',              String(params.program_id));
    if (params?.branch_id)               query.set('branch_id',               String(params.branch_id));
    if (params?.cadet_id)                query.set('cadet_id',                String(params.cadet_id));
    if (params?.atw_medical_disposal_id) query.set('atw_medical_disposal_id', String(params.atw_medical_disposal_id));

    const res = await apiClient.get<ApiResponse<AtwMedicalDisposalResult[]>>(
      `/atw-medical-disposal-results?${query}`, token
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

  async getGroupedResults(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const token = getToken();
    const query = new URLSearchParams();
    if (params?.page)     query.set('page',     String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.search)   query.set('search',   params.search);

    const res = await apiClient.get<ApiResponse<any[]>>(
      `/atw-medical-disposal-results/grouped?${query}`, token
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

  async getOne(id: number): Promise<AtwMedicalDisposalResult> {
    const token = getToken();
    const res = await apiClient.get<ApiResponse<AtwMedicalDisposalResult>>(
      `/atw-medical-disposal-results/${id}`, token
    );
    return res.data;
  },

  async create(data: AtwMedicalDisposalResultPayload): Promise<AtwMedicalDisposalResult> {
    const token = getToken();
    const res = await apiClient.post<ApiResponse<AtwMedicalDisposalResult>>(
      '/atw-medical-disposal-results', data, token
    );
    return res.data;
  },

  async update(id: number, data: Partial<AtwMedicalDisposalResultPayload>): Promise<AtwMedicalDisposalResult> {
    const token = getToken();
    const res = await apiClient.put<ApiResponse<AtwMedicalDisposalResult>>(
      `/atw-medical-disposal-results/${id}`, data, token
    );
    return res.data;
  },

  async delete(id: number): Promise<void> {
    const token = getToken();
    await apiClient.delete<ApiResponse<null>>(
      `/atw-medical-disposal-results/${id}`, token
    );
  },
};
