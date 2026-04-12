/**
 * FTW 12SQN Instructor Assignment Service (Unified)
 * Manages Missions, Exercises, and Cadets.
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface Ftw12sqnAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_id: number;
  is_active: boolean;
  exercises?: Array<{ id: number; exercise_id: number; exercise?: any }>;
  cadets?: Array<{ id: number; cadet_id: number; cadet?: any }>;
  mission?: { id: number; phase_full_name: string; phase_shortname: string; phase_symbol?: string };
}

export interface UnifiedSyncMissionItem {
  mission_id: number;
  exercise_ids: number[];
  cadet_ids: number[];
}

export interface UnifiedSyncPayload {
  instructor_id: number;
  course_id: number;
  semester_id: number;
  missions: UnifiedSyncMissionItem[];
}

export interface CadetSyncItem {
  instructor_id: number;
  mission_id: number;
}

export interface CadetSyncPayload {
  cadet_id: number;
  course_id: number;
  semester_id: number;
  assignments: CadetSyncItem[];
}

interface QueryParams {
  instructor_id?: number;
  course_id?: number;
  semester_id?: number;
  mission_id?: number;
  cadet_id?: number;
  is_active?: boolean;
  per_page?: number;
}

export const ftw12sqnInstructorAssignmentService = {
  /**
   * Fetch assignments with nested exercises and cadets.
   */
  async getAssignments(params: QueryParams): Promise<Ftw12sqnAssignment[]> {
    try {
      const query = new URLSearchParams();
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.course_id)     query.append('course_id',     params.course_id.toString());
      if (params.semester_id)   query.append('semester_id',   params.semester_id.toString());
      if (params.mission_id)    query.append('mission_id',    params.mission_id.toString());
      if (params.cadet_id)      query.append('cadet_id',      params.cadet_id.toString());
      if (params.per_page)      query.append('per_page',      params.per_page.toString());
      if (params.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw12sqnAssignment[] }>(
        `/ftw-12sqn-instructor-assign-mission?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch 12sqn instructor assignments:', error);
      return [];
    }
  },

  /**
   * Unified Sync for Instructor-centric view (Save Everything).
   */
  async sync(payload: UnifiedSyncPayload): Promise<boolean> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<{ success: boolean; message: string }>(
      '/ftw-12sqn-instructor-assign-mission/sync',
      payload,
      token
    );
    return result?.success || false;
  },

  /**
   * Sync by Cadet (1 cadet to many instructor/missions).
   */
  async syncByCadet(payload: CadetSyncPayload): Promise<boolean> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<{ success: boolean; message: string }>(
      '/ftw-12sqn-instructor-assign-mission/sync-by-cadet',
      payload,
      token
    );
    return result?.success || false;
  },
};

export default ftw12sqnInstructorAssignmentService;