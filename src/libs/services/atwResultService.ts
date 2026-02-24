/**
 * ATW Result Service
 * API calls for ATW result management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  AtwResult,
  AtwResultGettingCadet,
  AtwResultCadetsMark,
  AtwResultCreateData,
  AtwResultCadetCreateData,
  AtwResultCadetMarkCreateData
} from '@/libs/types/atwResult';

interface ResultQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  instructor_id?: number;
  atw_subject_id?: number;
}

interface ResultPaginatedResponse {
  data: AtwResult[];
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
  data: AtwResult[];
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
  data: AtwResult;
}

interface ResultActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwResult;
}

interface CadetApiResponse {
  success: boolean;
  message: string;
  data: AtwResultGettingCadet[];
}

interface SingleCadetApiResponse {
  success: boolean;
  message: string;
  data: AtwResultGettingCadet;
}

interface MarkApiResponse {
  success: boolean;
  message: string;
  data: AtwResultCadetsMark[];
}

interface SingleMarkApiResponse {
  success: boolean;
  message: string;
  data: AtwResultCadetsMark;
}

export const atwResultService = {
  /**
   * Get all results with pagination
   */
  async getAllResults(params?: ResultQueryParams): Promise<ResultPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.program_id) query.append('program_id', params.program_id.toString());
      if (params?.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params?.group_id) query.append('group_id', params.group_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.atw_subject_id) query.append('atw_subject_id', params.atw_subject_id.toString());

      const endpoint = `/atw-results${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ResultApiResponse>(endpoint, token);

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
      console.error('Failed to fetch results:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Check if a result already exists
   */
  async checkExistence(params: ResultQueryParams): Promise<boolean> {
    try {
      const query = new URLSearchParams();
      if (params.course_id) query.append('course_id', params.course_id.toString());
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.program_id) query.append('program_id', params.program_id.toString());
      if (params.branch_id) query.append('branch_id', params.branch_id.toString());
      if (params.group_id) query.append('group_id', params.group_id.toString());
      else query.append('group_id', 'null'); // Explicitly send null for group_id if not set
      
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.atw_subject_id) query.append('atw_subject_id', params.atw_subject_id.toString());

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: { exists: boolean } }>(`/atw-results/check-existence?${query.toString()}`, token);
      return result?.data?.exists || false;
    } catch (error) {
      console.error('Failed to check existence:', error);
      return false;
    }
  },

  /**
   * Get grouped results for non-instructors
   */
  async getGroupedResults(params?: any): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const endpoint = `/atw-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return [];
    }
  },

  /**
   * Get program-wise grouped results for a specific course and semester
   */
  async getProgramWiseBySemester(courseId: number, semesterId: number): Promise<any> {
    try {
      const token = getToken();
      const result = await apiClient.get<any>(`/atw-results/course/${courseId}/semester/${semesterId}`, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch program-wise results:', error);
      return null;
    }
  },

  /**
   * Get subject-wise grouped results for a specific course, semester and program
   */
  async getSubjectWiseByProgram(courseId: number, semesterId: number, programId: number): Promise<any> {
    try {
      const token = getToken();
      const result = await apiClient.get<any>(`/atw-results/course/${courseId}/semester/${semesterId}/program/${programId}`, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch subject-wise results:', error);
      return null;
    }
  },

  /**
   * Get results by course
   */
  async getResultsByCourse(courseId: number): Promise<AtwResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: AtwResult[] }>(`/atw-results/by-course/${courseId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch results by course:', error);
      return [];
    }
  },

  /**
   * Get results by instructor
   */
  async getResultsByInstructor(instructorId: number): Promise<AtwResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: AtwResult[] }>(`/atw-results/by-instructor/${instructorId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch results by instructor:', error);
      return [];
    }
  },

  /**
   * Get results by subject
   */
  async getResultsBySubject(subjectId: number): Promise<AtwResult[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: AtwResult[] }>(`/atw-results/by-subject/${subjectId}`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch results by subject:', error);
      return [];
    }
  },

  /**
   * Get single result
   */
  async getResult(id: number): Promise<AtwResult | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleResultApiResponse>(`/atw-results/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch result ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new result
   */
  async createResult(data: AtwResultCreateData): Promise<AtwResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ResultActionApiResponse>('/atw-results', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create result');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create result:', error);
      throw error;
    }
  },

  /**
   * Update result
   */
  async updateResult(id: number, data: Partial<AtwResultCreateData>): Promise<AtwResult | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ResultActionApiResponse>(`/atw-results/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update result');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update result ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete result
   */
  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ResultActionApiResponse>(`/atw-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  // ==================== Result Cadets Management ====================

  /**
   * Get result cadets
   */
  async getResultCadets(resultId: number): Promise<AtwResultGettingCadet[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<CadetApiResponse>(`/atw-results/${resultId}/cadets`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch result cadets:', error);
      return [];
    }
  },

  /**
   * Add cadet to result
   */
  async addResultCadet(resultId: number, data: AtwResultCadetCreateData): Promise<AtwResultGettingCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleCadetApiResponse>(`/atw-results/${resultId}/cadets`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add cadet');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add cadet:', error);
      throw error;
    }
  },

  /**
   * Update result cadet
   */
  async updateResultCadet(resultId: number, cadetId: number, data: Partial<AtwResultCadetCreateData>): Promise<AtwResultGettingCadet | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleCadetApiResponse>(`/atw-results/${resultId}/cadets/${cadetId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update cadet');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update cadet:', error);
      throw error;
    }
  },

  /**
   * Delete result cadet
   */
  async deleteResultCadet(resultId: number, cadetId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-results/${resultId}/cadets/${cadetId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete cadet:', error);
      return false;
    }
  },

  // ==================== Cadet Marks Management ====================

  /**
   * Get cadet marks
   */
  async getCadetMarks(resultId: number, cadetId: number): Promise<AtwResultCadetsMark[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<MarkApiResponse>(`/atw-results/${resultId}/cadets/${cadetId}/marks`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch cadet marks:', error);
      return [];
    }
  },

  /**
   * Add cadet mark
   */
  async addCadetMark(resultId: number, cadetId: number, data: AtwResultCadetMarkCreateData): Promise<AtwResultCadetsMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleMarkApiResponse>(`/atw-results/${resultId}/cadets/${cadetId}/marks`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add mark:', error);
      throw error;
    }
  },

  /**
   * Update cadet mark
   */
  async updateCadetMark(resultId: number, cadetId: number, markId: number, data: Partial<AtwResultCadetMarkCreateData>): Promise<AtwResultCadetsMark | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleMarkApiResponse>(`/atw-results/${resultId}/cadets/${cadetId}/marks/${markId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update mark');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update mark:', error);
      throw error;
    }
  },

  /**
   * Delete cadet mark
   */
  async deleteCadetMark(resultId: number, cadetId: number, markId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-results/${resultId}/cadets/${cadetId}/marks/${markId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete mark:', error);
      return false;
    }
  },
};

export default atwResultService;
