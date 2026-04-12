/**
 * System Types
 * Type definitions for system-level entities
 */

import type { User } from './user';

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
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemProgram {
  id: number;
  name: string;
  code: string;
  description?: string;
  duration_months?: number;
  qualification_level?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemBranch {
  id: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  severity_level: number;
  category?: string;
  consequences?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CtwSubjectMark {
  id: number;
  ctw_subject_id: number;
  name: string;
  type?: string;
  percentage: number;
  estimate_mark: number;
  created_at?: string;
  updated_at?: string;
}

export interface CtwSubject {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  subject_name: string;
  subject_code: string;
  subject_legend?: string;
  subject_period?: string;
  subjects_full_mark: number;
  subjects_credit: number;
  is_professional: boolean;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  subject_marks?: CtwSubjectMark[];
}

// CTW Results Module types
export type CtwModuleAssessment = 'dt' | 'pf' | 'ao' | 'gsk' | 'bma';

export interface CtwResultsModule {
  id: number;
  full_name: string;
  short_name: string;
  code: string;
  assessment?: CtwModuleAssessment | null;
  instructor_count: number;
  is_daily: boolean;
  total_mark: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  estimated_marks?: CtwResultsModuleEstimatedMark[];
}

export interface CtwResultsModuleEstimatedMark {
  id: number;
  ctw_results_module_id: number;
  semester_id: number;
  exam_type_id: number;
  practice_count?: number;
  convert_of_practice?: number;
  convert_of_exam?: number;
  estimated_mark_per_instructor?: number;
  conversation_mark?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  module?: CtwResultsModule;
  semester?: SystemSemester;
  exam_type?: SystemExam;
  details?: CtwResultsModuleEstimatedMarkDetail[];
}

export interface CtwResultsModuleEstimatedMarkDetailScore {
  id?: number;
  ctw_results_module_estimated_marks_details_id?: number;
  male_quantity?: number;
  male_time?: string;
  male_mark?: number;
  female_quantity?: number;
  female_time?: string;
  female_mark?: number;
  sort?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CtwResultsModuleEstimatedMarkDetail {
  id?: number;
  ctw_results_module_estimated_mark_id?: number;
  name?: string;
  male_quantity?: number;
  female_quantity?: number;
  male_marks?: number;
  female_marks?: number;
  is_active?: boolean;
  scores?: CtwResultsModuleEstimatedMarkDetailScore[];
  created_at?: string;
  updated_at?: string;
}

export interface CtwResultsModuleCreateData {
  full_name: string;
  short_name: string;
  code: string;
  assessment?: CtwModuleAssessment | null;
  instructor_count?: number;
  is_daily?: boolean;
  total_mark: number;
  is_active?: boolean;
}

export interface CtwResultsModuleEstimatedMarkCreateData {
  ctw_results_module_id: number;
  semester_id: number;
  exam_type_id: number;
  practice_count?: number;
  convert_of_practice?: number;
  convert_of_exam?: number;
  estimated_mark_per_instructor?: number;
  conversation_mark?: number;
  is_active?: boolean;
  details?: CtwResultsModuleEstimatedMarkDetail[];
}

export interface CtwResult {
  id: number;
  ctw_results_module_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id: number;
  remarks?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  module?: CtwResultsModule;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  group?: SystemGroup;
  exam_type?: SystemExam;
  achieved_marks?: CtwResultsAchievedMark[];
}

export interface CtwResultsAchievedMark {
  id: number;
  ctw_result_id: number;
  cadet_id: number;
  user_id: number;
  achieved_mark: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  result?: CtwResult;
  cadet?: User;
  instructor?: User;
}

export interface CtwAssessmentPenpictureGrade {
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
    ctw_assessment_penpicture_grade_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

export interface CtwAssessmentPenpictureResultStrength {
  id: number;
  ctw_assessment_penpicture_result_id: number;
  strength: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CtwAssessmentPenpictureResultWeakness {
  id: number;
  ctw_assessment_penpicture_result_id: number;
  weakness: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CtwAssessmentPenpictureResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  instructor_id: number;
  cadet_id: number;
  ctw_assessment_penpicture_grade_id: number;
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
  cadet?: User;
  grade?: CtwAssessmentPenpictureGrade;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  strengths?: CtwAssessmentPenpictureResultStrength[];
  weaknesses?: CtwAssessmentPenpictureResultWeakness[];
}

// Ctw Assessment Counseling Type
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

// Ctw Assessment Counseling Event
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

// Ctw Assessment Counseling Result Remark
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

// Ctw Assessment Counseling Result
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
