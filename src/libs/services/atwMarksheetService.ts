/**
 * ATW Marksheet Service
 * API calls for ATW subject module marksheet management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwSubjectsModuleMarksheet, AtwSubjectsModuleMarksheetMark } from '@/libs/types/system';

interface MarksheetQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface MarksheetPaginatedResponse {
  data: AtwSubjectsModuleMarksheet[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface MarksheetApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectsModuleMarksheet[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleMarksheetApiResponse {
  success: boolean;
  message: string;
  data: AtwSubjectsModuleMarksheet;
}

interface MarksheetActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwSubjectsModuleMarksheet;
}

interface MarksheetCreateData {
  name: string;
  code: string;
  is_active?: boolean;
  marks?: Array<{
    name: string;
    type?: string;
    percentage?: number;
    estimate_mark?: number;
    is_active?: boolean;
  }>;
}

export const atwMarksheetService = {
  /**
   * Get all marksheets with pagination
   */
  async getAllMarksheets(params?: MarksheetQueryParams): Promise<MarksheetPaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/atw-subject-module-marksheets${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<MarksheetApiResponse>(endpoint, token);

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
      console.error('Failed to fetch marksheets:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single marksheet
   */
  async getMarksheet(id: number): Promise<AtwSubjectsModuleMarksheet | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleMarksheetApiResponse>(`/atw-subject-module-marksheets/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch marksheet ${id}:`, error);
      return null;
    }
  },

  /**
   * Create marksheet
   */
  async createMarksheet(data: MarksheetCreateData): Promise<AtwSubjectsModuleMarksheet | null> {
    const token = getToken();
    const result = await apiClient.post<MarksheetActionApiResponse>('/atw-subject-module-marksheets', data, token);
    if (!result || !result.success) throw new Error(result?.message || 'Failed to create marksheet');
    return result.data || null;
  },

  /**
   * Update marksheet
   */
  async updateMarksheet(id: number, data: Partial<MarksheetCreateData>): Promise<AtwSubjectsModuleMarksheet | null> {
    const token = getToken();
    const result = await apiClient.put<MarksheetActionApiResponse>(`/atw-subject-module-marksheets/${id}`, data, token);
    if (!result || !result.success) throw new Error(result?.message || 'Failed to update marksheet');
    return result.data || null;
  },

  /**
   * Bulk disable marksheets
   */
  async bulkDisable(ids: number[]): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.put<MarksheetActionApiResponse>('/atw-subject-module-marksheets/bulk-disable', { ids }, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to bulk disable marksheets:', error);
      return false;
    }
  },

  /**
   * Delete marksheet
   */
  async deleteMarksheet(id: number): Promise<boolean> {
    const token = getToken();
    const result = await apiClient.delete<MarksheetActionApiResponse>(`/atw-subject-module-marksheets/${id}`, token);
    return !!result?.success;
  }
};
