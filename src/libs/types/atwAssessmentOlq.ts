/**
 * ATW Assessment OLQ Types
 * Type definitions for ATW Assessment OLQ entities
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
export interface AtwAssessmentOlqTypeEstimatedMark {
  id: number;
  atw_assessment_olq_type_id: number;
  event_name: string;
  event_code: string;
  estimated_mark: number | string;
  order: number;
  remarks?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// OLQ Type Semester
export interface AtwAssessmentOlqTypeSemester {
  id: number;
  atw_assessment_olq_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// OLQ Type
export interface AtwAssessmentOlqType {
  id: number;
  course_id?: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  estimated_marks?: AtwAssessmentOlqTypeEstimatedMark[];
  semesters?: AtwAssessmentOlqTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// OLQ Result Mark
export interface AtwAssessmentOlqResultMark {
  id: number;
  atw_assessment_olq_result_cadet_id: number;
  atw_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: AtwAssessmentOlqTypeEstimatedMark;
}

// OLQ Result Cadet
export interface AtwAssessmentOlqResultCadet {
  id: number;
  atw_assessment_olq_result_id: number;
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
  marks?: AtwAssessmentOlqResultMark[];
}

// OLQ Result
export interface AtwAssessmentOlqResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  atw_assessment_olq_type_id: number;
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
  olq_type?: AtwAssessmentOlqType;
  creator?: User;
  result_cadets?: AtwAssessmentOlqResultCadet[];
}

// Create/Update Data Types
export interface AtwAssessmentOlqTypeCreateData {
  course_id: number;
  type_name: string;
  type_code: string;
  is_active?: boolean;
  estimated_marks?: {
    event_name: string;
    event_code: string;
    estimated_mark: number;
    order?: number;
    remarks?: string;
  }[];
  semesters?: number[];
}

export interface AtwAssessmentOlqResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id?: number;
  atw_assessment_olq_type_id: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: AtwAssessmentOlqResultCadetCreateData[];
}

export interface AtwAssessmentOlqResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  marks?: AtwAssessmentOlqResultMarkCreateData[];
}

export interface AtwAssessmentOlqResultMarkCreateData {
  atw_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
