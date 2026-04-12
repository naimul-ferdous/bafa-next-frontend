/**
 * ATW Assessment Counseling Types
 * Type definitions for ATW Assessment Counseling entities
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
export interface AtwAssessmentCounselingEvent {
  id: number;
  atw_assessment_counseling_type_id: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Counseling Type Semester
export interface AtwAssessmentCounselingTypeSemester {
  id: number;
  atw_assessment_counseling_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// Counseling Type
export interface AtwAssessmentCounselingType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  events?: AtwAssessmentCounselingEvent[];
  semesters?: AtwAssessmentCounselingTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// Counseling Result Remark
export interface AtwAssessmentCounselingResultRemark {
  id: number;
  atw_assessment_counseling_result_id?: number;
  atw_assessment_counseling_result_cadet_id?: number;
  atw_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  event?: AtwAssessmentCounselingEvent;
}

// Counseling Result Cadet
export interface AtwAssessmentCounselingResultCadet {
  id: number;
  atw_assessment_counseling_result_id: number;
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
  remarks?: AtwAssessmentCounselingResultRemark[];
}

// Counseling Result
export interface AtwAssessmentCounselingResult {
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
  atw_assessment_counseling_type_id: number;
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
  counseling_type?: AtwAssessmentCounselingType;
  instructor?: User;
  creator?: User;
  result_cadets?: AtwAssessmentCounselingResultCadet[];
}

// Create/Update Data Types
export interface AtwAssessmentCounselingTypeCreateData {
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

export interface AtwAssessmentCounselingResultCreateData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  atw_assessment_counseling_type_id: number;
  counseling_date?: string;
  instructor_id?: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: AtwAssessmentCounselingResultCadetCreateData[];
}

export interface AtwAssessmentCounselingResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  remarks?: AtwAssessmentCounselingResultRemarkCreateData[];
}

export interface AtwAssessmentCounselingResultRemarkCreateData {
  atw_assessment_counseling_event_id: number;
  remark: string;
  is_active?: boolean;
}
