import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { Ftw12SqnCommandSemesterApproval } from '@/libs/types/ftw12sqnCommandSemesterApproval';

interface SemesterApprovalQueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  status?: string;
  is_active?: boolean;
}

interface SemesterApprovalPaginatedResponse {
  data: Ftw12SqnCommandSemesterApproval[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SemesterApprovalApiResponse {
  success: boolean;
  message: string;
  data: Ftw12SqnCommandSemesterApproval[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSemesterApprovalApiResponse {
  success: boolean;
  message: string;
  data: Ftw12SqnCommandSemesterApproval;
}

export const ftw12sqnCommandSemesterApprovalService = {
  getAll: async (params?: SemesterApprovalQueryParams): Promise<SemesterApprovalPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/ftw12sqn-Command-semester-approvals${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<SemesterApprovalApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page: result.pagination?.per_page || 15,
        total: result.pagination?.total || 0,
        last_page: result.pagination?.last_page || 1,
        from: result.pagination?.from || 0,
        to: result.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch Command semester approvals:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<Ftw12SqnCommandSemesterApproval>): Promise<Ftw12SqnCommandSemesterApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleSemesterApprovalApiResponse>('/ftw12sqn-Command-semester-approvals', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create Command semester approval:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<Ftw12SqnCommandSemesterApproval>): Promise<Ftw12SqnCommandSemesterApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleSemesterApprovalApiResponse>(`/ftw12sqn-Command-semester-approvals/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update Command semester approval ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ftw12sqn-Command-semester-approvals/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete Command semester approval ${id}:`, error);
      return false;
    }
  },
};

export default ftw12sqnCommandSemesterApprovalService;

