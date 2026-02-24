/**
 * FTW 12SQN Result Submission Service
 * API calls for result submission and approval workflow
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  ResultSubmission,
  ResultSubmissionCreateData,
  ResultSubmissionQueryParams,
  ResultSubmissionPaginatedResponse,
  ApprovalLogEntry,
  LevelStatusResponse,
  CadetForReview,
} from '@/libs/types/approval';

interface SubmissionApiResponse {
  success: boolean;
  message: string;
  data: ResultSubmission[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SingleSubmissionApiResponse {
  success: boolean;
  message: string;
  data: ResultSubmission;
  approval_steps?: unknown[];
}

interface SubmissionActionApiResponse {
  success: boolean;
  message: string;
  data?: ResultSubmission | null;
}

interface CadetsForReviewApiResponse {
  success: boolean;
  message: string;
  data: {
    submission_id: number;
    current_level: number;
    authority: string;
    cadets: CadetForReview[];
  };
}

interface ApprovalLogsApiResponse {
  success: boolean;
  message: string;
  data: ApprovalLogEntry[];
}

interface LevelStatusApiResponse {
  success: boolean;
  message: string;
  data: LevelStatusResponse;
}

interface CadetActionApiResponse {
  success: boolean;
  message: string;
  data: {
    cadet_approval_id: number;
    status: string;
    submission_counts?: {
      approved: number;
      rejected: number;
      pending: number;
    };
  };
}

export const ftw12sqnResultSubmissionService = {
  /**
   * Get all submissions with pagination
   */
  async getAllSubmissions(params?: ResultSubmissionQueryParams): Promise<ResultSubmissionPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.current_approval_level !== undefined) {
        query.append('current_approval_level', params.current_approval_level.toString());
      }

      const endpoint = `/ftw-12sqn-result-submissions${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<SubmissionApiResponse>(endpoint, token);

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
      console.error('Failed to fetch submissions:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get submissions pending for current user's approval
   */
  async getPendingForMe(params?: { page?: number; per_page?: number }): Promise<ResultSubmissionPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());

      const endpoint = `/ftw-12sqn-result-submissions/pending-for-me${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<SubmissionApiResponse>(endpoint, token);

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
      console.error('Failed to fetch pending submissions:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single submission with full details
   */
  async getSubmission(id: number): Promise<ResultSubmission | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSubmissionApiResponse>(`/ftw-12sqn-result-submissions/${id}`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch submission ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new submission batch
   */
  async createSubmission(data: ResultSubmissionCreateData): Promise<ResultSubmission | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SubmissionActionApiResponse>('/ftw-12sqn-result-submissions', data, token);
      if (!result?.success) throw new Error(result?.message || 'Failed to create submission');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create submission:', error);
      throw error;
    }
  },

  /**
   * Submit for approval
   */
  async submitForApproval(id: number): Promise<ResultSubmission | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SubmissionActionApiResponse>(`/ftw-12sqn-result-submissions/${id}/submit`, {}, token);
      if (!result?.success) throw new Error(result?.message || 'Failed to submit');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to submit submission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get cadets for review
   */
  async getCadetsForReview(id: number): Promise<CadetsForReviewApiResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetsForReviewApiResponse>(`/ftw-12sqn-result-submissions/${id}/cadets`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch cadets for review ${id}:`, error);
      return null;
    }
  },

  /**
   * Approve individual cadet
   */
  async approveCadet(submissionId: number, cadetApprovalId: number, remarks?: string): Promise<CadetActionApiResponse['data'] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<CadetActionApiResponse>(
        `/ftw-12sqn-result-submissions/${submissionId}/cadets/${cadetApprovalId}/approve`,
        { remarks },
        token
      );
      if (!result?.success) throw new Error(result?.message || 'Failed to approve cadet');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to approve cadet:`, error);
      throw error;
    }
  },

  /**
   * Reject individual cadet
   */
  async rejectCadet(submissionId: number, cadetApprovalId: number, rejectionReason: string, remarks?: string): Promise<CadetActionApiResponse['data'] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<CadetActionApiResponse>(
        `/ftw-12sqn-result-submissions/${submissionId}/cadets/${cadetApprovalId}/reject`,
        { rejection_reason: rejectionReason, remarks },
        token
      );
      if (!result?.success) throw new Error(result?.message || 'Failed to reject cadet');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to reject cadet:`, error);
      throw error;
    }
  },

  /**
   * Forward to next level
   */
  async forward(id: number, remarks?: string): Promise<ResultSubmission | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SubmissionActionApiResponse>(
        `/ftw-12sqn-result-submissions/${id}/forward`,
        { remarks },
        token
      );
      if (!result?.success) throw new Error(result?.message || 'Failed to forward');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to forward submission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get approval logs
   */
  async getLogs(id: number): Promise<ApprovalLogEntry[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApprovalLogsApiResponse>(`/ftw-12sqn-result-submissions/${id}/logs`, token);
      return result?.success ? result.data : [];
    } catch (error) {
      console.error(`Failed to fetch logs for submission ${id}:`, error);
      return [];
    }
  },

  /**
   * Get level status
   */
  async getLevelStatus(id: number): Promise<LevelStatusResponse | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<LevelStatusApiResponse>(`/ftw-12sqn-result-submissions/${id}/level-status`, token);
      return result?.success ? result.data : null;
    } catch (error) {
      console.error(`Failed to fetch level status for submission ${id}:`, error);
      return null;
    }
  },
};

export default ftw12sqnResultSubmissionService;
