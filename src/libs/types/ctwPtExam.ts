/**
 * CTW PT Exam Types
 */

import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from './system';
import { CadetProfile, User } from './user';

// Result Type
export interface CtwPtExamResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id: number;
  remarks?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  group?: SystemGroup;
  exam_type?: SystemExam;
  instructor?: User;
  creator?: User;
  achieved_marks?: CtwPtExamResultMark[];
}

export interface CtwPtExamResultCreateData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id: number;
  remarks?: string;
  is_active?: boolean;
  marks?: {
    cadet_id: number;
    instructor_id: number;
    achieved_mark: number;
  }[];
}

export interface CtwPtExamResultMarkDetail {
  id: number;
  ctw_result_mark_id: number;
  ctw_results_module_estimated_marks_details_id: number;
  qty: number;
  achieved_time?: string;
  marks: number;
}

// Result Mark Type
export interface CtwPtExamResultMark {
  id: number;
  ctw_result_id: number;
  cadet_id: number;
  user_id: number;
  achieved_mark: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  result?: CtwPtExamResult;
  cadet?: CadetProfile;
  instructor?: User;
  creator?: User;
  details?: CtwPtExamResultMarkDetail[];
}
