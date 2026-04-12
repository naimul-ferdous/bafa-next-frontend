/**
 * Course Service
 * API calls for course management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemCourse } from '@/libs/types/system';

interface CourseQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  allData?: boolean;
}

interface CoursePaginatedResponse {
  data: SystemCourse[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface CourseApiResponse {
  success: boolean;
  message: string;
  data: SystemCourse[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleCourseApiResponse {
  success: boolean;
  message: string;
  data: SystemCourse;
}

interface CourseActionApiResponse {
  success: boolean;
  message: string;
  data?: SystemCourse;
}

interface CourseCreateData {
  name: string;
  code: string;
  description?: string;
  duration_weeks?: number;
  credits?: number;
  level?: string;
  is_active?: boolean;
}

export const courseService = {
  /**
   * Get all courses with pagination
   */
  async getAllCourses(params?: CourseQueryParams): Promise<CoursePaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) {
        query.append('page', params.page.toString());
      }

      if (params?.per_page) {
        query.append('per_page', params.per_page.toString());
      }

      if (params?.search) {
        query.append('search', params.search);
      }

      const endpoint = `/system-courses${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<CourseApiResponse>(endpoint, token);

      if (!result) {
        return {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        };
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
      console.error('Failed to fetch courses:', error);
      return {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      };
    }
  },

  /**
   * Get single course
   */
  async getCourse(id: number): Promise<SystemCourse | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleCourseApiResponse>(`/system-courses/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch course ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new course
   */
  async createCourse(data: CourseCreateData): Promise<SystemCourse | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<CourseActionApiResponse>('/system-courses', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create course');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create course:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update course
   */
  async updateCourse(id: number, data: Partial<CourseCreateData>): Promise<SystemCourse | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<CourseActionApiResponse>(`/system-courses/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update course');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update course ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete course
   */
  async deleteCourse(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<CourseActionApiResponse>(`/system-courses/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete course ${id}:`, error);
      return false;
    }
  },
};

export default courseService;
