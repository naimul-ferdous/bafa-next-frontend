/**
 * FTW 12SQN Examination Marks Types
 * Type definitions for FTW 12SQN Flying and Ground Examination Marks
 */

import type { User } from './user';
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemExam
} from './system';

// ============================================
// Flying Examination Mark Types
// ============================================

export interface Ftw12sqnFlyingExaminationMark {
  id: number;
  ftw_12sqn_flying_syllabus_id: number;
  ftw_12sqn_flying_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  exam_type_id: number;
  phase_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present: boolean;
  absent_reason?: string;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relationships
  syllabus?: {
    id: number;
    phase_full_name: string;
    phase_shortname: string;
  };
  exercise?: {
    id: number;
    exercise_name: string;
  };
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  instructor?: User;
  cadet?: {
    id: number;
    name: string;
    bdno?: string;
    bd_no?: string;
    cadet_number?: string;
    rank?: { id: number; name: string };
  };
  examType?: SystemExam;
  phaseType?: {
    id: number;
    type_name: string;
  };
  additionalMarks?: Ftw12sqnFlyingExaminationMarkAdditional[];
}

export interface Ftw12sqnFlyingExaminationMarkAdditional {
  id: number;
  exam_id: number;
  ftw_12sqn_flying_syllabus_id: number;
  ftw_12sqn_flying_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  sorties_name: string;
  exam_type_id: number;
  phase_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present: boolean;
  absent_reason?: string;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relationships
  examMark?: Ftw12sqnFlyingExaminationMark;
  instructor?: User;
}

// ============================================
// Ground Examination Mark Types
// ============================================

export interface Ftw12sqnGroundExaminationMark {
  id: number;
  ftw_12sqn_ground_syllabus_id: number;
  ftw_12sqn_ground_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  exam_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present: boolean;
  absent_reason?: string;
  remark?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relationships
  syllabus?: {
    id: number;
    ground_full_name: string;
    ground_shortname: string;
  };
  exercise?: {
    id: number;
    exercise_name: string;
    exercise_shortname: string;
    max_mark?: string;
  };
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  instructor?: User;
  cadet?: {
    id: number;
    name: string;
    bdno?: string;
    bd_no?: string;
    cadet_number?: string;
    rank?: { id: number; name: string };
  };
  examType?: SystemExam;
}

// ============================================
// Create/Update Data Types
// ============================================

export interface Ftw12sqnFlyingExaminationMarkCreateData {
  ftw_12sqn_flying_syllabus_id: number;
  ftw_12sqn_flying_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  exam_type_id: number;
  phase_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present?: boolean;
  absent_reason?: string;
  remark?: string;
  is_active?: boolean;
}

export interface Ftw12sqnFlyingExaminationMarkAdditionalCreateData {
  exam_id: number;
  ftw_12sqn_flying_syllabus_id: number;
  ftw_12sqn_flying_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  sorties_name: string;
  exam_type_id: number;
  phase_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present?: boolean;
  absent_reason?: string;
  remark?: string;
  is_active?: boolean;
}

export interface Ftw12sqnGroundExaminationMarkCreateData {
  ftw_12sqn_ground_syllabus_id: number;
  ftw_12sqn_ground_syllabus_exercise_id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  instructor_id: number;
  cadet_id: number;
  exam_type_id: number;
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present?: boolean;
  absent_reason?: string;
  remark?: string;
  is_active?: boolean;
}

// ============================================
// Semester Grouped Response Types
// ============================================

export interface SemesterGroupedMark {
  id: number;
  syllabus: {
    id: number;
    ground_full_name: string;
    ground_shortname: string;
  };
  exercise: {
    id: number;
    exercise_name: string;
    exercise_shortname: string;
    max_mark?: string;
  };
  cadet: {
    id: number;
    name: string;
    bdno?: string;
  };
  instructor: {
    id: number;
    name: string;
  };
  exam_type: {
    id: number;
    name: string;
    code: string;
  };
  achieved_mark?: string;
  achieved_time?: string;
  participate_date?: string;
  is_present: boolean;
  absent_reason?: string;
  remark?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemesterDetails {
  semester_info: {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
  };
  total_marks: number;
  total_cadets: number;
  marks: SemesterGroupedMark[];
}

export interface CourseGroupedData {
  course_details: {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
  };
  semester_details: SemesterDetails[];
}