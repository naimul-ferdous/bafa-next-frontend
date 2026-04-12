/**
 * FTW 11SQN Instructor Assign Mission Service
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface Ftw11sqnInstructorAssignMissionExercise {
  id: number;
  assignment_id: number;
  exercise_id: number;
  exercise?: { id: number; exercise_name: string; exercise_shortname: string };
}

export interface Ftw11sqnInstructorAssignMission {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_id: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  mission?: { id: number; phase_full_name: string; phase_shortname: string; phase_symbol?: string };
  exercises?: Ftw11sqnInstructorAssignMissionExercise[];
}

interface AssignmentItem {
  mission_id: number;
  exercise_id: number;
}

interface SyncPayload {
  instructor_id: number;
  course_id: number;
  semester_id: number;
  assignments: AssignmentItem[];
}

interface QueryParams {
  instructor_id?: number;
  course_id?: number;
  semester_id?: number;
  mission_id?: number;
  is_active?: boolean;
  per_page?: number;
}

interface ApiListResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnInstructorAssignMission[];
}

interface ApiSyncResponse {
  success: boolean;
  message: string;
  data: Ftw11sqnInstructorAssignMission[];
}

export const ftw11sqnInstructorAssignMissionService = {
  async getAssignments(params: QueryParams): Promise<Ftw11sqnInstructorAssignMission[]> {
    try {
      const query = new URLSearchParams();
      if (params.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params.course_id)     query.append('course_id',     params.course_id.toString());
      if (params.semester_id)   query.append('semester_id',   params.semester_id.toString());
      if (params.mission_id)    query.append('mission_id',    params.mission_id.toString());
      if (params.per_page)      query.append('per_page',      params.per_page.toString());
      if (params.is_active !== undefined) query.append('is_active', params.is_active.toString());

      const token = getToken();
      const result = await apiClient.get<ApiListResponse>(
        `/ftw-11sqn-instructor-assign-mission?${query.toString()}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch instructor mission assignments:', error);
      return [];
    }
  },

  async syncAssignments(payload: SyncPayload): Promise<Ftw11sqnInstructorAssignMission[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication token not found.');
    const result = await apiClient.post<ApiSyncResponse>(
      '/ftw-11sqn-instructor-assign-mission/sync',
      payload,
      token
    );
    if (!result?.success) throw new Error(result?.message || 'Failed to sync assignments');
    return result.data || [];
  },

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const token = getToken();
      const result = await apiClient.delete<{ success: boolean }>(
        `/ftw-11sqn-instructor-assign-mission/${id}`,
        token
      );
      return result?.success || false;
    } catch (error) {
      console.error(`Failed to delete assignment ${id}:`, error);
      return false;
    }
  },
};

export default ftw11sqnInstructorAssignMissionService;
