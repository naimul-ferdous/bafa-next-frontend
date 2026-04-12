/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FTW 12SQN Flying Examination Mark Service
 * API calls for FTW 12SQN Flying Examination Mark management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  Ftw12sqnFlyingExaminationMark,
  Ftw12sqnFlyingExaminationMarkCreateData
} from '@/libs/types/ftw12sqnExamination';

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
  data: Ftw12sqnFlyingExaminationMark[];
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
  data: Ftw12sqnFlyingExaminationMark[];
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
  data: Ftw12sqnFlyingExaminationMark;
}

interface ActionApiResponse {
  success: boolean;
  message: string;
  data?: Ftw12sqnFlyingExaminationMark | Ftw12sqnFlyingExaminationMark[];
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

export const ftw12sqnFlyingExaminationMarkService = {
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

      const endpoint = `/ftw-12sqn-flying-examination-marks${query.toString() ? `?${query.toString()}` : ''}`;
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
  async getMark(id: number): Promise<Ftw12sqnFlyingExaminationMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleApiResponse>(`/ftw-12sqn-flying-examination-marks/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch flying examination mark ${id}:`, error);
      return null;
    }
  },

  /**
   * Create single or bulk marks (auto-detects based on data structure)
   */
  async createMark(data: any): Promise<Ftw12sqnFlyingExaminationMark | Ftw12sqnFlyingExaminationMark[] | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<ActionApiResponse>('/ftw-12sqn-flying-examination-marks', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create examination mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create flying examination mark:', error);
      throw error;
    }
  },

  /**
   * Create bulk marks explicitly
   */
  async createBulkMark(data: { marks: any[] }): Promise<Ftw12sqnFlyingExaminationMark[]> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<any>('/ftw-12sqn-flying-examination-marks/bulk', data, token);
      if (!result || result.status === 422 || result.status === 500) throw new Error(result?.error || result?.message || 'Failed to create bulk marks');
      return (result.data as Ftw12sqnFlyingExaminationMark[]) || [];
    } catch (error) {
      console.error('Failed to create bulk marks:', error);
      throw error;
    }
  },

  /**
   * Update a mark by ID
   */
  async updateMark(id: number, data: Partial<Ftw12sqnFlyingExaminationMark>): Promise<Ftw12sqnFlyingExaminationMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<any>(`/ftw-12sqn-flying-examination-marks/${id}`, data, token);
      if (!result || result.status === 422 || result.status === 500) throw new Error(result?.error || result?.message || 'Failed to update mark');
      return (result.data as Ftw12sqnFlyingExaminationMark) || null;
    } catch (error) {
      console.error('Failed to update flying examination mark:', error);
      throw error;
    }
  },

  /**
   * Delete a mark by ID
   */
  async deleteMark(id: number): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.delete<any>(`/ftw-12sqn-flying-examination-marks/${id}`, token);
      if (!result || result.status === 422 || result.status === 500) throw new Error(result?.error || result?.message || 'Failed to delete mark');
      return true;
    } catch (error) {
      console.error('Failed to delete flying examination mark:', error);
      throw error;
    }
  },

  /**
   * Get all panel data for semester result page in one call
   */
  async getPanelData(params: { course_id: number; semester_id: number }): Promise<{
    flying_marks: any[];
    ground_marks: any[];
    approval_processes: any[];
    approval_statuses: any[];
    cadet_approval_statuses: any[];
  } | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const query = new URLSearchParams();
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());
      
      const result = await apiClient.get<any>(`/ftw-12sqn-flying-examination-marks/panel-data?${query.toString()}`, token);
      if (!result?.success) throw new Error(result?.message || 'Failed to fetch panel data');
      return result.data;
    } catch (error) {
      console.error('Failed to fetch panel data:', error);
      throw error;
    }
  },

  /**
   * Get all report data (final, bup, breakdown) with calculations done in backend
   */
  async getReportData(params: { course_id: number; semester_id: number }): Promise<{
    semester_details: any;
    course_details: any;
    is_6th_semester: boolean;
    exam_phases: any[];
    final: any[];
    bup: any[];
    breakdown: {
      flying_marks: any[];
      ground_marks: any[];
      approval_processes: any[];
      approval_statuses: any[];
      cadet_approval_statuses: any[];
    };
    ground_phases: any[];
    flying_exam_phases: any[];
  } | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const query = new URLSearchParams();
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());
      
      const result = await apiClient.get<any>(`/ftw-12sqn-flying-examination-marks/semester/${params.semester_id}/report-data?${query.toString()}`, token);
      return result?.data;
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      throw error;
    }
  },

  /**
   * Check if mark exists for a cadet
   */
  async checkExistingMark(data: {
    ftw_12sqn_flying_syllabus_id: number;
    ftw_12sqn_flying_syllabus_exercise_id: number;
    cadet_id: number;
  }): Promise<{ exists: boolean; mark?: any }> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.get<any>(
        `/ftw-12sqn-flying-examination-marks/check?ftw_12sqn_flying_syllabus_id=${data.ftw_12sqn_flying_syllabus_id}&ftw_12sqn_flying_syllabus_exercise_id=${data.ftw_12sqn_flying_syllabus_exercise_id}&cadet_id=${data.cadet_id}`,
        token
      );
      if (result?.success && result?.data) {
        return { exists: true, mark: result.data };
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

        const endpoint = `/ftw-12sqn-flying-examination-marks/semester/${params.semesterId}${query.toString() ? `?${query.toString()}` : ''}`;
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
  }): Promise<Ftw12sqnFlyingExaminationMark[]> {
    try {
      const query = new URLSearchParams();
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ftw-12sqn-flying-examination-marks/cadet/${params.cadetId}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch marks by cadet:', error);
      return [];
    }
  },

  /**
   * Get marks for a specific cadet - alternative name for getMarksByCadet
   */
  async getCadetMarks(params: {
    cadet_id: number;
    course_id?: number;
    semester_id?: number;
    exam_type_id?: number;
  }): Promise<{ marks: Ftw12sqnFlyingExaminationMark[] }> {
    try {
      const query = new URLSearchParams();
      if (params.course_id) query.append('course_id', params.course_id.toString());
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ftw-12sqn-flying-examination-marks/cadet/${params.cadet_id}${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse>(endpoint, token);
      return { marks: result?.data || [] };
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return { marks: [] };
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
    instructor_id?: number;
    is_active?: boolean;
  }): Promise<SemesterGroupedResponse[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.phase_type_id) query.append('phase_type_id', params.phase_type_id.toString());
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ftw-12sqn-flying-examination-marks/grouped/semester${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; message: string; data: SemesterGroupedResponse[] }>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semester grouped marks:', error);
      return [];
    }
  },

  /**
   * Get all form data in one call - courses, semesters, exams, phases, cadets, instructors, existing marks
   */
  async getFormData(params: {
    instructor_id?: number;
    semester_id?: number;
    course_id?: number;
    cadet_id?: number;
    exam_type_id?: number;
  }): Promise<{
    courses: any[];
    semesters: any[];
    exams: any[];
    phase_types: any[];
    syllabuses: any[];
    instructors: any[];
    cadets: any[];
    instructor_assigned: {
      phases: any[];
      exercises: number[];
      cadets: any[];
    };
    existing_marks: any[];
  } | null> {
    try {
      const query = new URLSearchParams();
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.course_id) query.append('course_id', params.course_id.toString());
      if (params.cadet_id) query.append('cadet_id', params.cadet_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());

      const endpoint = `/ftw-12sqn-flying-result-form${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any }>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      return null;
    }
  },

  /**
   * Create additional mark for flying examination
   */
  async createAdditionalMark(data: {
    ftw_12sqn_flying_syllabus_id: number;
    ftw_12sqn_flying_syllabus_exercise_id: number;
    course_id: number;
    semester_id: number;
    instructor_id: number;
    cadet_id: number;
    exam_type_id?: number;
    phase_type_id: number;
    achieved_mark: string;
    achieved_time: string;
    participate_date: string;
    is_present?: boolean;
    absent_reason?: string;
    remark?: string;
    is_active?: boolean;
  }): Promise<any | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.post<any>('/ftw-12sqn-flying-examination-marks-additional', data, token);
      if (!result) throw new Error('Failed to create additional mark');
      if (result.message && result.message.toLowerCase().includes('success')) {
        return result.data || null;
      }
      if (result.success === false) throw new Error(result?.message || 'Failed to create additional mark');
      return result.data || null;
    } catch (error) {
      console.error('Failed to create additional flying examination mark:', error);
      throw error;
    }
  },

  /**
   * Update additional mark for flying examination
   */
  async updateAdditionalMark(id: number, data: Partial<{
    ftw_12sqn_flying_syllabus_id: number;
    ftw_12sqn_flying_syllabus_exercise_id: number;
    course_id: number;
    semester_id: number;
    instructor_id: number;
    cadet_id: number;
    exam_type_id?: number;
    phase_type_id: number;
    achieved_mark: string;
    achieved_time: string;
    participate_date: string;
    is_present: boolean;
    absent_reason?: string;
    remark?: string;
    is_active: boolean;
  }>): Promise<any | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');
      const result = await apiClient.put<any>(`/ftw-12sqn-flying-examination-marks-additional/${id}`, data, token);
      if (!result) throw new Error('Failed to update additional mark');
      if (result.message && result.message.toLowerCase().includes('success')) {
        return result.data || null;
      }
      if (result.success === false) throw new Error(result?.message || 'Failed to update additional mark');
      return result.data || null;
    } catch (error) {
      console.error(`Failed to update additional flying examination mark ${id}:`, error);
      throw error;
    }
  },
};

export default ftw12sqnFlyingExaminationMarkService;