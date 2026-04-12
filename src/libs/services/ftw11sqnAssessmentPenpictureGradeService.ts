/**
 * ATW Assessment Pen Picture Grade Service
 * API calls for grade management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11SqnAssessmentPenpictureGrade } from "@/libs/types/system";

interface GradeQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface GradePaginatedResponse {
  data: Ftw11SqnAssessmentPenpictureGrade[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface GradeApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentPenpictureGrade[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleGradeApiResponse {
  success: boolean;
  message: string;
  data: Ftw11SqnAssessmentPenpictureGrade;
}

interface GradeActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11SqnAssessmentPenpictureGrade;
}

interface GradeCreateData {
  course_id: number;
  grade_name: string;
  grade_code: string;
  is_active?: boolean;
  semesters?: number[];
}

export const ftw11sqnAssessmentPenpictureGradeService = {
  /**
   * Get all grades with pagination
   */
  async getAllGrades(params?: GradeQueryParams): Promise<GradePaginatedResponse> {
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

      const endpoint = `/ftw11sqn-assessment-penpicture-grades${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<GradeApiResponse>(endpoint, token);

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
      console.error('Failed to fetch grades:', error);
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
   * Get active grades
   */
  async getActiveGrades(params?: { course_id?: number; semester_id?: number }): Promise<Ftw11SqnAssessmentPenpictureGrade[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ftw11sqn-assessment-penpicture-grades/active${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<GradeApiResponse>(endpoint, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch active grades:', error);
      return [];
    }
  },

  /**
   * Get single grade
   */
  async getGrade(id: number): Promise<Ftw11SqnAssessmentPenpictureGrade | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleGradeApiResponse>(`/ftw11sqn-assessment-penpicture-grades/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch grade ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new grade
   */
  async createGrade(data: GradeCreateData): Promise<Ftw11SqnAssessmentPenpictureGrade | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<GradeActionApiResponse>('/ftw11sqn-assessment-penpicture-grades', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create grade');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create grade:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update grade
   */
  async updateGrade(id: number, data: Partial<GradeCreateData>): Promise<Ftw11SqnAssessmentPenpictureGrade | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<GradeActionApiResponse>(`/ftw11sqn-assessment-penpicture-grades/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update grade');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update grade ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete grade
   */
  async deleteGrade(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<GradeActionApiResponse>(`/ftw11sqn-assessment-penpicture-grades/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete grade ${id}:`, error);
      return false;
    }
  },

  /**
   * Get semesters associated with a grade
   */
  async getSemesters(id: number): Promise<any[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<any>(`/ftw11sqn-assessment-penpicture-grades/${id}/semesters`, token);
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch semesters for grade ${id}:`, error);
      return [];
    }
  },

  /**
   * Add a semester to a grade
   */
  async addSemester(id: number, semesterId: number): Promise<any> {
    try {
      const token = getToken();
      const result = await apiClient.post<any>(`/ftw11sqn-assessment-penpicture-grades/${id}/semesters`, { semester_id: semesterId }, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to add semester to grade ${id}:`, error);
      throw error;
    }
  },

  /**
   * Remove a semester from a grade
   */
  async removeSemester(id: number, semesterId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<any>(`/ftw11sqn-assessment-penpicture-grades/${id}/semesters/${semesterId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to remove semester from grade ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnAssessmentPenpictureGradeService;
