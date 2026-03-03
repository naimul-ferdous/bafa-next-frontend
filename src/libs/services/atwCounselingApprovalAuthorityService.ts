import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { AtwCounselingApprovalAuthority } from '@/libs/types/atwCounselingApprovalAuthority';

interface AuthorityQueryParams {
  page?: number;
  per_page?: number;
  allData?: boolean;
  is_active?: boolean;
}

interface AuthorityPaginatedResponse {
  data: AtwCounselingApprovalAuthority[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface AuthorityApiResponse {
  success: boolean;
  message: string;
  data: AtwCounselingApprovalAuthority[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleAuthorityApiResponse {
  success: boolean;
  message: string;
  data: AtwCounselingApprovalAuthority;
}

export const atwCounselingApprovalAuthorityService = {
  getAuthorities: async (params?: AuthorityQueryParams): Promise<AuthorityPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.allData) query.append('allData', '1');
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/atw-counseling-approval-authorities${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<AuthorityApiResponse>(endpoint, token);

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
      console.error('Failed to fetch Counseling approval authorities:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<AtwCounselingApprovalAuthority>): Promise<AtwCounselingApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAuthorityApiResponse>('/atw-counseling-approval-authorities', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create Counseling approval authority:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<AtwCounselingApprovalAuthority>): Promise<AtwCounselingApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAuthorityApiResponse>(`/atw-counseling-approval-authorities/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update Counseling approval authority ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-counseling-approval-authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete Counseling approval authority ${id}:`, error);
      return false;
    }
  },
};

export default atwCounselingApprovalAuthorityService;
