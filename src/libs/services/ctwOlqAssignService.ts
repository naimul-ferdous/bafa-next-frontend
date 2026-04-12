import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CtwOlqAssign } from '@/libs/types/ctwAssign';

interface AssignQueryParams {
  page?: number;
  per_page?: number;
  allData?: boolean;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  user_id?: number;
  is_active?: boolean;
}

interface AssignPaginatedResponse {
  data: CtwOlqAssign[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface AssignApiResponse {
  success: boolean;
  message: string;
  data: CtwOlqAssign[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleAssignApiResponse {
  success: boolean;
  message: string;
  data: CtwOlqAssign;
}

export const ctwOlqAssignService = {
  getAll: async (params?: AssignQueryParams): Promise<AssignPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page)                    query.append('page',        params.page.toString());
      if (params?.per_page)                query.append('per_page',    params.per_page.toString());
      if (params?.allData)                 query.append('allData',     '1');
      if (params?.course_id)               query.append('course_id',   params.course_id.toString());
      if (params?.semester_id)             query.append('semester_id', params.semester_id.toString());
      if (params?.program_id)              query.append('program_id',  params.program_id.toString());
      if (params?.branch_id)               query.append('branch_id',   params.branch_id.toString());
      if (params?.user_id)                 query.append('user_id',     params.user_id.toString());
      if (params?.is_active !== undefined) query.append('is_active',   params.is_active ? '1' : '0');

      const endpoint = `/ctw-olq-assigns${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<AssignApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page:     result.pagination?.per_page     || 15,
        total:        result.pagination?.total        || 0,
        last_page:    result.pagination?.last_page    || 1,
        from:         result.pagination?.from         || 0,
        to:           result.pagination?.to           || 0,
      };
    } catch (error) {
      console.error('Failed to fetch CTW OLQ assigns:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<CtwOlqAssign>): Promise<CtwOlqAssign | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAssignApiResponse>('/ctw-olq-assigns', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create CTW OLQ assign:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<CtwOlqAssign>): Promise<CtwOlqAssign | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAssignApiResponse>(`/ctw-olq-assigns/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update CTW OLQ assign ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-olq-assigns/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW OLQ assign ${id}:`, error);
      return false;
    }
  },
};

export default ctwOlqAssignService;
