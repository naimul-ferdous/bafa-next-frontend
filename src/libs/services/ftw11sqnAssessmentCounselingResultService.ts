/**
 * CTW Assessment Counseling Result Service
 * API calls for counseling result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11SqnAssessmentCounselingResult } from '@/libs/types/system';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  instructor_id?: number;
}

interface ResultPaginatedResponse {
  data: Ftw11SqnAssessmentCounselingResult[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ResultApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCounselingResult[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

interface SingleResultApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentCounselingResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11SqnAssessmentCounselingResult;
}

interface ResultFormData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number | null;
  instructor_id: number;
  cadet_id: number;
  remarks?: Array<{
    ftw11sqn_assessment_counseling_event_id: number;
    remark: string;
  }>;
}

export const ftw11sqnAssessmentCounselingResultService = {
  /**
   * Get all results with pagination
   */
  async getAllResults(params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.search) {
        query.append('search', params.search);
      }

      if (params?.instructor_id) {
        query.append('instructor_id', params.instructor_id.toString());
      }

      const endpoint = `/ftw11sqn-assessment-counseling-results${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(endpoint, token);

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
      console.error('Failed to fetch results:', error);
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
   * Get single result
   */
  async getResult(id: number): Promise<Ftw11SqnAssessmentCounselingResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/ftw11sqn-assessment-counseling-results/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new result
   */
  async createResult(data: ResultFormData): Promise<Ftw11SqnAssessmentCounselingResult | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<ResultActionApiResponse>('/ftw11sqn-assessment-counseling-results', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create result');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create result:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update result
   */
  async updateResult(id: number, data: Partial<ResultFormData>): Promise<Ftw11SqnAssessmentCounselingResult | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<ResultActionApiResponse>(`/ftw11sqn-assessment-counseling-results/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update result');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update result ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete result
   */
  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/ftw11sqn-assessment-counseling-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  /**
   * Get results grouped by course and semester with pagination
   */
  async getGroupedResults(params?: { instructor_id?: number; authority_id?: number; course_id?: number; semester_id?: number; page?: number; per_page?: number; search?: string; allData?: boolean }): Promise<ResultPaginatedResponse & { data: any[]; semester_approvals: any[]; authorities: any[]; my_authority: any; has_counseling_assign: boolean }> {
    try {
      const query = new URLSearchParams();
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.authority_id) query.append('authority_id', params.authority_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.allData) query.append('allData', 'true');

      const endpoint = `/ftw11sqn-assessment-counseling-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

      return {
        data: result?.data || [],
        current_page: result?.pagination?.current_page || 1,
        last_page: result?.pagination?.last_page || 1,
        per_page: result?.pagination?.per_page || 10,
        total: result?.pagination?.total || 0,
        from: result?.pagination?.from || 0,
        to: result?.pagination?.to || 0,
        semester_approvals: result?.semester_approvals || [],
        authorities: result?.authorities || [],
        my_authority: result?.my_authority || null,
        has_counseling_assign: result?.has_counseling_assign || false,
      };
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, semester_approvals: [], authorities: [], my_authority: null, has_counseling_assign: false };
    }
  },

  /**
   * Get consolidated results for a specific course and semester
   */
  async getConsolidatedResults(params: { course_id: number; semester_id: number }): Promise<{
    results: any[];
    approvals: any[];
    semester_approvals: any[];
    authorities: any[];
    my_authority: any;
    assigned_cadets: any[];
    stats: { total_cadets: number; total_counseled: number; total_approved: number };
  } | null> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());

      const token = getToken();
      const res = await apiClient.get<any>(`/ftw11sqn-assessment-counseling-results/consolidated?${query.toString()}`, token);
      return res?.data || null;
    } catch (error) {
      console.error('Failed to fetch CTW consolidated results:', error);
      return null;
    }
  },

  /**
   * Get options for the counseling form
   */
  async getFormOptions(params?: { course_id?: number; semester_id?: number }): Promise<{
    courses: any[];
    semesters: any[];
    exams: any[];
    counseling_type: any;
    cadets: any[];
    existing_results_map: { [cadetId: number]: number };
  } | null> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const token = getToken();
      const res = await apiClient.get<any>(`/ftw11sqn-assessment-counseling-results/form-options?${query.toString()}`, token);
      return res?.data || null;
    } catch (error) {
      console.error('Failed to fetch CTW counseling form options:', error);
      return null;
    }
  },
};

export default ftw11sqnAssessmentCounselingResultService;
