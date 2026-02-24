/**
 * Approval Authority Service
 * API calls for approval authority management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  ApprovalAuthority,
  ApprovalAuthorityCreateData,
  ApprovalAuthorityQueryParams,
  ApprovalAuthorityPaginatedResponse,
  ApprovalHierarchy,
} from '@/libs/types/approval';

interface ApprovalAuthorityApiResponse {
  success: boolean;
  message: string;
  data: ApprovalAuthority[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SingleApprovalAuthorityApiResponse {
  success: boolean;
  message: string;
  data: ApprovalAuthority;
}

interface ApprovalAuthorityActionApiResponse {
  success: boolean;
  message: string;
  data?: ApprovalAuthority | null;
}

interface ApprovalHierarchyApiResponse {
  success: boolean;
  message: string;
  data: ApprovalHierarchy;
}

interface ApprovalAuthorityListApiResponse {
  success: boolean;
  message: string;
  data: ApprovalAuthority[];
}

export const approvalAuthorityService = {
  /**
   * Get all approval authorities with pagination
   */
  async getAllAuthorities(params?: ApprovalAuthorityQueryParams): Promise<ApprovalAuthorityPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.is_active !== undefined) {
        query.append('is_active', params.is_active ? '1' : '0');
      }

      if (params?.role_id) {
        query.append('role_id', params.role_id.toString());
      }

      const endpoint = `/approval-authorities${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<ApprovalAuthorityApiResponse>(endpoint, token);

      if (!result) {
        return {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        };
      }

      return {
        data: result.data || [],
        current_page: result.pagination?.current_page || 1,
        per_page: result.pagination?.per_page || 10,
        total: result.pagination?.total || 0,
        last_page: result.pagination?.last_page || 1,
        from: result.pagination?.from || 0,
        to: result.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch approval authorities:', error);
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      };
    }
  },

  /**
   * Get active authorities list (for dropdowns)
   */
  async getActiveList(): Promise<ApprovalAuthority[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApprovalAuthorityListApiResponse>('/approval-authorities/list', token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch active approval authorities:', error);
      return [];
    }
  },

  /**
   * Get approval hierarchy (step-by-step visualization)
   */
  async getHierarchy(): Promise<ApprovalHierarchy | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApprovalHierarchyApiResponse>('/approval-authorities/hierarchy', token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error('Failed to fetch approval hierarchy:', error);
      return null;
    }
  },

  /**
   * Get single approval authority
   */
  async getAuthority(id: number): Promise<ApprovalAuthority | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApprovalAuthorityApiResponse>(`/approval-authorities/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch approval authority ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new approval authority
   */
  async createAuthority(data: ApprovalAuthorityCreateData): Promise<ApprovalAuthority | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<ApprovalAuthorityActionApiResponse>('/approval-authorities', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create approval authority');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create approval authority:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update approval authority
   */
  async updateAuthority(id: number, data: Partial<ApprovalAuthorityCreateData>): Promise<ApprovalAuthority | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<ApprovalAuthorityActionApiResponse>(`/approval-authorities/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update approval authority');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update approval authority ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete approval authority
   */
  async deleteAuthority(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ApprovalAuthorityActionApiResponse>(`/approval-authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete approval authority ${id}:`, error);
      return false;
    }
  },
};

export default approvalAuthorityService;
