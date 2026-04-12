/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CTW Approval Service
 * API calls for CTW result approval management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { CtwResultApprovalAuthority, CtwApprovalActionData } from '@/libs/types/ctwApproval';

interface AuthorityQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  allData?: boolean;
  is_active?: boolean;
}

interface AuthorityPaginatedResponse {
  data: CtwResultApprovalAuthority[];
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
  data: CtwResultApprovalAuthority[];
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
  data: CtwResultApprovalAuthority;
}

export const ctwApprovalService = {
  // ==================== AUTHORITIES CRUD ====================

  getAuthorities: async (params?: AuthorityQueryParams): Promise<AuthorityPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.allData) query.append('allData', '1');
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/ctw-approvals/authorities${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<AuthorityApiResponse>(endpoint, token);

      if (!result) {
        return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
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
      console.error('Failed to fetch CTW authorities:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  storeAuthority: async (data: any): Promise<CtwResultApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAuthorityApiResponse>('/ctw-approvals/authorities', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to store CTW authority:', error);
      throw error;
    }
  },

  updateAuthority: async (id: number, data: any): Promise<CtwResultApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAuthorityApiResponse>(`/ctw-approvals/authorities/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update CTW authority ${id}:`, error);
      throw error;
    }
  },

  deleteAuthority: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/ctw-approvals/authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW authority ${id}:`, error);
      return false;
    }
  },

  // ==================== APPROVAL ACTIONS ====================

  approveCadets: async (data: CtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/ctw-approvals/approve-cadets', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve CTW cadets:', error);
      throw error;
    }
  },

  initModuleApproval: async (data: { course_id: number; semester_id: number; module_id: number }) => {
    try {
      const token = getToken();
      return await apiClient.post('/ctw-approvals/init-module-approval', data, token);
    } catch (error) {
      console.error('Failed to initialize CTW module approval:', error);
      throw error;
    }
  },

  approveModule: async (data: CtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/ctw-approvals/approve-module', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve CTW module:', error);
      throw error;
    }
  },

  approveSemester: async (data: CtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/ctw-approvals/approve-semester', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve CTW semester:', error);
      throw error;
    }
  },

  forwardModule: async (data: { course_id: number; semester_id: number; module_id: number; ctw_result_id?: number; authority_ids?: number[] }) => {
    try {
      const token = getToken();
      return await apiClient.post('/ctw-approvals/forward-module', data, token);
    } catch (error) {
      console.error('Failed to forward CTW module:', error);
      throw error;
    }
  },

  forwardSemester: async (data: { course_id: number; semester_id: number; authority_ids?: number[] }) => {
    try {
      const token = getToken();
      return await apiClient.post('/ctw-approvals/forward-semester', data, token);
    } catch (error) {
      console.error('Failed to forward CTW semester:', error);
      throw error;
    }
  },

  getRejectedCadetPanel: async (params?: { course_id?: number; semester_id?: number; module_id?: number }): Promise<any[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', String(params.course_id));
      if (params?.semester_id) query.append('semester_id', String(params.semester_id));
      if (params?.module_id) query.append('module_id', String(params.module_id));
      const endpoint = `/ctw-approvals/rejected-cadet-panel${query.toString() ? `?${query}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch CTW rejected cadet panel:', error);
      return [];
    }
  },

  resubmitRejectedCadet: async (data: { course_id: number; semester_id: number; module_id: number; cadet_id: number }) => {
    try {
      const token = getToken();
      return await apiClient.post('/ctw-approvals/resubmit-rejected-cadet', data, token);
    } catch (error) {
      console.error('Failed to resubmit CTW rejected cadet:', error);
      throw error;
    }
  },

  // ==================== VIEW DATA ====================

  getModuleWiseBySemester: async (params: { course_id: number; semester_id: number }) => {
    try {
      const token = getToken();
      const result = await apiClient.get<any>(`/ctw-approvals/module-wise?course_id=${params.course_id}&semester_id=${params.semester_id}`, token);
      return result;
    } catch (error) {
      console.error('Failed to fetch CTW module-wise data:', error);
      throw error;
    }
  },

  getSemesterWiseResults: async (params?: { course_id?: number }) => {
    try {
      const token = getToken();
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', String(params.course_id));
      const endpoint = `/ctw-approvals/semester-wise${query.toString() ? `?${query}` : ''}`;
      const result = await apiClient.get<any>(endpoint, token);
      return result;
    } catch (error) {
      console.error('Failed to fetch CTW semester-wise results:', error);
      throw error;
    }
  },
};

export default ctwApprovalService;
