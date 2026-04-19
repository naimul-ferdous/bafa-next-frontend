/**
 * CTW One Mile Practice Service
 * API calls for CTW One Mile practice records management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface PracticeRecord {
  id?: number;
  course_id: number;
  semester_id: number;
  cadet_id: number;
  ctw_results_module_id: number;
  exam_type_id: number;
  instructor_id: number;
  practice_date: string;
  achieved_mark: number;
  remark?: string;
  cadet?: {
    id: number;
    name: string;
    cadet_number: string;
  };
}

export interface BulkPracticePayload {
  course_id: number;
  semester_id: number;
  ctw_results_module_id: number;
  exam_type_id: number;
  instructor_id: number;
  practice_date: string;
  practices: Array<{
    cadet_id: number;
    achieved_mark: number;
    remark?: string;
  }>;
}

export const ctwOneMilePracticeService = {
  async getPractices(params: {
    course_id?: number;
    semester_id?: number;
    exam_type_id?: number;
    ctw_results_module_id?: number;
    instructor_id?: number;
    practice_date?: string;
  }): Promise<PracticeRecord[]> {
    try {
      const query = new URLSearchParams();
      if (params.course_id) query.append('course_id', params.course_id.toString());
      if (params.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params.ctw_results_module_id) query.append('ctw_results_module_id', params.ctw_results_module_id.toString());
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.practice_date) query.append('practice_date', params.practice_date);

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: PracticeRecord[] }>(
        `/ctw-results-practices?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch practices:', error);
      return [];
    }
  },

  async saveBulk(payload: BulkPracticePayload): Promise<PracticeRecord[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found. Please login again.');
    const result = await apiClient.post<{ success: boolean; message: string; data: PracticeRecord[] }>(
      '/ctw-results-practices/bulk',
      payload,
      token
    );
    if (!result?.success) throw new Error(result?.message || 'Failed to save practices');
    return result.data || [];
  },

  async deletePractice(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(
        `/ctw-results-practices/${id}`,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete practice:', error);
      return false;
    }
  },
};

export default ctwOneMilePracticeService;
