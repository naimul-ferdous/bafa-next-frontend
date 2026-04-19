/**
 * Common Service
 * API calls for shared/bulk options and data
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  SystemGroup,
  SystemExam,
  AtwSubjectModule,
  SystemWarningType,
  SystemUniversity,
  AtwUniversityDepartment,
} from '@/libs/types/system';
import type {
  User,
  CadetProfile,
  Rank,
  Wing,
  SubWing,
  SystemDivision,
  SystemDistrict,
  SystemPostOffice,
} from '@/libs/types/user';
import type { AtwSubjectGroup } from '@/libs/services/atwSubjectGroupService';
import type { CtwAssessmentOlqType } from '@/libs/types/ctwAssessmentOlq';
import type { Ftw11sqnFlyingPhaseType, Ftw11sqnFlyingSyllabus, Ftw11sqnGroundSyllabus } from '@/libs/types/ftw11sqnFlying';
import type { Ftw12sqnFlyingPhaseType, Ftw12sqnFlyingSyllabus, Ftw12sqnGroundSyllabus } from '@/libs/types/ftw12sqnFlying';
import type { FilePrintType } from '@/libs/types/filePrintType';

interface ResultOptionsResponse {
  success: boolean;
  message: string;
  data: {
    courses: SystemCourse[];
    semesters: SystemSemester[];
    programs: SystemProgram[];
    branches: SystemBranch[];
    groups: SystemGroup[];
    exams: SystemExam[];
    ranks: Rank[];
    wings: Wing[];
    sub_wings: SubWing[];
    file_print_types: FilePrintType[];
    divisions: SystemDivision[];
    warning_types: SystemWarningType[];
    subjects: AtwSubjectModule[];
    instructors: User[];
    cadets: CadetProfile[];
    ctw_olq_types: CtwAssessmentOlqType[];
    ftw11sqn_phase_types: Ftw11sqnFlyingPhaseType[];
    ftw11sqn_syllabuses: Ftw11sqnFlyingSyllabus[];
    ftw11sqn_ground_syllabuses: Ftw11sqnGroundSyllabus[];
    ftw12sqn_phase_types: Ftw12sqnFlyingPhaseType[];
    ftw12sqn_syllabuses: Ftw12sqnFlyingSyllabus[];
    ftw12sqn_ground_syllabuses: Ftw12sqnGroundSyllabus[];
  };
}

interface SubjectFormOptionsResponse {
  success: boolean;
  message: string;
  data: {
    semesters: SystemSemester[];
    programs: SystemProgram[];
    universities: SystemUniversity[];
    university_departments: AtwUniversityDepartment[];
    modules: AtwSubjectModule[];
    subject_groups: AtwSubjectGroup[];
  };
}

interface AddressOptionsResponse {
  success: boolean;
  message: string;
  data: {
    divisions: SystemDivision[];
    districts: SystemDistrict[];
    post_offices: SystemPostOffice[];
  };
}

interface CurrentSemesterCoursesResponse {
  success: boolean;
  message: string;
  data: {
    courses: SystemCourse[];
    current_semester: {
      id: number;
      name: string;
      code: string;
    } | null;
  };
}

interface InstructorAssignedMissionsResponse {
  success: boolean;
  message: string;
  data: {
    missions: { id: number; name: string; code: string }[];
    exercises: { id: number; name: string; shortname: string; mission_id: number }[];
  };
}

interface InstructorAssignedPhasesResponse {
  success: boolean;
  message: string;
  data: {
    phases: { id: number; semester_id: number; phase_full_name: string; phase_shortname: string }[];
  };
}

interface InstructorAssignedDataResponse {
  success: boolean;
  message: string;
  data: {
    phases: { id: number; semester_id: number; phase_full_name: string; phase_shortname: string }[];
    exercises: { id: number; name: string; shortname: string; mission_id: number }[];
    cadets: { id: number; name: string; bd_no?: string; cadet_number?: string }[];
  };
}

export const commonService = {
  /**
   * Get all common options for Result creation/filtering
   */
  async getResultOptions(): Promise<ResultOptionsResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<ResultOptionsResponse>('/common/result-options', token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch result options:', error);
      return null;
    }
  },

  /**
   * Get semesters for cadets assigned to a given course
   */
  async getSemestersByCourse(courseId: number): Promise<SystemSemester[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ data: SystemSemester[] }>(
        `/common/semesters-by-course?course_id=${courseId}`,
        token
      );
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch semesters by course:', error);
      return [];
    }
  },

  /**
   * Get lightweight options for subject group form: semesters, programs (with changeable_semesters), universities
   */
  async getSubjectFormOptions(): Promise<SubjectFormOptionsResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<SubjectFormOptionsResponse>('/common/subject-form-options', token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch subject form options:', error);
      return null;
    }
  },

  /**
   * Get all address-related options (Divisions, Districts, Post Offices)
   */
  async getAddressOptions(): Promise<AddressOptionsResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<AddressOptionsResponse>('/common/address-options', token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch address options:', error);
      return null;
    }
  },

  /**
   * Get courses for current semester (is_current in cadet_assign_semesters with is_flying semester)
   */
  async getCurrentSemesterCourses(): Promise<CurrentSemesterCoursesResponse['data'] | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<CurrentSemesterCoursesResponse>('/common/current-semester-courses', token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch current semester courses:', error);
      return null;
    }
  },

  /**
   * Get instructor assigned missions and exercises
   */
  async getInstructorAssignedMissions(params?: { instructor_id?: number; semester_id?: number; course_id?: number }): Promise<InstructorAssignedMissionsResponse['data'] | null> {
    try {
      const token = getToken();
      const query = new URLSearchParams();
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/common/instructor-assigned-missions${query.toString() ? `?${query.toString()}` : ''}`;
      const result = await apiClient.get<InstructorAssignedMissionsResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch instructor assigned missions:', error);
      return null;
    }
  },

  /**
   * Get instructor assigned phases (syllabuses) for filtering
   */
  async getInstructorAssignedPhases(params?: { instructor_id?: number; semester_id?: number; course_id?: number }): Promise<InstructorAssignedPhasesResponse['data'] | null> {
    try {
      const token = getToken();
      const query = new URLSearchParams();
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/common/instructor-assigned-phases${query.toString() ? `?${query.toString()}` : ''}`;
      const result = await apiClient.get<InstructorAssignedPhasesResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch instructor assigned phases:', error);
      return null;
    }
  },

  /**
   * Get all instructor assigned data (phases, exercises, cadets) in one call
   */
  async getInstructorAssignedData(params?: { instructor_id?: number; semester_id?: number; course_id?: number }): Promise<InstructorAssignedDataResponse['data'] | null> {
    try {
      const token = getToken();
      const query = new URLSearchParams();
      if (params?.instructor_id) query.append('instructor_id', params.instructor_id.toString());
      if (params?.semester_id) query.append('semester_id', params.semester_id.toString());
      if (params?.course_id) query.append('course_id', params.course_id.toString());

      const endpoint = `/common/instructor-assigned-data${query.toString() ? `?${query.toString()}` : ''}`;
      const result = await apiClient.get<InstructorAssignedDataResponse>(endpoint, token);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to fetch instructor assigned data:', error);
      return null;
    }
  },

  async getCtwMedicalDisposalSchemas(): Promise<{ id: number; name: string; code: string; slug_value: string | null }[]> {
    try {
      const token = getToken();
      const result = await apiClient.get<any>('/common/ctw-medical-disposal-schemas', token);
      return result?.data || [];
    } catch (error) {
      console.error('Failed to fetch CTW medical disposal schemas:', error);
      return [];
    }
  },
};

export default commonService;
