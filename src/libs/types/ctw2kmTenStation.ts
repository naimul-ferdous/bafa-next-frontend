/**
 * CTW 2KM 10 Station Types
 */

import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from './system';
import { CadetProfile, User } from './user';

// Result Type
export interface Ctw2kmTenStationResult {
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
  achieved_marks?: Ctw2kmTenStationResultMark[];
}

export interface Ctw2kmTenStationResultCreateData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id: number;
  remarks?: string;
  is_active?: boolean;
  ctw_results_module_id?: number;
  instructor_id?: number;
  marks?: {
    cadet_id: number;
    achieved_mark: number;
    details?: {
      ctw_results_module_estimated_marks_details_id?: number;
      marks?: number;
    }[];
  }[];
}

// Result Mark Type
export interface Ctw2kmTenStationResultMarkDetail {
  id: number;
  ctw_results_achieved_mark_id: number;
  ctw_results_module_estimated_marks_details_id?: number;
  marks?: string | number;
  is_active: boolean;
}

export interface Ctw2kmTenStationResultMark {
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
  result?: Ctw2kmTenStationResult;
  cadet?: CadetProfile;
  instructor?: User;
  creator?: User;
  details?: Ctw2kmTenStationResultMarkDetail[];
}
