/**
 * Exam Service
 * API calls for exam type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemExam } from '@/libs/types/system';

interface ExamQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

interface ExamPaginatedResponse {
  data: SystemExam[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface ExamApiResponse {
  success: boolean;
  message: string;
  data: SystemExam[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleExamApiResponse {
  success: boolean;
  message: string;
  data: SystemExam;
}

interface ExamActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemExam;
}

interface ExamCreateData {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export const examService = {
  async getAllExams(params?: ExamQueryParams): Promise<ExamPaginatedResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);

      const endpoint = `/system-exams${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<ExamApiResponse>(endpoint, token);

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
      console.error('Failed to fetch exams:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  async getExam(id: number): Promise<SystemExam | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleExamApiResponse>(`/system-exams/${id}`, token);
      if (!result || !result.success) return null;
      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch exam ${id}:`, error);
      return null;
    }
  },

  async createExam(data: ExamCreateData): Promise<SystemExam | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<ExamActionApiResponse>('/system-exams', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create exam type');
      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create exam type:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async updateExam(id: number, data: Partial<ExamCreateData>): Promise<SystemExam | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<ExamActionApiResponse>(`/system-exams/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update exam type');
      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update exam type ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  async deleteExam(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<ExamActionApiResponse>(`/system-exams/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete exam type ${id}:`, error);
      return false;
    }
  },
};

export default examService;
