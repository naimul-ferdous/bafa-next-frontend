/**
 * FTW 11SQN Instructor Assign Ground Service
 * Manages Grounds, Exercises, and Cadets.
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { Ftw11sqnInstructorAssignGround } from '@/libs/types/ftw11sqnFlying';

export interface Ftw11sqnInstructorAssignGroundExercise {
  id: number;
  exercise_id: number;
  exercise?: any;
}

export interface Ftw11sqnInstructorAssignGroundCadet {
  id: number;
  cadet_id: number;
  cadet?: any;
}

export interface Ftw11sqnGroundAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  ground_id: number;
  is_active: boolean;
  ground?: any;
  exercises?: Ftw11sqnInstructorAssignGroundExercise[];
  cadets?: Ftw11sqnInstructorAssignGroundCadet[];
}

export interface UnifiedSyncGroundItem {
  ground_id: number;
  exercise_ids: number[];
  cadet_ids: number[];
}

export interface UnifiedSyncGroundPayload {
  instructor_id: number;
  course_id: number;
  semester_id: number;
  grounds: UnifiedSyncGroundItem[];
}

export interface CadetGroundSyncItem {
  instructor_id: number;
  ground_id: number;
}

export interface CadetGroundSyncPayload {
  cadet_id: number;
  course_id: number;
  semester_id: number;
  assignments: CadetGroundSyncItem[];
}

interface QueryParams {
  instructor_id?: number;
  course_id?: number;
  semester_id?: number;
  ground_id?: number;
  cadet_id?: number;
  is_active?: boolean;
  per_page?: number;
}

export const ftw11sqnInstructorAssignGroundService = {
  /**
   * Fetch ground assignments with nested exercises and cadets.
   */
  async getAssignments(params: QueryParams): Promise<Ftw11sqnGroundAssignment[]> {
    try {
      const query = new URLSearchParams();
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.course_id)     query.append('course_id',     params.course_id.toString());
      if (params.semester_id)   query.append('semester_id',   params.semester_id.toString());
      if (params.ground_id)     query.append('ground_id',     params.ground_id.toString());
      if (params.cadet_id)      query.append('cadet_id',      params.cadet_id.toString());
      if (params.per_page)      query.append('per_page',      params.per_page.toString());
      if (params.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: Ftw11sqnGroundAssignment[] }>(
        `/ftw-11sqn-instructor-assign-ground?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch instructor ground assignments:', error);
      return [];
    }
  },

  /**
   * Unified Sync for Instructor-centric view (Save Everything).
   */
  async sync(payload: UnifiedSyncGroundPayload): Promise<boolean> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<{ success: boolean; message: string }>(
      '/ftw-11sqn-instructor-assign-ground/sync',
      payload,
      token
    );
    return result?.success || false;
  },

  /**
   * Sync by Cadet (1 cadet to many instructor/grounds).
   */
  async syncByCadet(payload: CadetGroundSyncPayload): Promise<boolean> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<{ success: boolean; message: string }>(
      '/ftw-11sqn-instructor-assign-ground/sync-by-cadet',
      payload,
      token
    );
    return result?.success || false;
  },
};

export default ftw11sqnInstructorAssignGroundService;