/**
 * Instructor Panel Service
 * Single API call to get all instructor panel data
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface InstructorPanelInstructor {
  id: number;
  user_id: number;
  service_number: string;
  name: string;
  email: string;
  is_active: boolean;
  failed_login_attempts: number;
  rank?: any;
  profile_photo?: string;
  signature?: string;
  assign_wings: Array<{
    id: number;
    wing_id: number;
    subwing_id?: number;
    status: string;
    wing?: any;
    sub_wing?: any;
  }>;
  atw_assigned_subjects?: any[];
  ctw_assigned_modules?: any[];
}

export interface InstructorPanelCourse {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface InstructorPanelSemester {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  is_flying?: boolean;
}

export interface InstructorPanelMissionAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_id: number;
  is_active: boolean;
  instructor?: any;
  course?: any;
  semester?: any;
  mission?: any;
  exercises: any[];
  cadets: any[];
}

export interface InstructorPanelGroundAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  ground_id: number;
  is_active: boolean;
  instructor?: any;
  course?: any;
  semester?: any;
  ground?: any;
  exercises: any[];
  cadets: any[];
}

export interface InstructorPanelUserContext {
  is_system_admin: boolean;
  has_wing_assigned: boolean;
  is_ftw_wing_user: boolean;
  is_11sqn_user: boolean;
  has_flying_wing_no_subwing: boolean;
  wing_ids: number[];
  subwing_ids: number[];
}

export interface InstructorPanelPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface InstructorPanelResponse {
  courses: InstructorPanelCourse[];
  semesters: InstructorPanelSemester[];
  instructors: InstructorPanelInstructor[];
  pagination: InstructorPanelPagination;
  instructor_assign_map: Record<number, Record<string, string[]>>;
  mission_assignments: Record<number, InstructorPanelMissionAssignment[]>;
  ground_assignments: Record<number, InstructorPanelGroundAssignment[]>;
  mission_assignments_12sqn: Record<number, InstructorPanelMissionAssignment[]>;
  ground_assignments_12sqn: Record<number, InstructorPanelGroundAssignment[]>;
  user_context: InstructorPanelUserContext;
}

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
}

export const instructorPanelService = {
  async getAll(params?: QueryParams): Promise<InstructorPanelResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: InstructorPanelResponse }>(
        `/common/instructor-panel?${query.toString()}`,
        token
      );
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to fetch instructor panel data');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch instructor panel data:', error);
      throw error;
    }
  },
};

export default instructorPanelService;