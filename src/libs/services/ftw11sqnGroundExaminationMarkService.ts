/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11sqn Ground Examination Mark Service
 * API calls for FTW 11sqn Ground Examination Mark management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw11sqnGroundExaminationMark,
  Ftw11sqnGroundExaminationMarkCreateData,
  CourseGroupedData
} from '@/libs/types/ftw11sqnExamination';

interface QueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  cadet_id?: number;
  instructor_id?: number;
  exam_type_id?: number;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: Ftw11sqnGroundExaminationMark[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnGroundExaminationMark[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleApiResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnGroundExaminationMark;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnGroundExaminationMark | Ftw11sqnGroundExaminationMark[];
}

interface GroupedApiResponse {
  success: boolean;
  message: string;
  data: CourseGroupedData[];
}

export const ftw11sqnGroundExaminationMarkService = {
  /**
   * Get all marks with pagination and filters
   */
  async getAllMarks(params?: QueryParams): Promise<PaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.cadet_id) query.append('cadet_id', params.cadet_id.toString());
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-ground-examination-marks${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);

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
      console.error('Failed to fetch Ground examination marks:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single mark by ID
   */
  async getMark(id: number): Promise<Ftw11sqnGroundExaminationMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-ground-examination-marks/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch Ground examination mark ${id}:`, error);
      return null;
    }
  },

  /**
   * Create single or bulk marks (auto-detects based on data structure)
   */
  async createMark(data: any): Promise<Ftw11sqnGroundExaminationMark | Ftw11sqnGroundExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-ground-examination-marks', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create examination mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create Ground examination mark:', error);
      throw error;
    }
  },

  /**
   * Explicit bulk create
   */
  async createBulkMark(data: any): Promise<Ftw11sqnGroundExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-ground-examination-marks/bulk', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create examination marks');
      return (result.data as Ftw11sqnGroundExaminationMark[]) || null;
    } catch (error) {
      console.error('Failed to create bulk Ground examination marks:', error);
      throw error;
    }
  },

  /**
   * Update single mark
   */
  async updateMark(id: number, data: Partial<Ftw11sqnGroundExaminationMarkCreateData>): Promise<Ftw11sqnGroundExaminationMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-ground-examination-marks/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update examination mark');
      return (result.data as Ftw11sqnGroundExaminationMark) || null;
    } catch (error) {
      console.error(`Failed to update Ground examination mark ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk update marks
   */
  async updateBulkMarks(data: { marks: Array<{ id: number; [key: string]: any }> }): Promise<Ftw11sqnGroundExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-ground-examination-marks/bulk`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update examination marks');
      return (result.data as Ftw11sqnGroundExaminationMark[]) || null;
    } catch (error) {
      console.error('Failed to bulk update Ground examination marks:', error);
      throw error;
    }
  },

  /**
   * Delete mark
   */
  async deleteMark(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-ground-examination-marks/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete Ground examination mark ${id}:`, error);
      return false;
    }
  },

  /**
   * Get marks by semester with optional filters
   */
  async getMarksBySemester(params: {
    semesterId?: number;
    page?: number;
    per_page?: number;
    course_id?: number;
    exam_type_id?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse> {
    try {
      // If semesterId is provided, use the dedicated endpoint
      if (params.semesterId) {
        const query = new URLSearchParams();
        if (params.course_id) query.append('course_id', params.course_id.toString());
        if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
        if (params.is_active !== undefined) query.append('is_active', params.is_active.toString());

        const endpoint = `/ftw-11sqn-ground-examination-marks/semester/${params.semesterId}${query.toString() ? `?${query.toString()}` : ''}`;
        const token = getToken();
        const result = await apiClient.get<ApiResponse>(endpoint, token);
        
        // This endpoint returns array directly, not paginated
        return {
          data: result?.data || [],
          current_page: 1,
          per_page: result?.data?.length || 0,
          total: result?.data?.length || 0,
          last_page: 1,
          from: 1,
          to: result?.data?.length || 0,
        };
      }

      // Otherwise use the general getAllMarks with semester filter
      return await this.getAllMarks({
        page: params.page,
        per_page: params.per_page,
        semester_id: params.semesterId,
        course_id: params.course_id,
        exam_type_id: params.exam_type_id,
        is_active: params.is_active,
      });
    } catch (error) {
      console.error('Failed to fetch marks by semester:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get marks by cadet with optional filters
   */
  async getMarksByCadet(params: {
    cadetId: number;
    semester_id?: number;
    exam_type_id?: number;
  }): Promise<Ftw11sqnGroundExaminationMark[]> {
    try {
      const query = new URLSearchParams();
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ftw-11sqn-ground-examination-marks/cadet/${params.cadetId}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch marks by cadet:', error);
      return [];
    }
  },

  /**
   * Get semester-wise grouped data
   */
  async getSemesterGrouped(params?: {
    course_id?: number;
    semester_id?: number;
    exam_type_id?: number;
    is_active?: boolean;
  }): Promise<CourseGroupedData[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-ground-examination-marks/grouped/semester${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<GroupedApiResponse>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semester-wise grouped marks:', error);
      return [];
    }
  },
};

export default ftw11sqnGroundExaminationMarkService;