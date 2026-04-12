/**
 * CTW Assessment Counseling Types
 * Type definitions for CTW Assessment Counseling entities
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

// Counseling Event
export interface CtwAssessmentCounselingEvent {
  id: number;
  ctw_assessment_counseling_type_id?: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Counseling Type Semester
export interface CtwAssessmentCounselingTypeSemester {
  id: number;
  ctw_assessment_counseling_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
  name?: string;
  short_name?: string;
  code?: string;
}

// Counseling Type
export interface CtwAssessmentCounselingType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  events?: CtwAssessmentCounselingEvent[];
  semesters?: CtwAssessmentCounselingTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// Counseling Result Remark
export interface CtwAssessmentCounselingResultRemark {
  id: number;
  ctw_assessment_counseling_result_id?: number;
  ctw_assessment_counseling_result_cadet_id?: number;
  ctw_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  event?: CtwAssessmentCounselingEvent;
}

// Counseling Result Cadet
export interface CtwAssessmentCounselingResultCadet {
  id: number;
  ctw_assessment_counseling_result_id: number;
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
    name: string;
    bd_no?: string;
    cadet_number?: string;
    assigned_ranks?: { is_current: boolean; rank?: { name: string; short_name?: string } }[];
    assigned_branchs?: { is_current: boolean; branch?: { name: string } }[];
  };
  remarks?: CtwAssessmentCounselingResultRemark[];
}

// Counseling Result
export interface CtwAssessmentCounselingResult {
  total_approved: number;
  total_counseled: number;
  total_cadets: number;
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  ctw_assessment_counseling_type_id: number;
  counseling_date?: string;
  instructor_id?: number;
  cadet_id?: number; // Legacy
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
  counseling_type?: CtwAssessmentCounselingType;
  instructor?: User;
  creator?: User;
  result_cadets?: CtwAssessmentCounselingResultCadet[];
}

// Create/Update Data Types
export interface CtwAssessmentCounselingTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
  events?: {
    event_name: string;
    event_code: string;
    event_type: string;
    order?: number;
  }[];
  semesters?: number[];
}

export interface CtwAssessmentCounselingResultCreateData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  ctw_assessment_counseling_type_id: number;
  counseling_date?: string;
  instructor_id?: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: CtwAssessmentCounselingResultCadetCreateData[];
}

export interface CtwAssessmentCounselingResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  remarks?: CtwAssessmentCounselingResultRemarkCreateData[];
}

export interface CtwAssessmentCounselingResultRemarkCreateData {
  ctw_assessment_counseling_event_id: number;
  remark: string;
  is_active?: boolean;
}
