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
  AtwSubject,
  SystemWarningType,
} from '@/libs/types/system';
import type { User, CadetProfile } from '@/libs/types/user';
import type { CtwAssessmentOlqType } from '@/libs/types/ctwAssessmentOlq';
import type { Ftw11sqnFlyingPhaseType, Ftw11sqnFlyingSyllabus, Ftw11sqnGroundSyllabus } from '@/libs/types/ftw11sqnFlying';
import type { Ftw12sqnFlyingPhaseType, Ftw12sqnFlyingSyllabus, Ftw12sqnGroundSyllabus } from '@/libs/types/ftw12sqnFlying';

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
    warning_types: SystemWarningType[];
    subjects: AtwSubject[];
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
};

export default commonService;
