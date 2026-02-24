/**
 * CTW Arms Drill Types
 */

import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from './system';
import { CadetProfile, User } from './user';

// Estimated Mark Type
export interface CtwArmsDrillAssessmentEstimatedMark {
  id: number;
  semester_id: number;
  exam_type_id: number;
  estimated_mark_per_instructor: number | null;
  conversation_mark: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;

  // Relations
  semester?: SystemSemester;
  exam_type?: SystemExam;
}

export interface CtwArmsDrillAssessmentEstimatedMarkCreateData {
  semester_id: number;
  exam_type_id: number;
  estimated_mark_per_instructor?: number;
  conversation_mark?: number;
  is_active?: boolean;
}

// Result Type
export interface CtwArmsDrillResult {
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
  achieved_marks?: CtwArmsDrillResultMark[];
}

export interface CtwArmsDrillResultCreateData {
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

// Result Mark Type
export interface CtwArmsDrillResultMark {
  id: number;
  ctw_arms_drill_result_id: number;
  cadet_id: number;
  instructor_id: number;
  achieved_mark: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  arms_drill_result?: CtwArmsDrillResult;
  cadet?: CadetProfile;
  instructor?: User;
  creator?: User;
}

export interface CtwArmsDrillResultMarkCreateData {
  cadet_id: number;
  instructor_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
