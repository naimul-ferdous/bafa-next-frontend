/**
 * ATW Assessment Command Types
 * Type definitions for ATW Assessment Command entities
 */

import type { User } from './user';
import type {
  SystemCourse,
  SystemSemester,
  SystemExam
} from './system';
import { Ftw12SqnCommandCadetApproval } from './ftw12sqnCommandCadetApproval';
import { Ftw12SqnCommandSemesterApproval } from './ftw12sqnCommandSemesterApproval';

// Command Type Estimated Mark
export interface Ftw12SqnAssessmentCommandTypeEstimatedMark {
  id: number;
  ftw_12sqn_assessment_command_type_id: number;
  event_name: string;
  event_code: string;
  estimated_mark: number | string;
  order: number;
  remarks?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Command Type Assignment (New Course-based structure)
export interface Ftw12SqnAssessmentCommandTypeAssignment {
  id: number;
  ftw_12sqn_assessment_command_type_id: number;
  course_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  command_type?: Ftw12SqnAssessmentCommandType;
}

// Legacy Semester Mapping (Restored for compatibility)
export interface Ftw12SqnAssessmentCommandTypeSemester {
  id: number;
  ftw_12sqn_assessment_command_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// Command Type
export interface Ftw12SqnAssessmentCommandType {
  id: number;
  type_name: string;
  type_code: string;
  is_multiplier: boolean;
  multiplier?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_marks?: Ftw12SqnAssessmentCommandTypeEstimatedMark[];
  assignments?: Ftw12SqnAssessmentCommandTypeAssignment[];
  semesters?: Ftw12SqnAssessmentCommandTypeAssignment[] | Ftw12SqnAssessmentCommandTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// Command Result Mark
export interface Ftw12SqnAssessmentCommandResultMark {
  id: number;
  ftw_12sqn_assessment_command_result_cadet_id: number;
  ftw_12sqn_assessment_command_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: Ftw12SqnAssessmentCommandTypeEstimatedMark;
}

// Command Result Cadet
export interface Ftw12SqnAssessmentCommandResultCadet {
  id: number;
  ftw_12sqn_assessment_command_result_id: number;
  cadet_id: number;
  bd_no?: string;
  is_present?: boolean;
  absent_reason?: string;
  remarks?: string;
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
    assigned_ranks?: {
      id: number;
      is_current: boolean;
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
        short_name?: string;
      };
    }[];
  };
  marks?: Ftw12SqnAssessmentCommandResultMark[];
}

// Command Result
export interface Ftw12SqnAssessmentCommandResult {
  id: number;
  course_id: number;
  semester_id: number;
  ftw_12sqn_assessment_command_type_id: number;
  date?: string;
  status?: string;
  remarks?: string;
  instructor_id?: number;
  is_active?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  command_type?: Ftw12SqnAssessmentCommandType;
  commandType?: Ftw12SqnAssessmentCommandType;
  Command_type?: Ftw12SqnAssessmentCommandType;
  creator?: User;
  result_cadets?: Ftw12SqnAssessmentCommandResultCadet[];
  grouped_cadets?: {
    name: string;
    is_flying_group?: boolean;
    cadets: Ftw12SqnAssessmentCommandResultCadet[];
  }[];
  cadet_approvals?: Ftw12SqnCommandCadetApproval[];
  semester_approvals?: Ftw12SqnCommandSemesterApproval[];
}

// Create/Update Data Types
export interface Ftw12SqnAssessmentCommandTypeCreateData {
  type_name: string;
  type_code: string;
  is_multiplier?: boolean;
  multiplier?: string;
  is_active?: boolean;
  estimated_marks?: {
    event_name: string;
    event_code: string;
    estimated_mark: number;
    order?: number;
    remarks?: string;
  }[];
  semesters?: number[];
}

export interface Ftw12SqnAssessmentCommandResultCreateData {
  course_id: number;
  semester_id: number;
  ftw_12sqn_assessment_command_type_id: number;
  date?: string;
  status?: string;
  remarks?: string;
  instructor_id?: number;
  cadets?: Ftw12SqnAssessmentCommandResultCadetCreateData[];
}

export interface Ftw12SqnAssessmentCommandResultCadetCreateData {
  cadet_id: number;
  bd_no?: string;
  is_present?: boolean;
  absent_reason?: string;
  marks?: Ftw12SqnAssessmentCommandResultMarkCreateData[];
}

export interface Ftw12SqnAssessmentCommandResultMarkCreateData {
  ftw_12sqn_assessment_command_type_estimated_mark_id: number;
  achieved_mark: number;
}


