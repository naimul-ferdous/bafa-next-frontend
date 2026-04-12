/**
 * FTW 11SQN Instructor Service
 * Single API call to get all instructor data for FTW 11SQN subwing users
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface FTW11SqnInstructor {
  id: number;
  service_number: string;
  name: string;
  email: string;
  is_active: boolean;
  rank?: { id: number; name: string };
  profile_photo?: string;
  signature?: string;
  assign_wings: Array<{
    id: number;
    wing_id: number;
    subwing_id?: number;
    status: string;
    wing?: { id: number; name: string; code: string };
    sub_wing?: { id: number; name: string; code: string };
  }>;
}

export interface FTW11SqnMissionAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  mission_id: number;
  is_active: boolean;
  instructor?: { id: number; service_number: string; name: string };
  course?: { id: number; name: string };
  semester?: { id: number; name: string };
  mission?: { id: number; phase_full_name: string; phase_shortname: string; phase_symbol?: string };
  exercises: Array<{
    id: number;
    exercise_id: number;
    exercise?: { id: number; exercise_name: string; exercise_shortname: string };
  }>;
  cadets: Array<{
    id: number;
    cadet_id: number;
    cadet?: { id: number; name: string; cadet_number: string };
  }>;
}

export interface FTW11SqnGroundAssignment {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  ground_id: number;
  is_active: boolean;
  instructor?: { id: number; service_number: string; name: string };
  course?: { id: number; name: string };
  semester?: { id: number; name: string };
  ground?: { id: number; ground_full_name: string; ground_shortname: string; ground_symbol?: string };
  exercises: Array<{
    id: number;
    exercise_id: number;
    exercise?: { id: number; exercise_name: string; exercise_shortname: string; max_mark: number };
  }>;
  cadets: Array<{
    id: number;
    cadet_id: number;
    cadet?: { id: number; name: string; cadet_number: string };
  }>;
}

export interface FTW11SqnInstructorResponse {
  instructors: FTW11SqnInstructor[];
  mission_assignments: Record<number, FTW11SqnMissionAssignment[]>;
  ground_assignments: Record<number, FTW11SqnGroundAssignment[]>;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  subwing?: {
    id: number;
    name: string;
    code: string;
  };
}

interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: number;
  semester_id?: number;
}

export const ftw11sqnInstructorService = {
  async getAll(params?: QueryParams): Promise<FTW11SqnInstructorResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.per_page) query.append('per_page', params.per_page.toString());
      if (params?.search) query.append('search', params.search);
      if (params?.course_id) query.append('course_id', params.course_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());

      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: FTW11SqnInstructorResponse }>(
        `/ftw-11sqn-instructors?${query.toString()}`,
        token
      );
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to fetch instructors');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch FTW 11SQN instructors:', error);
      throw error;
    }
  },

  async getById(instructorId: number): Promise<any> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: any }>(
        `/ftw-11sqn-instructors/${instructorId}`,
        token
      );
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to fetch instructor details');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch instructor details:', error);
      throw error;
    }
  },
};

export default ftw11sqnInstructorService;