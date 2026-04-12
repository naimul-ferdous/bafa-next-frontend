import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CtwOlqApprovalAuthority } from '@/libs/types/ctwOlqApprovalAuthority';

interface AuthorityQueryParams {
  page?: number;
  per_page?: number;
  allData?: boolean;
  is_active?: boolean;
}

interface AuthorityPaginatedResponse {
  data: CtwOlqApprovalAuthority[];
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
  data: CtwOlqApprovalAuthority[];
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
  data: CtwOlqApprovalAuthority;
}

export const ctwOlqApprovalAuthorityService = {
  getAuthorities: async (params?: AuthorityQueryParams): Promise<AuthorityPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.allData) query.append('allData', '1');
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/ctw-olq-approval-authorities${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch CTW OLQ approval authorities:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<CtwOlqApprovalAuthority>): Promise<CtwOlqApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAuthorityApiResponse>('/ctw-olq-approval-authorities', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create CTW OLQ approval authority:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<CtwOlqApprovalAuthority>): Promise<CtwOlqApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAuthorityApiResponse>(`/ctw-olq-approval-authorities/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update CTW OLQ approval authority ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-olq-approval-authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW OLQ approval authority ${id}:`, error);
      return false;
    }
  },
};

export default ctwOlqApprovalAuthorityService;
