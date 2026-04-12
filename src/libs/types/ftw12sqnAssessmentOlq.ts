/**
 * ATW Assessment OLQ Types
 * Type definitions for ATW Assessment OLQ entities
 */

import type { User } from './user';
import type {
  SystemCourse,
  SystemSemester,
  SystemExam
} from './system';
import { Ftw12SqnOlqCadetApproval } from './ftw12sqnOlqCadetApproval';
import { Ftw12SqnOlqSemesterApproval } from './ftw12sqnOlqSemesterApproval';

// OLQ Type Estimated Mark
export interface Ftw12SqnAssessmentOlqTypeEstimatedMark {
  id: number;
  ftw_12sqn_assessment_olq_type_id: number;
  event_name: string;
  event_code: string;
  estimated_mark: number | string;
  order: number;
  remarks?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// OLQ Type Assignment (New Course-based structure)
export interface Ftw12SqnAssessmentOlqTypeAssignment {
  id: number;
  ftw_12sqn_assessment_olq_type_id: number;
  course_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  olq_type?: Ftw12SqnAssessmentOlqType;
}

// Legacy Semester Mapping (Restored for compatibility)
export interface Ftw12SqnAssessmentOlqTypeSemester {
  id: number;
  ftw_12sqn_assessment_olq_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// OLQ Type
export interface Ftw12SqnAssessmentOlqType {
  id: number;
  type_name: string;
  type_code: string;
  is_multiplier: boolean;
  multiplier?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_marks?: Ftw12SqnAssessmentOlqTypeEstimatedMark[];
  assignments?: Ftw12SqnAssessmentOlqTypeAssignment[];
  semesters?: Ftw12SqnAssessmentOlqTypeAssignment[] | Ftw12SqnAssessmentOlqTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// OLQ Result Mark
export interface Ftw12SqnAssessmentOlqResultMark {
  id: number;
  ftw12sqn_assessment_olq_result_cadet_id: number;
  ftw_12sqn_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: Ftw12SqnAssessmentOlqTypeEstimatedMark;
}

// OLQ Result Cadet
export interface Ftw12SqnAssessmentOlqResultCadet {
  id: number;
  ftw12sqn_assessment_olq_result_id: number;
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
  marks?: Ftw12SqnAssessmentOlqResultMark[];
}

// OLQ Result
export interface Ftw12SqnAssessmentOlqResult {
  id: number;
  course_id: number;
  semester_id: number;
  exam_type_id?: number;
  ftw_12sqn_assessment_olq_type_id: number;
  remarks?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  exam_type?: SystemExam;
  olq_type?: Ftw12SqnAssessmentOlqType;
  creator?: User;
  result_cadets?: Ftw12SqnAssessmentOlqResultCadet[];
  grouped_cadets?: {
    name: string;
    is_flying_group?: boolean;
    cadets: Ftw12SqnAssessmentOlqResultCadet[];
  }[];
  cadet_approvals?: Ftw12SqnOlqCadetApproval[];
  semester_approvals?: Ftw12SqnOlqSemesterApproval[];
}

// Create/Update Data Types
export interface Ftw12SqnAssessmentOlqTypeCreateData {
  type_name: string;
  type_code: string;
  is_multiplier?: boolean;
  multiplier?: string;
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

export interface Ftw12SqnAssessmentOlqResultCreateData {
  course_id: number;
  semester_id: number;
  exam_type_id?: number;
  ftw_12sqn_assessment_olq_type_id: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: Ftw12SqnAssessmentOlqResultCadetCreateData[];
}

export interface Ftw12SqnAssessmentOlqResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  marks?: Ftw12SqnAssessmentOlqResultMarkCreateData[];
}

export interface Ftw12SqnAssessmentOlqResultMarkCreateData {
  ftw_12sqn_assessment_olq_type_estimated_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
