/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 11SQN Flying Examination Mark Service
 * API calls for FTW 11SQN Flying Examination Mark management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw11sqnFlyingExaminationMark,
  Ftw11sqnFlyingExaminationMarkCreateData
} from '@/libs/types/ftw11sqnExamination';

interface QueryParams {
  page?: number;
  per_page?: number;
  course_id?: number;
  semester_id?: number;
  cadet_id?: number;
  instructor_id?: number;
  exam_type_id?: number;
  phase_type_id?: number;
  is_active?: boolean;
}

interface PaginatedResponse {
  data: Ftw11sqnFlyingExaminationMark[];
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
  data: Ftw11sqnFlyingExaminationMark[];
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
  data: Ftw11sqnFlyingExaminationMark;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw11sqnFlyingExaminationMark | Ftw11sqnFlyingExaminationMark[];
}

// Semester Grouped Response Types
interface SemesterGroupedMark {
  id: number;
  syllabus: {
    id: number | null;
    phase_full_name: string | null;
    phase_shortname: string | null;
  };
  exercise: {
    id: number | null;
    exercise_name: string | null;
    exercise_shortname: string | null;
    max_mark: number | null;
  };
  phase_type: {
    id: number | null;
    type_name: string | null;
  };
  cadet: {
    id: number | null;
    name: string | null;
    bdno: string | null;
  };
  instructor: {
    id: number | null;
    name: string | null;
  };
  exam_type: {
    id: number | null;
    name: string | null;
    code: string | null;
  };
  achieved_mark: string | null;
  achieved_time: string | null;
  participate_date: string | null;
  is_present: boolean;
  absent_reason: string | null;
  remark: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SemesterDetail {
  semester_info: {
    id: number | null;
    name: string | null;
    code: string | null;
    is_active: boolean | null;
  };
  total_marks: number;
  total_cadets: number;
  marks: SemesterGroupedMark[];
}

export interface SemesterGroupedResponse {
  course_details: {
    id: number | null;
    name: string | null;
    code: string | null;
    is_active: boolean | null;
  };
  semester_details: SemesterDetail[];
}

export const ftw11sqnFlyingExaminationMarkService = {
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
      if (params?.phase_type_id) query.append('phase_type_id', params.phase_type_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-flying-examination-marks${query.toString() ? `?${query.toString()}` : ''}`;
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
      console.error('Failed to fetch flying examination marks:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single mark by ID
   */
  async getMark(id: number): Promise<Ftw11sqnFlyingExaminationMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-11sqn-flying-examination-marks/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch flying examination mark ${id}:`, error);
      return null;
    }
  },

  /**
   * Create single or bulk marks (auto-detects based on data structure)
   */
  async createMark(data: any): Promise<Ftw11sqnFlyingExaminationMark | Ftw11sqnFlyingExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-examination-marks', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create examination mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create flying examination mark:', error);
      throw error;
    }
  },

  /**
   * Explicit bulk create
   */
  /**
 * Explicit bulk create
 */
  async createBulkMark(data: any): Promise<Ftw11sqnFlyingExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      
      const result = await apiClient.post<ActionApiResponse>('/ftw-11sqn-flying-examination-marks/bulk', data, token);
      
      // FIX: Don't throw error on success
      if (result && result.message) {
        console.log('✅ Bulk marks created:', result.message);
        return (result.data as Ftw11sqnFlyingExaminationMark[]) || null;
      }
      
      // Only throw if there's an actual error
      if (!result) {
        throw new Error('Failed to create examination marks - no response');
      }
      
      return (result.data as Ftw11sqnFlyingExaminationMark[]) || null;
    } catch (error) {
      console.error('Failed to create bulk flying examination marks:', error);
      throw error;
    }
  },

  /**
   * Update single mark
   */
  async updateMark(id: number, data: Partial<Ftw11sqnFlyingExaminationMarkCreateData>): Promise<Ftw11sqnFlyingExaminationMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-examination-marks/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update examination mark');
      return (result.data as Ftw11sqnFlyingExaminationMark) || null;
    } catch (error) {
      console.error(`Failed to update flying examination mark ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk update marks
   */
  async updateBulkMarks(data: { marks: Array<{ id: number; [key: string]: any }> }): Promise<Ftw11sqnFlyingExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<ActionApiResponse>(`/ftw-11sqn-flying-examination-marks/bulk`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update examination marks');
      return (result.data as Ftw11sqnFlyingExaminationMark[]) || null;
    } catch (error) {
      console.error('Failed to bulk update flying examination marks:', error);
      throw error;
    }
  },

  /**
   * Delete mark
   */
  async deleteMark(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ActionApiResponse>(`/ftw-11sqn-flying-examination-marks/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete flying examination mark ${id}:`, error);
      return false;
    }
  },

  /**
   * Check if a mark already exists for the given combination
   */
  async checkExistingMark(params: {
    cadet_id: number;
    course_id: number;
    semester_id: number;
    exam_type_id: number;
    syllabus_id: number;
    exercise_id: number;
  }): Promise<{ exists: boolean; date?: string; mark?: Ftw11sqnFlyingExaminationMark }> {
    try {
      const query = new URLSearchParams();
      query.append('cadet_id', params.cadet_id.toString());
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());
      query.append('exam_type_id', params.exam_type_id.toString());
      query.append('ftw_11sqn_flying_syllabus_id', params.syllabus_id.toString());
      query.append('ftw_11sqn_flying_syllabus_exercise_id', params.exercise_id.toString());
      query.append('per_page', '1');

      const endpoint = `/ftw-11sqn-flying-examination-marks?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);

      if (result && result.data && result.data.length > 0) {
        const existingMark = result.data[0];
        return {
          exists: true,
          date: existingMark.participate_date || existingMark.created_at,
          mark: existingMark
        };
      }
      return { exists: false };
    } catch (error) {
      console.error('Failed to check existing mark:', error);
      return { exists: false };
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

        const endpoint = `/ftw-11sqn-flying-examination-marks/semester/${params.semesterId}${query.toString() ? `?${query.toString()}` : ''}`;
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
  }): Promise<Ftw11sqnFlyingExaminationMark[]> {
    try {
      const query = new URLSearchParams();
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ftw-11sqn-flying-examination-marks/cadet/${params.cadetId}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch marks by cadet:', error);
      return [];
    }
  },

  /**
   * Get marks grouped by semester
   * Returns data grouped by course -> semester -> marks
   */
  async getSemesterGrouped(params?: {
    course_id?: number;
    semester_id?: number;
    exam_type_id?: number;
    phase_type_id?: number;
    is_active?: boolean;
  }): Promise<SemesterGroupedResponse[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.phase_type_id) query.append('phase_type_id', params.phase_type_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-11sqn-flying-examination-marks/grouped/semester${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; message: string; data: SemesterGroupedResponse[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semester grouped marks:', error);
      return [];
    }
  },
};

export default ftw11sqnFlyingExaminationMarkService;