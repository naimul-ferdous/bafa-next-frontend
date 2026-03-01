/**
 * ATW Subject Service
 * API calls for ATW subject management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwSubjectModule, AtwSubjectModuleMark } from '@/libs/types/system';

interface SubjectQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface SubjectPaginatedResponse {
  data: AtwSubjectModule[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface SubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectModule[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleSubjectApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectModule;
}

interface SubjectActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwSubjectModule;
}

interface SubjectMarkApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectModuleMark[] | AtwSubjectModuleMark;
}

interface SubjectCreateData {
  subject_name: string;
  subject_code: string;
  subject_legend?: string;
  subject_period?: string;
  subjects_full_mark?: number;
  subjects_credit?: number;
  is_active?: boolean;
  subject_marks?: Array<{
    name: string;
    type?: string;
    percentage?: number;
    estimate_mark?: number;
  }>;
}

interface SubjectMarkCreateData {
  name: string;
  type?: string;
  percentage?: number;
  estimate_mark?: number;
}

export const atwSubjectModuleService = {
  /**
   * Get all subjects with pagination
   */
  async getAllSubjects(params?: SubjectQueryParams): Promise<SubjectPaginatedResponse> {
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

      const endpoint = `/atw-subject-modules${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<SubjectApiResponse>(endpoint, token);

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
      console.error('Failed to fetch subjects:', error);
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
   * Get single subject
   */
  async getSubject(id: number): Promise<AtwSubjectModule | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleSubjectApiResponse>(`/atw-subject-modules/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch subject ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new subject
   */
  async createSubject(data: SubjectCreateData): Promise<AtwSubjectModule | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<SubjectActionApiResponse>('/atw-subject-modules', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create subject');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create subject:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update subject
   */
  async updateSubject(id: number, data: Partial<SubjectCreateData>): Promise<AtwSubjectModule | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<SubjectActionApiResponse>(`/atw-subject-modules/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update subject');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update subject ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete subject
   */
  async deleteSubject(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SubjectActionApiResponse>(`/atw-subject-modules/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete subject ${id}:`, error);
      return false;
    }
  },

  /**
   * Get subject marks
   */
  async getSubjectMarks(subjectId: number): Promise<AtwSubjectModuleMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<SubjectMarkApiResponse>(`/atw-subject-modules/${subjectId}/marks`, token);

      if (!result || !result.success) {
        return [];
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error(`Failed to fetch subject marks for ${subjectId}:`, error);
      return [];
    }
  },

  /**
   * Add subject mark
   */
  async addSubjectMark(subjectId: number, data: SubjectMarkCreateData): Promise<AtwSubjectModuleMark | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<SubjectMarkApiResponse>(`/atw-subject-modules/${subjectId}/marks`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to add subject mark');
      }

      return Array.isArray(result.data) ? null : result.data;
    } catch (error: unknown) {
      console.error('Failed to add subject mark:', error);
      throw error;
    }
  },

  /**
   * Update subject mark
   */
  async updateSubjectMark(subjectId: number, markId: number, data: SubjectMarkCreateData): Promise<AtwSubjectModuleMark | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<SubjectMarkApiResponse>(`/atw-subject-modules/${subjectId}/marks/${markId}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update subject mark');
      }

      return Array.isArray(result.data) ? null : result.data;
    } catch (error: unknown) {
      console.error('Failed to update subject mark:', error);
      throw error;
    }
  },

  /**
   * Delete subject mark
   */
  async deleteSubjectMark(subjectId: number, markId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<SubjectActionApiResponse>(`/atw-subject-modules/${subjectId}/marks/${markId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete subject mark ${markId}:`, error);
      return false;
    }
  },
};

export default atwSubjectModuleService;
