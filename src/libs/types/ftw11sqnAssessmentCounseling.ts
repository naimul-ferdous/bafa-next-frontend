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
export interface Ftw11SqnAssessmentCounselingEvent {
  id: number;
  ftw11sqn_assessment_counseling_type_id: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Counseling Type Semester
export interface Ftw11SqnAssessmentCounselingTypeSemester {
  id: number;
  ftw11sqn_assessment_counseling_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// Counseling Type
export interface Ftw11SqnAssessmentCounselingType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  events?: Ftw11SqnAssessmentCounselingEvent[];
  semesters?: Ftw11SqnAssessmentCounselingTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// Counseling Result Remark
export interface Ftw11SqnAssessmentCounselingResultRemark {
  id: number;
  ftw_11sqn_assessment_counseling_result_id?: number;
  ftw_11sqn_assessment_counseling_result_cadet_id?: number;
  ftw_11sqn_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  event?: Ftw11SqnAssessmentCounselingEvent;
}

// Counseling Result Cadet
export interface Ftw11SqnAssessmentCounselingResultCadet {
  id: number;
  ftw11sqn_assessment_counseling_result_id: number;
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
  remarks?: Ftw11SqnAssessmentCounselingResultRemark[];
}

// Counseling Result
export interface Ftw11SqnAssessmentCounselingResult {
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
  ftw11sqn_assessment_counseling_type_id: number;
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
  counseling_type?: Ftw11SqnAssessmentCounselingType;
  instructor?: User;
  creator?: User;
  result_cadets?: Ftw11SqnAssessmentCounselingResultCadet[];
}

// Create/Update Data Types
export interface Ftw11SqnAssessmentCounselingTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
  events?: {
    event_name: string;
    event_code?: string;
    event_type: string;
    order?: number;
  }[];
  semesters?: number[];
}

export interface Ftw11SqnAssessmentCounselingResultCreateData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  ftw11sqn_assessment_counseling_type_id: number;
  counseling_date?: string;
  instructor_id?: number;
  remarks?: string;
  is_active?: boolean;
  cadets?: Ftw11SqnAssessmentCounselingResultCadetCreateData[];
}

export interface Ftw11SqnAssessmentCounselingResultCadetCreateData {
  cadet_id: number;
  bd_no: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  remarks?: Ftw11SqnAssessmentCounselingResultRemarkCreateData[];
}

export interface Ftw11SqnAssessmentCounselingResultRemarkCreateData {
  ftw_11sqn_assessment_counseling_event_id: number;
  remark: string;
  is_active?: boolean;
}
