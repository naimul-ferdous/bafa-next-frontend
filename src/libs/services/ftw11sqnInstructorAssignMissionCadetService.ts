/**
 * FTW 11SQN Instructor Assign Mission Cadet Service
 * Assigns cadets to instructor mission (phase) assignments.
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface Ftw11sqnInstructorAssignMissionCadet {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_id: number;
  cadet_id: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  mission?: { id: number; phase_full_name: string; phase_shortname: string; phase_symbol?: string };
  cadet?: { id: number; name: string; cadet_number: string; rank?: { rank_short_name?: string } };
}

export interface MissionCadetItem {
  mission_id: number;
  cadet_ids: number[];
}

interface SyncPayload {
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_cadets: MissionCadetItem[];
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

interface ApiListResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnInstructorAssignMissionCadet[];
}

interface ApiSyncResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnInstructorAssignMissionCadet[];
}

export const ftw11sqnInstructorAssignMissionCadetService = {
  async getAssignments(params: QueryParams): Promise<Ftw11sqnInstructorAssignMissionCadet[]> {
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
      const result = await apiClient.get<ApiListResponse>(
        `/ftw-11sqn-instructor-assign-mission-cadets?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch instructor mission cadet assignments:', error);
      return [];
    }
  },

  async syncAssignments(payload: SyncPayload): Promise<Ftw11sqnInstructorAssignMissionCadet[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<ApiSyncResponse>(
      '/ftw-11sqn-instructor-assign-mission-cadets/sync',
      payload,
      token
    );
    if (!result?.success) throw new Error(result?.message || 'Failed to sync mission cadet assignments');
    return result.data || [];
  },

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(
        `/ftw-11sqn-instructor-assign-mission-cadets/${id}`,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete mission cadet assignment ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnInstructorAssignMissionCadetService;
