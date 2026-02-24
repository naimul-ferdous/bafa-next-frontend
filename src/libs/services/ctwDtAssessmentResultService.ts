/**
 * CTW DT Assessment Result Service
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export const ctwDtAssessmentResultService = {
  async getAllResults(ctwResultsModuleId: number, params?: any): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.exam_type_id) query.append('exam_type_id', params.exam_type_id.toString());
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      query.append('ctw_results_module_id', ctwResultsModuleId.toString());

      const endpoint = `/ctw-results?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

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

  async getResult(ctwResultsModuleId: number, id: number): Promise<any | null> {
    try {
      const query = new URLSearchParams();
      query.append('ctw_results_module_id', ctwResultsModuleId.toString());
      const endpoint = `/ctw-results/${id}?${query.toString()}`;

      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch result ${id}:`, error);
      return null;
    }
  },

  async deleteResult(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<any>(`/ctw-results/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete result ${id}:`, error);
      return false;
    }
  },

  async updateResult(id: number, data: any): Promise<any | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<any>(`/ctw-results/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update result ${id}:`, error);
      throw error;
    }
  },

  async getGroupedResults(params?: { course_id?: number; semester_id?: number; ctw_results_module_id?: number; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.ctw_results_module_id) query.append('ctw_results_module_id', params.ctw_results_module_id.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/ctw-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch grouped results:', error);
      return [];
    }
  },

  async getAssessmentObservationDtPf(
    params: 
    { 
      course_id: number; 
      semester_id: number 
    }
  ): Promise<{
    data: {
      cadet_id: number;
      dt_achieved: number; 
      pf_achieved: number; 
      total_achieved:number; 
      avg_achieved:number; 
      dt_converted: number; 
      pf_converted: number; 
      combined_converted: number;
    }[];
    dt_estimated_per_instructor: number; 
    dt_conversation_mark: number; 
    pf_estimated_per_instructor: number;
    pf_conversation_mark: number;
  }> {
    try {
      const query = new URLSearchParams();
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ctw-results/initial-fetch-assessment-observation-dt-pf?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result || { data: [], dt_estimated_per_instructor: 0, dt_conversation_mark: 0, pf_estimated_per_instructor: 0, pf_conversation_mark: 0 };
    } catch (error) {
      console.error('Failed to fetch assessment observation DT+PF marks:', error);
      return { data: [], dt_estimated_per_instructor: 0, dt_conversation_mark: 0, pf_estimated_per_instructor: 0, pf_conversation_mark: 0 };
    }
  },

  async getInitialFetchData(params: { module_code: string; course_id: number; semester_id: number }): Promise<any> {
    try {
      const query = new URLSearchParams();
      query.append('module_code', params.module_code);
      query.append('course_id', params.course_id.toString());
      query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ctw-results/initial-fetch?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch initial module data:', error);
      return null;
    }
  },
};
