import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface Ftw12sqnSyllabusSignature {
  id: number;
  user_id: number;
  approved_date: string | null;
  type: 'flying_summary' | 'flying_details' | 'simulator_summary' | 'simulator_details';
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; service_number: string; rank?: { id: number; name: string; short_name: string }; roles?: { id: number; name: string }[] };
}

interface SignatureQueryParams {
  type?: string;
  page?: number;
  per_page?: number;
}

interface PaginatedResponse {
  data: Ftw12sqnSyllabusSignature[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Ftw12sqnSyllabusSignature | Ftw12sqnSyllabusSignature[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

const BASE = '/ftw-12sqn-syllabus-signatures';

export const ftw12sqnSyllabusSignatureService = {
  async getAll(params?: SignatureQueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());

      const endpoint = `${BASE}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1 };
      }

      return {
        data: Array.isArray(result.data) ? result.data : [result.data],
        current_page: result.pagination?.current_page || 1,
        per_page: result.pagination?.per_page || 10,
        total: result.pagination?.total || 0,
        last_page: result.pagination?.last_page || 1,
      };
    } catch (error) {
      console.error('Failed to fetch syllabus signatures:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1 };
    }
  },

  async create(data: { user_id: number; type: string; approved_date?: string }): Promise<Ftw12sqnSyllabusSignature | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ApiResponse>(BASE, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create signature');
      return result.data as Ftw12sqnSyllabusSignature;
    } catch (error) {
      console.error('Failed to create syllabus signature:', error);
      throw error;
    }
  },

  async update(id: number, data: { user_id?: number; type?: string; approved_date?: string; is_active?: boolean }): Promise<Ftw12sqnSyllabusSignature | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ApiResponse>(`${BASE}/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update signature');
      return result.data as Ftw12sqnSyllabusSignature;
    } catch (error) {
      console.error('Failed to update syllabus signature:', error);
      throw error;
    }
  },

  async remove(id: number): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.delete<{ success: boolean; message: string }>(`${BASE}/${id}`, token);
      return !!result?.success;
    } catch (error) {
      console.error('Failed to delete syllabus signature:', error);
      throw error;
    }
  },

  async toggleStatus(id: number): Promise<Ftw12sqnSyllabusSignature | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ApiResponse>(`${BASE}/${id}/toggle`, {}, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to toggle status');
      return result.data as Ftw12sqnSyllabusSignature;
    } catch (error) {
      console.error('Failed to toggle signature status:', error);
      throw error;
    }
  },
};

export default ftw12sqnSyllabusSignatureService;