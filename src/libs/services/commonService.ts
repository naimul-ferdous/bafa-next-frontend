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
};

export default commonService;
