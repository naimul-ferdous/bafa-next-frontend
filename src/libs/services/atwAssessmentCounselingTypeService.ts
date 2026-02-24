/**
 * ATW Assessment Counseling Type Service
 * API calls for ATW Assessment Counseling type management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  AtwAssessmentCounselingType,
  AtwAssessmentCounselingEvent,
  AtwAssessmentCounselingTypeSemester,
  AtwAssessmentCounselingTypeCreateData
} from '@/libs/types/atwAssessmentCounseling';

interface TypeQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  semester_id?: number;
  course_id?: number;
}

interface TypePaginatedResponse {
  data: AtwAssessmentCounselingType[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface TypeApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingType[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleTypeApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingType;
}

interface TypeActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentCounselingType;
}

interface EventApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingEvent[];
}

interface SingleEventApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingEvent;
}

interface SemesterApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingTypeSemester[];
}

interface SingleSemesterApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingTypeSemester;
}

export const atwAssessmentCounselingTypeService = {
  /**
   * Get all counseling types with pagination
   */
  async getAllTypes(params?: TypeQueryParams): Promise<TypePaginatedResponse> {
    try {
      const query = new URLSearchParams();

      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/atw-assessment-counseling-types${query.toString() ? `?${query.toString()}` : ''}`;
      const token = getToken();
      const result = await apiClient.get<TypeApiResponse>(endpoint, token);

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
      console.error('Failed to fetch counseling types:', error);
      return { data: [], current_page: 1, per_page: 10, total: 0, last_page: 1, from: 0, to: 0 };
    }
  },

  /**
   * Get single counseling type
   */
  async getType(id: number): Promise<AtwAssessmentCounselingType | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleTypeApiResponse>(`/atw-assessment-counseling-types/${id}`, token);
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch counseling type ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new counseling type
   */
  async createType(data: AtwAssessmentCounselingTypeCreateData): Promise<AtwAssessmentCounselingType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.post<TypeActionApiResponse>('/atw-assessment-counseling-types', data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to create counseling type');

      return result.data || null;
    } catch (error) {
      console.error('Failed to create counseling type:', error);
      throw error;
    }
  },

  /**
   * Update counseling type
   */
  async updateType(id: number, data: Partial<AtwAssessmentCounselingTypeCreateData>): Promise<AtwAssessmentCounselingType | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const result = await apiClient.put<TypeActionApiResponse>(`/atw-assessment-counseling-types/${id}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update counseling type');

      return result.data || null;
    } catch (error) {
      console.error(`Failed to update counseling type ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete counseling type
   */
  async deleteType(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<TypeActionApiResponse>(`/atw-assessment-counseling-types/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete counseling type ${id}:`, error);
      return false;
    }
  },

  // ==================== Events Management ====================

  /**
   * Get events for counseling type
   */
  async getEvents(typeId: number): Promise<AtwAssessmentCounselingEvent[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<EventApiResponse>(`/atw-assessment-counseling-types/${typeId}/events`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch counseling events:', error);
      return [];
    }
  },

  /**
   * Add event to counseling type
   */
  async addEvent(typeId: number, data: {
    event_name: string;
    event_code: string;
    event_type: string;
    order?: number;
  }): Promise<AtwAssessmentCounselingEvent | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleEventApiResponse>(`/atw-assessment-counseling-types/${typeId}/events`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add event');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  },

  /**
   * Update event
   */
  async updateEvent(typeId: number, eventId: number, data: {
    event_name: string;
    event_code: string;
    event_type: string;
    order?: number;
    is_active?: boolean;
  }): Promise<AtwAssessmentCounselingEvent | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<SingleEventApiResponse>(`/atw-assessment-counseling-types/${typeId}/events/${eventId}`, data, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to update event');

      return result.data || null;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  },

  /**
   * Delete event
   */
  async deleteEvent(typeId: number, eventId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-assessment-counseling-types/${typeId}/events/${eventId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  },

  /**
   * Reorder events
   */
  async reorderEvents(typeId: number, orders: number[]): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.put<{ success: boolean }>(`/atw-assessment-counseling-types/${typeId}/events/reorder`, { orders }, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to reorder events:', error);
      return false;
    }
  },

  // ==================== Semester Management ====================

  /**
   * Get semesters for counseling type
   */
  async getSemesters(typeId: number): Promise<AtwAssessmentCounselingTypeSemester[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<SemesterApiResponse>(`/atw-assessment-counseling-types/${typeId}/semesters`, token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
      return [];
    }
  },

  /**
   * Add semester to counseling type
   */
  async addSemester(typeId: number, semesterId: number): Promise<AtwAssessmentCounselingTypeSemester | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const result = await apiClient.post<SingleSemesterApiResponse>(`/atw-assessment-counseling-types/${typeId}/semesters`, { semester_id: semesterId }, token);
      if (!result || !result.success) throw new Error(result?.message || 'Failed to add semester');

      return result.data || null;
    } catch (error) {
      console.error('Failed to add semester:', error);
      throw error;
    }
  },

  /**
   * Remove semester from counseling type
   */
  async removeSemester(typeId: number, semesterId: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(`/atw-assessment-counseling-types/${typeId}/semesters/${semesterId}`, token);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to remove semester:', error);
      return false;
    }
  },
};

export default atwAssessmentCounselingTypeService;
