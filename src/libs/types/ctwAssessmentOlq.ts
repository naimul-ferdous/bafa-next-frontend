/**
 * CTW Assessment OLQ Types
 * Type definitions for CTW Assessment OLQ entities
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
export interface CtwAssessmentOlqTypeEstimatedMark {
  id: number;
  ctw_assessment_olq_type_id: number;
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
export interface CtwAssessmentOlqTypeSemester {
  id: number;
  ctw_assessment_olq_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// OLQ Type
export interface CtwAssessmentOlqType {
  id: number;
  course_id?: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  estimated_marks?: CtwAssessmentOlqTypeEstimatedMark[];
  semesters?: CtwAssessmentOlqTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// OLQ Result Mark
export interface CtwAssessmentOlqResultMark {
  id: number;
  ctw_assessment_olq_result_cadet_id: number;
  ctw_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: CtwAssessmentOlqTypeEstimatedMark;
}

// OLQ Result Cadet
export interface CtwAssessmentOlqResultCadet {
  id: number;
  ctw_assessment_olq_result_id: number;
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
  marks?: CtwAssessmentOlqResultMark[];
}

// OLQ Result
export interface CtwAssessmentOlqResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  ctw_assessment_olq_type_id: number;
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
  olq_type?: CtwAssessmentOlqType;
  creator?: User;
  result_cadets?: CtwAssessmentOlqResultCadet[];
}

// Create/Update Data Types
export interface CtwAssessmentOlqTypeCreateData {
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

export interface CtwAssessmentOlqResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  ctw_assessment_olq_type_id: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: CtwAssessmentOlqResultCadetCreateData[];
}

export interface CtwAssessmentOlqResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  marks?: CtwAssessmentOlqResultMarkCreateData[];
}

export interface CtwAssessmentOlqResultMarkCreateData {
  ctw_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
