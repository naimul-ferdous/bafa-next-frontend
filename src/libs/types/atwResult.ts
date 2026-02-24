/**
 * ATW Result Types
 * Type definitions for ATW Result entities
 */

import type { User } from './user';
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  SystemGroup,
  SystemExam,
  AtwSubject,
  AtwSubjectMark
} from './system';

// ATW Result Cadet Mark
export interface AtwResultCadetsMark {
  id: number;
  atw_result_getting_cadet_id: number;
  subject_id: number;
  atw_subject_mark_id: number;
  achieved_mark: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  subject?: AtwSubject;
  subject_mark?: AtwSubjectMark;
}

// ATW Result Getting Cadet
export interface AtwResultGettingCadet {
  id: number;
  atw_result_id: number;
  cadet_id: number;
  cadet_bd_no: string;
  remarks?: string;
  is_present: boolean;
  absent_reason?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  cadet?: {
    id: number;
    cadet_number?: string;
    bd_no?: string;
    name: string;
    email?: string;
    gender?: string;
    service_number?: string;
    assigned_ranks?: {
      id: number;
      rank?: {
        id: number;
        name: string;
        short_name: string;
      };
    }[];
    assigned_branchs?: {
      id: number;
      is_current: boolean;
      branch?: {
        id: number;
        name: string;
        code: string;
      };
    }[];
  };
  cadet_marks?: AtwResultCadetsMark[];
}

// ATW Result
export interface AtwResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id: number;
  instructor_id: number;
  atw_subject_id: number;
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
  atw_subject?: AtwSubject;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  result_getting_cadets?: AtwResultGettingCadet[];
}

// Create/Update Data Types
export interface AtwResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  exam_type_id: number;
  atw_subject_id: number;
  is_active?: boolean;
  cadets?: AtwResultCadetCreateData[];
}

export interface AtwResultCadetCreateData {
  cadet_id: number;
  cadet_bd_no: string;
  remarks?: string;
  is_present?: boolean;
  absent_reason?: string;
  is_active?: boolean;
  marks?: AtwResultCadetMarkCreateData[];
}

export interface AtwResultCadetMarkCreateData {
  subject_id: number;
  atw_subject_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
