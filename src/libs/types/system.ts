/**
 * System Types
 * Type definitions for system-level entities
 */

import type { User, CadetProfile } from './user';

export interface SystemCourse {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSemester {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  is_flying?: boolean;
  is_academic?: boolean;
  is_gst?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemProgram {
  id: number;
  name: string;
  code: string;
  is_flying?: boolean;
  description?: string;
  duration_months?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemBranch {
  id: number;
  program_id?: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  is_flying?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  program?: SystemProgram;
}

export interface SystemGroup {
  id: number;
  name: string;
  code: string;
  description?: string;
  capacity?: number;
  current_strength?: number;
  formation_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemExam {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemWarningType {
  id: number;
  name: string;
  code: string;
  description?: string;
  reduced_mark: number;
  category?: string;
  consequences?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CadetWarning {
  id: number;
  cadet_id: number;
  warning_id: number;
  course_id?: number;
  semester_id?: number;
  remarks?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  cadet?: CadetProfile;
  warning?: SystemWarningType;
  course?: { id: number; name: string; code?: string };
  semester?: { id: number; name: string; code?: string };
  creator?: { 
    id: number; 
    name: string; 
    rank?: string; 
    role?: string; 
    signature?: string 
  };
}

export interface AtwSubjectsModuleMarksheetMark {
  id: number;
  atw_subjects_module_marksheet_id: number;
  name: string;
  type?: string;
  percentage: number;
  estimate_mark: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwSubjectsModuleMarksheet {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  marks?: AtwSubjectsModuleMarksheetMark[];
  created_at?: string;
  updated_at?: string;
}

export interface AtwSubjectModule {
  id: number;
  atw_subjects_module_marksheet_id?: number;
  subject_name: string;
  subject_code: string;
  subject_legend?: string;
  subject_period?: string;
  subject_type: 'academic' | 'professional';
  subjects_full_mark: number;
  subjects_credit: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  marksheet?: AtwSubjectsModuleMarksheet;
}

export interface AtwSubject {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  atw_subject_module_id: number;
  is_current: boolean;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  module?: AtwSubjectModule;
  creator?: User;
}

export interface AtwAssessmentPenpictureGrade {
  id: number;
  course_id: number;
  grade_name: string;
  grade_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  semesters?: {
    id: number;
    atw_assessment_penpicture_grade_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

export interface AtwAssessmentPenpictureResultStrength {
  id: number;
  atw_assessment_penpicture_result_id: number;
  strength: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwAssessmentPenpictureResultWeakness {
  id: number;
  atw_assessment_penpicture_result_id: number;
  weakness: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwAssessmentPenpictureResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  instructor_id: number;
  cadet_id: number;
  atw_assessment_penpicture_grade_id: number;
  pen_picture?: string;
  course_performance?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  instructor?: User;
  cadet?: CadetProfile;
  grade?: AtwAssessmentPenpictureGrade;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  strengths?: AtwAssessmentPenpictureResultStrength[];
  weaknesses?: AtwAssessmentPenpictureResultWeakness[];
}

// CTW Assessment Counseling Type
export interface CtwAssessmentCounselingType {
  id: number;
  course_id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  events?: CtwAssessmentCounselingEvent[];
  semesters?: {
    id: number;
    ctw_assessment_counseling_type_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

// CTW Assessment Counseling Event
export interface CtwAssessmentCounselingEvent {
  id: number;
  ctw_assessment_counseling_type_id?: number;
  course_id?: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  counseling_type?: CtwAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// CTW Assessment Counseling Result Remark
export interface CtwAssessmentCounselingResultRemark {
  id: number;
  ctw_assessment_counseling_result_id: number;
  ctw_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  event?: CtwAssessmentCounselingEvent;
}

// CTW Assessment Counseling Result
export interface CtwAssessmentCounselingResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  instructor_id: number;
  cadet_id: number;
  ctw_assessment_counseling_type_id?: number;
  counseling_date?: string;
  remarks_global?: string;
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
  instructor?: User;
  cadet?: User;
  counseling_type?: CtwAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  remarks?: CtwAssessmentCounselingResultRemark[];
}

// FTW 11sqn Assessment Counseling Type
export interface Ftw11sqnAssessmentCounselingType {
  id: number;
  course_id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  events?: Ftw11sqnAssessmentCounselingEvent[];
  semesters?: {
    id: number;
    ftw_11sqn_assessment_counseling_type_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

// FTW 11sqn Assessment Counseling Event
export interface Ftw11sqnAssessmentCounselingEvent {
  id: number;
  ftw_11sqn_assessment_counseling_type_id?: number;
  course_id?: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  counseling_type?: Ftw11sqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// FTW 11sqn Assessment Counseling Result Remark
export interface Ftw11sqnAssessmentCounselingResultRemark {
  id: number;
  ftw_11sqn_assessment_counseling_result_id: number;
  ftw_11sqn_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  event?: Ftw11sqnAssessmentCounselingEvent;
}

// FTW 11sqn Assessment Counseling Result
export interface Ftw11sqnAssessmentCounselingResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  instructor_id: number;
  cadet_id: number;
  ftw_11sqn_assessment_counseling_type_id?: number;
  counseling_date?: string;
  remarks_global?: string;
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
  instructor?: User;
  cadet?: CadetProfile;
  counseling_type?: Ftw11sqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  remarks?: Ftw11sqnAssessmentCounselingResultRemark[];
}

// FTW 12sqn Assessment Counseling Type
export interface Ftw12sqnAssessmentCounselingType {
  id: number;
  course_id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  events?: Ftw12sqnAssessmentCounselingEvent[];
  semesters?: {
    id: number;
    ftw_12sqn_assessment_counseling_type_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

// FTW 12sqn Assessment Counseling Event
export interface Ftw12sqnAssessmentCounselingEvent {
  id: number;
  ftw_12sqn_assessment_counseling_type_id?: number;
  course_id?: number;
  event_name: string;
  event_code: string;
  event_type: string;
  order: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  counseling_type?: Ftw12sqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// FTW 12sqn Assessment Counseling Result Remark
export interface Ftw12sqnAssessmentCounselingResultRemark {
  id: number;
  ftw_12sqn_assessment_counseling_result_id: number;
  ftw_12sqn_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  event?: Ftw12sqnAssessmentCounselingEvent;
}

// FTW 12sqn Assessment Counseling Result
export interface Ftw12sqnAssessmentCounselingResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  instructor_id: number;
  cadet_id: number;
  ftw_12sqn_assessment_counseling_type_id?: number;
  counseling_date?: string;
  remarks_global?: string;
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
  instructor?: User;
  cadet?: User;
  counseling_type?: Ftw12sqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  remarks?: Ftw12sqnAssessmentCounselingResultRemark[];
}
