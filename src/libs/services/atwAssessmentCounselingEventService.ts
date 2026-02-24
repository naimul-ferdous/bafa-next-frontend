/**
 * ATW Assessment Counseling Event Service
 * API calls for counseling event management
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwAssessmentCounselingEvent } from "@/libs/types/system";

interface EventQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
}

interface EventPaginatedResponse {
  data: AtwAssessmentCounselingEvent[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface EventApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingEvent[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface SingleEventApiResponse {
  success: boolean;
  message: string;
  data: AtwAssessmentCounselingEvent;
}

interface EventActionApiResponse {
  success: boolean;
  message: string;
  data?: AtwAssessmentCounselingEvent;
}

interface EventCreateData {
  course_id?: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order?: number;
  is_active?: boolean;
}

export const atwAssessmentCounselingEventService = {
  /**
   * Get all events with pagination
   */
  async getAllEvents(params?: EventQueryParams): Promise<EventPaginatedResponse> {
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

      if (params?.course_id) {
        query.append('course_id', params.course_id.toString());
      }

      const endpoint = `/atw-assessment-counseling-events${query.toString() ? `?${query.toString()}` : ''}`;

      const token = getToken();
      const result = await apiClient.get<EventApiResponse>(endpoint, token);

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
      console.error('Failed to fetch events:', error);
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
   * Get active events
   */
  async getActiveEvents(courseId?: number): Promise<AtwAssessmentCounselingEvent[]> {
    try {
      const query = courseId ? `?course_id=${courseId}` : '';
      const token = getToken();
      const result = await apiClient.get<EventApiResponse>(`/atw-assessment-counseling-events/active${query}`, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch active events:', error);
      return [];
    }
  },

  /**
   * Get single event
   */
  async getEvent(id: number): Promise<AtwAssessmentCounselingEvent | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SingleEventApiResponse>(`/atw-assessment-counseling-events/${id}`, token);

      if (!result || !result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new event
   */
  async createEvent(data: EventCreateData): Promise<AtwAssessmentCounselingEvent | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.post<EventActionApiResponse>('/atw-assessment-counseling-events', data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to create event');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error('Failed to create event:', error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Update event
   */
  async updateEvent(id: number, data: Partial<EventCreateData>): Promise<AtwAssessmentCounselingEvent | null> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const result = await apiClient.put<EventActionApiResponse>(`/atw-assessment-counseling-events/${id}`, data, token);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update event');
      }

      return result.data || null;
    } catch (error: unknown) {
      console.error(`Failed to update event ${id}:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  /**
   * Delete event
   */
  async deleteEvent(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<EventActionApiResponse>(`/atw-assessment-counseling-events/${id}`, token);
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      return false;
    }
  },
};

export default atwAssessmentCounselingEventService;
