/**
 * ATW Approval Service
 * API calls for ATW result approval management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import { AtwResultApprovalAuthority, AtwApprovalActionData } from '@/libs/types/atwApproval';

interface AuthorityQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  allData?: boolean;
  is_active?: boolean;
}

interface AuthorityPaginatedResponse {
  data: AtwResultApprovalAuthority[];
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
  data: AtwResultApprovalAuthority[];
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
  data: AtwResultApprovalAuthority;
}

export const atwApprovalService = {
  /**
   * Get all approval authorities
   */
  getAuthorities: async (params?: AuthorityQueryParams): Promise<AuthorityPaginatedResponse> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.allData) query.append('allData', '1');
      if (params?.is_active !== undefined) query.append('is_active', params.is_active ? '1' : '0');

      const endpoint = `/atw-approvals/authorities${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch authorities:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Store a new authority
   */
  storeAuthority: async (data: any): Promise<AtwResultApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.post<SingleAuthorityApiResponse>('/atw-approvals/authorities', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to store authority:', error);
      throw error;
    }
  },

  /**
   * Update an existing authority
   */
  updateAuthority: async (id: number, data: any): Promise<AtwResultApprovalAuthority | null> => {
    try {
      const token = getToken();
      const result = await apiClient.put<SingleAuthorityApiResponse>(`/atw-approvals/authorities/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update authority ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an authority
   */
  deleteAuthority: async (id: number): Promise<boolean> => {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }> (`/atw-approvals/authorities/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete authority ${id}:`, error);
      return false;
    }
  },

  // Approval Actions
  approveCadets: async (data: AtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/atw-approvals/approve-cadets', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve cadets:', error);
      throw error;
    }
  },

  approveProgram: async (data: AtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/atw-approvals/approve-program', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve program:', error);
      throw error;
    }
  },

  initSubjectApproval: async (data: { course_id: number; semester_id: number; program_id: number; branch_id: number; subject_id: number }) => {
    try {
      const token = getToken();
      return await apiClient.post('/atw-approvals/init-subject-approval', data, token);
    } catch (error) {
      console.error('Failed to initialize subject approval:', error);
      throw error;
    }
  },

  approveSubject: async (data: AtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/atw-approvals/approve-subject', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve subject:', error);
      throw error;
    }
  },

  approveSemester: async (data: AtwApprovalActionData) => {
    try {
      const token = getToken();
      const result = await apiClient.post('/atw-approvals/approve-semester', data, token);
      return result;
    } catch (error) {
      console.error('Failed to approve semester:', error);
      throw error;
    }
  },

  getRejectedCadetPanel: async (params?: { course_id?: number; semester_id?: number; program_id?: number; subject_id?: number }): Promise<any[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.course_id)   query.append('course_id',   String(params.course_id));
      if (params?.semester_id) query.append('semester_id', String(params.semester_id));
      if (params?.program_id)  query.append('program_id',  String(params.program_id));
      if (params?.subject_id)  query.append('subject_id',  String(params.subject_id));
      const endpoint = `/atw-approvals/rejected-cadet-panel${query.toString() ? `?${query}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch rejected cadet panel:', error);
      return [];
    }
  },

  resubmitRejectedCadet: async (data: { course_id: number; semester_id: number; program_id: number; cadet_id: number; subject_id: number }) => {
    try {
      const token = getToken();
      return await apiClient.post('/atw-approvals/resubmit-rejected-cadet', data, token);
    } catch (error) {
      console.error('Failed to resubmit rejected cadet:', error);
      throw error;
    }
  },
};

export default atwApprovalService;