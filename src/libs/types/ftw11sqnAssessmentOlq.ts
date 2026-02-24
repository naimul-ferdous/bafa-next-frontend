/**
 * FTW 11SQN Assessment OLQ Types
 * Type definitions for FTW 11SQN Assessment OLQ entities
 */

import type { User } from './user';
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  SystemGroup,
  SystemExam
} from './system';

// OLQ Type Estimated Mark
export interface Ftw11sqnAssessmentOlqTypeEstimatedMark {
  id: number;
  ftw_11sqn_assessment_olq_type_id: number;
  event_name: string;
  event_code: string;
  estimated_mark: number | string;
  remarks?: string;
  order?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// OLQ Type Semester
export interface Ftw11sqnAssessmentOlqTypeSemester {
  id: number;
  ftw_11sqn_assessment_olq_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// OLQ Type
export interface Ftw11sqnAssessmentOlqType {
  id: number;
  course_id?: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  estimated_marks?: Ftw11sqnAssessmentOlqTypeEstimatedMark[];
  semesters?: Ftw11sqnAssessmentOlqTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// OLQ Result Mark
export interface Ftw11sqnAssessmentOlqResultMark {
  id: number;
  ftw_11sqn_assessment_olq_result_cadet_id: number;
  ftw_11sqn_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: Ftw11sqnAssessmentOlqTypeEstimatedMark;
}

// OLQ Result Cadet
export interface Ftw11sqnAssessmentOlqResultCadet {
  id: number;
  ftw_11sqn_assessment_olq_result_id: number;
  cadet_id: number;
  bd_no: string;
  is_present: boolean;
  absent_reason?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  cadet?: {
    id: number;
    cadet_number?: string;
    bd_no?: string;
    name: string;
    email?: string;
    assigned_ranks?: {
      id: number;
      is_current: boolean;
      rank?: {
        id: number;
        name: string;
        short_name: string;
      };
    }[];
    assigned_branchs?: {
      id: number;
      is_current: boolean;
      branch?: {
        id: number;
        name: string;
        code: string;
      };
    }[];
  };
  marks?: Ftw11sqnAssessmentOlqResultMark[];
}

// OLQ Result
export interface Ftw11sqnAssessmentOlqResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  ftw_11sqn_assessment_olq_type_id: number;
  remarks?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  group?: SystemGroup;
  exam_type?: SystemExam;
  olq_type?: Ftw11sqnAssessmentOlqType;
  creator?: User;
  result_cadets?: Ftw11sqnAssessmentOlqResultCadet[];
}

// Create/Update Data Types
export interface Ftw11sqnAssessmentOlqTypeCreateData {
  course_id: number;
  type_name: string;
  type_code: string;
  is_active?: boolean;
  estimated_marks?: {
    event_name: string;
    event_code: string;
    estimated_mark: number;
    remarks?: string;
    order?: number;
  }[];
  semesters?: number[];
}

export interface Ftw11sqnAssessmentOlqResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  ftw_11sqn_assessment_olq_type_id: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: Ftw11sqnAssessmentOlqResultCadetCreateData[];
}

export interface Ftw11sqnAssessmentOlqResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  marks?: Ftw11sqnAssessmentOlqResultMarkCreateData[];
}

export interface Ftw11sqnAssessmentOlqResultMarkCreateData {
  ftw_11sqn_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
