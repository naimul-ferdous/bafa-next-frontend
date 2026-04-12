import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { Ftw12SqnCounselingCadetApproval } from '@/libs/types/ftw12sqnCounselingCadetApproval';

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
  data: Ftw12SqnCounselingCadetApproval[];
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
  data: Ftw12SqnCounselingCadetApproval[];
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
  data: Ftw12SqnCounselingCadetApproval;
}

export const ftw12sqnCounselingCadetApprovalService = {
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

      const endpoint = `/ftw12sqn-counseling-cadet-approvals${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch Counseling cadet approvals:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<Ftw12SqnCounselingCadetApproval>): Promise<Ftw12SqnCounselingCadetApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleApprovalApiResponse>('/ftw12sqn-counseling-cadet-approvals', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create Counseling cadet approval:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<Ftw12SqnCounselingCadetApproval>): Promise<Ftw12SqnCounselingCadetApproval | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleApprovalApiResponse>(`/ftw12sqn-counseling-cadet-approvals/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update Counseling cadet approval ${id}:`, error);
      throw error;
    }
  },

  bulkApprove: async (payload: {
    authority_id: number;
    status: 'approved' | 'rejected';
    approved_by?: number;
    approved_date?: string;
    rejection_reason?: string;
    cadets: { cadet_id: number; course_id?: number; semester_id?: number; program_id?: number; branch_id?: number }[];
  }): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.post<{ success: boolean; message: string }>(
        '/ftw12sqn-counseling-cadet-approvals/bulk',
        payload,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk approve/reject:', error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ftw12sqn-counseling-cadet-approvals/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete Counseling cadet approval ${id}:`, error);
      return false;
    }
  },
};

export default ftw12sqnCounselingCadetApprovalService;
