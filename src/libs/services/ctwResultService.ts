/**
 * CTW Result Service
 * API calls for CTW results (ctw_results + ctw_results_achieved_marks)
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

interface CtwResultCreateData {
  ctw_results_module_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id: number;
  instructor_id: number;
  remarks?: string;
  is_active?: boolean;
  marks: {
    cadet_id: number;
    achieved_mark: number;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const ctwResultService = {
  /**
   * Create a new CTW result with marks (bulk insert)
   */
  async store(data: CtwResultCreateData): Promise<any> {
    const token = getToken();
    const result = await apiClient.post<ApiResponse<any>>('/ctw-results', data, token);
    return result?.data || null;
  },

  /**
   * Get all CTW results with optional filters
   */
  async getAllResults(params?: any): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          query.append(key, params[key].toString());
        }
      });
    }

    const endpoint = `/ctw-results${query.toString() ? `?${query.toString()}` : ''}`;
    const token = getToken();
    const result = await apiClient.get<ApiResponse<any[]>>(endpoint, token);
    return result || { success: false, message: 'Failed to fetch results', data: [] };
  },

  /**
   * Get all CTW results grouped by course and semester
   */
  async getGroupedResults(params?: any): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          query.append(key, params[key].toString());
        }
      });
    }

    const endpoint = `/ctw-results/grouped${query.toString() ? `?${query.toString()}` : ''}`;
    const token = getToken();
    const result = await apiClient.get<ApiResponse<any[]>>(endpoint, token);
    return result || { success: false, message: 'Failed to fetch grouped results', data: [] };
  },

  /**
   * Get consolidated results by course and semester
   */
  async getConsolidatedResults(params: {
    course_id: number;
    semester_id: number;
    group_id?: number;
    program_id?: number;
    branch_id?: number;
  }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if ((params as any)[key] !== undefined && (params as any)[key] !== null) {
          query.append(key, (params as any)[key].toString());
        }
      });
    }

    const endpoint = `/ctw-results/consolidated${query.toString() ? `?${query.toString()}` : ''}`;
    const token = getToken();
    const result = await apiClient.get<ApiResponse<any[]>>(endpoint, token);
    return result || { success: false, message: 'Failed to fetch consolidated results', data: [] };
  },
};
