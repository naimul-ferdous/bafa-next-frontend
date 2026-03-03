import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { AtwPenpictureAuthority } from '@/libs/types/atwPenpictureAuthority';

interface AuthorityQueryParams {
  page?: number;
  per_page?: number;
  allData?: boolean;
  is_active?: boolean;
}

interface AuthorityPaginatedResponse {
  data: AtwPenpictureAuthority[];
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
  data: AtwPenpictureAuthority[];
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
  data: AtwPenpictureAuthority;
}

export const atwPenpictureAuthorityService = {
  getAuthorities: async (params?: AuthorityQueryParams): Promise<AuthorityPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.allData) query.append('allData', '1');
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/atw-penpicture-authorities${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch penpicture authorities:', error);
      return { data: [], current_page: 1, per_page: 15, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  store: async (data: Partial<AtwPenpictureAuthority>): Promise<AtwPenpictureAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAuthorityApiResponse>('/atw-penpicture-authorities', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create penpicture authority:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<AtwPenpictureAuthority>): Promise<AtwPenpictureAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAuthorityApiResponse>(`/atw-penpicture-authorities/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update penpicture authority ${id}:`, error);
      throw error;
    }
  },

  destroy: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-penpicture-authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete penpicture authority ${id}:`, error);
      return false;
    }
  },
};

export default atwPenpictureAuthorityService;
