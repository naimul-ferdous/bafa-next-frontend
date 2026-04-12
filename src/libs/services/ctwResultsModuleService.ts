/**
 * CTW Results Module Service
 * API calls for CTW results modules and estimated marks management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  CtwResultsModule,
  CtwResultsModuleCreateData,
  CtwResultsModuleEstimatedMark,
  CtwResultsModuleEstimatedMarkCreateData
} from '@/libs/types/ctw';

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export const ctwResultsModuleService = {
  /**
   * Get all modules with pagination
   */
  async getAllModules(params?: QueryParams): Promise<PaginatedResponse<CtwResultsModule>> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const endpoint = `/ctw-results-modules${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse<CtwResultsModule[]>>(endpoint, token);

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
      console.error('Failed to fetch CTW modules:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single module
   */
  async getModule(id: number): Promise<CtwResultsModule | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<ApiResponse<CtwResultsModule>>(`/ctw-results-modules/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch CTW module ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new module
   */
  async createModule(data: CtwResultsModuleCreateData): Promise<CtwResultsModule | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<ApiResponse<CtwResultsModule>>('/ctw-results-modules', data, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to create CTW module:', error);
      throw error;
    }
  },

  /**
   * Update module
   */
  async updateModule(id: number, data: Partial<CtwResultsModuleCreateData>): Promise<CtwResultsModule | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<ApiResponse<CtwResultsModule>>(`/ctw-results-modules/${id}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update CTW module ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete module
   */
  async deleteModule(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ApiResponse<null>>(`/ctw-results-modules/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete CTW module ${id}:`, error);
      return false;
    }
  },

  /**
   * Get modules that have estimated marks for a given course + semester
   */
  async getModulesWithEstimatedMarks(params: { semester_id: number }): Promise<CtwResultsModule[]> {
    try {
      const query = new URLSearchParams();
      query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ctw-results-modules/with-estimated-marks?${query.toString()}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse<CtwResultsModule[]>>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch modules with estimated marks:', error);
      return [];
    }
  },

  /**
   * Get estimated marks for a module (optionally filtered by course_id and semester_id)
   */
  async getEstimatedMarks(moduleId: number, params?: { semester_id?: number }): Promise<CtwResultsModuleEstimatedMark[]> {
    try {
      const query = new URLSearchParams();
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const endpoint = `/ctw-results-modules/${moduleId}/estimated-marks${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ApiResponse<CtwResultsModuleEstimatedMark[]>>(endpoint, token);
      return result?.data || [];
    } catch (error) {
      console.error(`Failed to fetch estimated marks for module ${moduleId}:`, error);
      return [];
    }
  },

  /**
   * Get all estimated marks filtered by semester_id and exam_type_id (from ctw_results_module_estimated_marks)
   */
  async getEstimatedMarksBySemesterAndExam(params: { semester_id: number; exam_type_id: number }): Promise<CtwResultsModuleEstimatedMark[]> {
    try {
      const query = new URLSearchParams();
      query.append('semester_id', params.semester_id.toString());
      query.append('exam_type_id', params.exam_type_id.toString());

      const token = getToken();
      const result = await apiClient.get<ApiResponse<CtwResultsModuleEstimatedMark[]>>(
        `/ctw-results-module-estimated-marks?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch estimated marks by semester and exam type:', error);
      return [];
    }
  },

  /**
   * Store estimated mark for a module
   */
  async storeEstimatedMark(moduleId: number, data: Omit<CtwResultsModuleEstimatedMarkCreateData, 'ctw_results_module_id'>): Promise<CtwResultsModuleEstimatedMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.post<ApiResponse<CtwResultsModuleEstimatedMark>>(`/ctw-results-modules/${moduleId}/estimated-marks`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to store estimated mark for module ${moduleId}:`, error);
      throw error;
    }
  },

  /**
   * Update estimated mark
   */
  async updateEstimatedMark(moduleId: number, markId: number, data: Partial<CtwResultsModuleEstimatedMarkCreateData>): Promise<CtwResultsModuleEstimatedMark | null> {
    try {
      const token = getToken();
      const result = await apiClient.put<ApiResponse<CtwResultsModuleEstimatedMark>>(`/ctw-results-modules/${moduleId}/estimated-marks/${markId}`, data, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to update estimated mark ${markId}:`, error);
      throw error;
    }
  },

  /**
   * Delete estimated mark
   */
  async deleteEstimatedMark(moduleId: number, markId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ApiResponse<null>>(`/ctw-results-modules/${moduleId}/estimated-marks/${markId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete estimated mark ${markId}:`, error);
      return false;
    }
  },
};
