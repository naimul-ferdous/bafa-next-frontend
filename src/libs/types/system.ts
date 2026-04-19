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
  short_name?: string;
  code: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  is_flying?: boolean;
  is_academic?: boolean;
  is_gst?: boolean;
  is_active?: boolean;
  is_changeable?: boolean;
  changeable_program?: SystemProgramChangeableSemester;
  created_at?: string;
  updated_at?: string;
}

export interface SystemUniversity {
  id: number;
  name: string;
  short_name?: string;
  code: string;
  is_current?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  departments?: AtwUniversityDepartment[];
}

export interface SystemProgram {
  id: number;
  name: string;
  short_name?: string;
  code: string;
  is_flying?: boolean;
  is_changeable?: boolean;
  description?: string;
  duration_months?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  changeable_semesters?: SystemProgramChangeableSemester[];
}

export interface SystemProgramChangeableSemester {
  id: number;
  name: string;
  short_name?: string;
  code: string;
  semester_id: number;
  program_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

export interface AtwUniversityDepartment {
  id: number;
  name: string;
  code: string;
  university_id: number;
  is_current?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemBranch {
  id: number;
  program_id?: number;
  name: string;
  short_name?: string;
  code: string;
  description?: string;
  category?: string;
  is_flying?: boolean;
  is_university?: boolean;
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
  form_number?: string | null;
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

export interface AtwSubjectsModuleMarksheetMarkCombinedCol {
  id: number;
  combined_mark_id: number;
  referenced_mark_id: number;
  is_active: boolean;
}

export interface AtwSubjectsModuleMarksheetMark {
  id: number;
  atw_subjects_module_marksheet_id: number;
  name: string;
  type?: string;
  percentage: number;
  estimate_mark: number;
  is_active: boolean;
  is_combined: boolean;
  combined_cols?: AtwSubjectsModuleMarksheetMarkCombinedCol[];
  created_at?: string;
  updated_at?: string;
}

export interface AtwMarksheetEditLog {
  id: number;
  atw_subjects_module_marksheet_id: number;
  edited_by: number;
  editor?: { id: number; name: string; service_number?: string; rank?: { id: number; name: string; short_name?: string }; roles?: { id: number; name: string }[] };
  created_at?: string;
}

export interface AtwSubjectsModuleMarksheet {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_by?: number;
  creator?: { id: number; name: string; service_number?: string; rank?: { id: number; name: string; short_name?: string }; roles?: { id: number; name: string }[] };
  marks?: AtwSubjectsModuleMarksheetMark[];
  edit_logs?: AtwMarksheetEditLog[];
  created_at?: string;
  updated_at?: string;
}

export interface AtwSubjectModuleEditLog {
  id: number;
  atw_subject_module_id: number;
  edited_by: number;
  editor?: { id: number; name: string; service_number?: string; rank?: { id: number; name: string; short_name?: string }; roles?: { id: number; name: string }[] };
  created_at?: string;
}

export interface AtwSubjectModule {
  id: number;
  atw_subjects_module_marksheet_id?: number;
  university_id?: number;
  semester_id?: number;
  program_id?: number;
  system_programs_changeable_semester_id?: number;
  university_semester_id?: number;
  atw_university_department_id?: number;
  university?: SystemUniversity;
  semester?: SystemSemester;
  program?: SystemProgram;
  changeable_semester?: SystemProgramChangeableSemester;
  university_semester?: { id: number; name: string; short_name?: string | null } | null;
  university_department?: AtwUniversityDepartment | null;
  subject_name: string;
  subject_code: string;
  subject_legend?: string;
  subject_period?: string;
  subject_type: 'academic' | 'professional';
  subjects_full_mark: number;
  subjects_credit: number;
  is_current: boolean;
  syllabus?: string;
  syllabus_file?: File;
  is_active: boolean;
  created_by?: number;
  creator?: { id: number; name: string; service_number?: string; rank?: { id: number; name: string; short_name?: string }; roles?: { id: number; name: string }[] };
  edit_logs?: AtwSubjectModuleEditLog[];
  created_at?: string;
  updated_at?: string;
  marksheet?: AtwSubjectsModuleMarksheet;
  groups?: AtwSubjectGroup[];
}

export interface AtwSubjectGroup {
  id: number;
  atw_subject_id: number;
  semester_id: number;
  program_id: number;
  system_programs_changeable_semester_id?: number;
  atw_subject_module_id: number;
  is_current: boolean;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
  program?: SystemProgram;
  module?: AtwSubjectModule;
}

export interface AtwSubject {
  id: number;
  name: string;
  code: string;
  slug?: string;
  is_current: boolean;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: User;
  groups?: AtwSubjectGroup[];
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

export interface Ftw11SqnAssessmentPenpictureGrade {
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


export interface Ftw11SqnAssessmentPenpictureResultStrength {
  id: number;
  atw_assessment_penpicture_result_id: number;
  strength: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ftw11SqnAssessmentPenpictureResultWeakness {
  id: number;
  atw_assessment_penpicture_result_id: number;
  weakness: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ftw11SqnAssessmentPenpictureResult {
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
  strengths?: Ftw11SqnAssessmentPenpictureResultStrength[];
  weaknesses?: Ftw11SqnAssessmentPenpictureResultWeakness[];
}

// FTW 11sqn Assessment Counseling Type
export interface Ftw11SqnAssessmentCounselingType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  events?: Ftw11SqnAssessmentCounselingEvent[];
  semesters?: SystemSemester[];
}

// FTW 11sqn Assessment Counseling Event
export interface Ftw11SqnAssessmentCounselingEvent {
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
  counseling_type?: Ftw11SqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// FTW 11sqn Assessment Counseling Result Remark
export interface Ftw11SqnAssessmentCounselingResultRemark {
  id: number;
  ftw_11sqn_assessment_counseling_result_id: number;
  ftw_11sqn_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  event?: Ftw11SqnAssessmentCounselingEvent;
}

// FTW 11sqn Assessment Counseling Result
export interface Ftw11SqnAssessmentCounselingResult {
  total_approved?: number;
  total_counseled?: number;
  total_cadets?: number;
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  ftw_11sqn_assessment_counseling_type_id?: number;
  counseling_date?: string;
  instructor_id?: number;
  cadet_id?: number;
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
  instructor?: User;
  cadet?: {
    id: number;
    name: string;
    bd_no?: string;
    cadet_number?: string;
    assigned_ranks?: { is_current: boolean; rank?: { name: string; short_name?: string } }[];
    assigned_branchs?: { is_current: boolean; branch?: { name: string } }[];
  };
  counseling_type?: Ftw11SqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  remarks?: Ftw11SqnAssessmentCounselingResultRemark[];
}



// FTW 12sqn Assessment Counseling Type
export interface Ftw12SqnAssessmentCounselingType {
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
  events?: Ftw12SqnAssessmentCounselingEvent[];
  semesters?: {
    id: number;
    ftw_12sqn_assessment_counseling_type_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}

// FTW 12sqn Assessment Counseling Event
export interface Ftw12SqnAssessmentCounselingEvent {
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
  counseling_type?: Ftw12SqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// FTW 12sqn Assessment Counseling Result Remark
export interface Ftw12SqnAssessmentCounselingResultRemark {
  id: number;
  ftw_12sqn_assessment_counseling_result_id: number;
  ftw_12sqn_assessment_counseling_event_id: number;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  event?: Ftw12SqnAssessmentCounselingEvent;
}

// FTW 12sqn Assessment Counseling Result
export interface Ftw12SqnAssessmentCounselingResult {
  total_approved?: number;
  total_counseled?: number;
  total_cadets?: number;
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  ftw_12sqn_assessment_counseling_type_id?: number;
  counseling_date?: string;
  instructor_id?: number;
  cadet_id?: number;
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
  instructor?: User;
  cadet?: {
    id: number;
    name: string;
    bd_no?: string;
    cadet_number?: string;
    assigned_ranks?: { is_current: boolean; rank?: { name: string; short_name?: string } }[];
    assigned_branchs?: { is_current: boolean; branch?: { name: string } }[];
  };
  counseling_type?: Ftw12SqnAssessmentCounselingType;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  remarks?: Ftw12SqnAssessmentCounselingResultRemark[];
}


export interface Ftw12SqnAssessmentPenpictureGrade {
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
    ftw12sqn_assessment_penpicture_grade_id: number;
    semester_id: number;
    is_active: boolean;
    semester?: SystemSemester;
  }[];
}


export interface Ftw12SqnAssessmentPenpictureResultStrength {
  id: number;
  ftw12sqn_assessment_penpicture_result_id: number;
  strength: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ftw12SqnAssessmentPenpictureResultWeakness {
  id: number;
  ftw12sqn_assessment_penpicture_result_id: number;
  weakness: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ftw12SqnAssessmentPenpictureResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  instructor_id: number;
  cadet_id: number;
  ftw12sqn_assessment_penpicture_grade_id: number;
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
  grade?: Ftw12SqnAssessmentPenpictureGrade;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  strengths?: Ftw12SqnAssessmentPenpictureResultStrength[];
  weaknesses?: Ftw12SqnAssessmentPenpictureResultWeakness[];
}
