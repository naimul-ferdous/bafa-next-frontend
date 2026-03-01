/**
 * ATW Assessment Pen Picture Result Service
 * API calls for result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwAssessmentPenpictureResult } from "@/libs/types/system";

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  cadet_id?: number;
  instructor_id?: number;
}

interface ResultPaginatedResponse {
  data: AtwAssessmentPenpictureResult[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ResultApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentPenpictureResult[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleResultApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentPenpictureResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentPenpictureResult;
}

interface ResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  instructor_id: number;
  cadet_id: number;
  atw_assessment_penpicture_grade_id: number;
  pen_picture?: string;
  course_performance?: string;
  strengths?: { strength: string; is_active?: boolean }[];
  weaknesses?: { weakness: string; is_active?: boolean }[];
}

export const atwAssessmentPenpictureResultService = {
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

      if (params?.course_id) {
        query.append('course_id', params.course_id.toString());
      }

      if (params?.semester_id) {
        query.append('semester_id', params.semester_id.toString());
      }

      if (params?.cadet_id) {
        query.append('cadet_id', params.cadet_id.toString());
      }

      if (params?.instructor_id) {
        query.append('instructor_id', params.instructor_id.toString());
      }

      const endpoint = `/atw-assessment-penpicture-results${query.toString() ? `?${query.toString()}` : ''}`;

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
   * Get results by course
   */
  async getResultsByCourse(courseId: number): Promise<AtwAssessmentPenpictureResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(`/atw-assessment-penpicture-results/course/${courseId}`, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch results by course:', error);
      return [];
    }
  },

  /**
   * Get results by cadet
   */
  async getResultsByCadet(cadetId: number): Promise<AtwAssessmentPenpictureResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(`/atw-assessment-penpicture-results/cadet/${cadetId}`, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch results by cadet:', error);
      return [];
    }
  },

  /**
   * Get results by instructor
   */
  async getResultsByInstructor(instructorId: number): Promise<AtwAssessmentPenpictureResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(`/atw-assessment-penpicture-results/instructor/${instructorId}`, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch results by instructor:', error);
      return [];
    }
  },

  /**
   * Get single result
   */
  async getResult(id: number): Promise<AtwAssessmentPenpictureResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/atw-assessment-penpicture-results/${id}`, token);

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
  async createResult(data: ResultCreateData): Promise<AtwAssessmentPenpictureResult | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<ResultActionApiResponse>('/atw-assessment-penpicture-results', data, token);

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
  async updateResult(id: number, data: Partial<ResultCreateData>): Promise<AtwAssessmentPenpictureResult | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<ResultActionApiResponse>(`/atw-assessment-penpicture-results/${id}`, data, token);

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
      const result = await apiClient.delete<ResultActionApiResponse>(`/atw-assessment-penpicture-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  /**
   * Get results grouped by semester with pagination
   */
  async getGroupedResults(params?: { instructor_id?: number; page?: number; per_page?: number; search?: string }): Promise<ResultPaginatedResponse & { data: any[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/atw-assessment-penpicture-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

      return {
        data: result?.data || [],
        current_page: result?.pagination?.current_page || 1,
        per_page: result?.pagination?.per_page || 10,
        total: result?.pagination?.total || 0,
        last_page: result?.pagination?.last_page || 1,
        from: result?.pagination?.from || 0,
        to: result?.pagination?.to || 0,
      };
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },
};

export default atwAssessmentPenpictureResultService;
