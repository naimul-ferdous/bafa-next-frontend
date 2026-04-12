import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CtwOlqCadetApproval } from '@/libs/types/ctwOlqCadetApproval';

interface ApprovalQueryParams {
  page?: number;
  per_page?: number;
  allData?: boolean;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  cadet_id?: number;
  authority_id?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

interface ApprovalPaginatedResponse {
  data: CtwOlqCadetApproval[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApprovalApiResponse {
  success: boolean;
  message: string;
  data: CtwOlqCadetApproval[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleApprovalApiResponse {
  success: boolean;
  message: string;
  data: CtwOlqCadetApproval;
}

export const ctwOlqCadetApprovalService = {
  getApprovals: async (params?: ApprovalQueryParams): Promise<ApprovalPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page)         query.append('page',         params.page.toString());
      if (params?.per_page)     query.append('per_page',     params.per_page.toString());
      if (params?.allData)      query.append('allData',      '1');
      if (params?.course_id)    query.append('course_id',    params.course_id.toString());
      if (params?.semester_id)  query.append('semester_id',  params.semester_id.toString());
      if (params?.program_id)   query.append('program_id',   params.program_id.toString());
      if (params?.branch_id)    query.append('branch_id',    params.branch_id.toString());
      if (params?.cadet_id)     query.append('cadet_id',     params.cadet_id.toString());
      if (params?.authority_id) query.append('authority_id', params.authority_id.toString());
      if (params?.status)       query.append('status',       params.status);

      const endpoint = `/ctw-olq-cadet-approvals${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApprovalApiResponse>(endpoint, token);

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
      console.error('Failed to fetch CTW OLQ cadet approvals:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<CtwOlqCadetApproval>): Promise<CtwOlqCadetApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleApprovalApiResponse>('/ctw-olq-cadet-approvals', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create CTW OLQ cadet approval:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<CtwOlqCadetApproval>): Promise<CtwOlqCadetApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleApprovalApiResponse>(`/ctw-olq-cadet-approvals/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update CTW OLQ cadet approval ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-olq-cadet-approvals/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW OLQ cadet approval ${id}:`, error);
      return false;
    }
  },
};

export default ctwOlqCadetApprovalService;
