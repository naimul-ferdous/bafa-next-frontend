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
import { Ftw11SqnCommandCadetApproval } from './ftw11sqnCommandCadetApproval';
import { Ftw11SqnCommandSemesterApproval } from './ftw11sqnCommandSemesterApproval';

// Command Type Estimated Mark
export interface Ftw11SqnAssessmentCommandTypeEstimatedMark {
  id: number;
  ftw_11sqn_assessment_command_type_id: number;
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
export interface Ftw11SqnAssessmentCommandTypeAssignment {
  id: number;
  ftw_11sqn_assessment_command_type_id: number;
  course_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  command_type?: Ftw11SqnAssessmentCommandType;
}

// Legacy Semester Mapping (Restored for compatibility)
export interface Ftw11SqnAssessmentCommandTypeSemester {
  id: number;
  ftw_11sqn_assessment_command_type_id: number;
  semester_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  semester?: SystemSemester;
}

// Command Type
export interface Ftw11SqnAssessmentCommandType {
  id: number;
  type_name: string;
  type_code: string;
  is_multiplier: boolean;
  multiplier?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_marks?: Ftw11SqnAssessmentCommandTypeEstimatedMark[];
  assignments?: Ftw11SqnAssessmentCommandTypeAssignment[];
  semesters?: Ftw11SqnAssessmentCommandTypeAssignment[] | Ftw11SqnAssessmentCommandTypeSemester[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// Command Result Mark
export interface Ftw11SqnAssessmentCommandResultMark {
  id: number;
  ftw_11sqn_assessment_command_result_cadet_id: number;
  ftw_11sqn_assessment_command_type_estimated_mark_id: number;
  achieved_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  estimated_mark?: Ftw11SqnAssessmentCommandTypeEstimatedMark;
}

// Command Result Cadet
export interface Ftw11SqnAssessmentCommandResultCadet {
  id: number;
  ftw_11sqn_assessment_command_result_id: number;
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
  marks?: Ftw11SqnAssessmentCommandResultMark[];
}

// Command Result
export interface Ftw11SqnAssessmentCommandResult {
  id: number;
  course_id: number;
  semester_id: number;
  ftw_11sqn_assessment_command_type_id: number;
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
  command_type?: Ftw11SqnAssessmentCommandType;
  commandType?: Ftw11SqnAssessmentCommandType;
  Command_type?: Ftw11SqnAssessmentCommandType;
  creator?: User;
  result_cadets?: Ftw11SqnAssessmentCommandResultCadet[];
  grouped_cadets?: {
    name: string;
    is_flying_group?: boolean;
    cadets: Ftw11SqnAssessmentCommandResultCadet[];
  }[];
  cadet_approvals?: Ftw11SqnCommandCadetApproval[];
  semester_approvals?: Ftw11SqnCommandSemesterApproval[];
}

// Create/Update Data Types
export interface Ftw11SqnAssessmentCommandTypeCreateData {
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

export interface Ftw11SqnAssessmentCommandResultCreateData {
  course_id: number;
  semester_id: number;
  ftw_11sqn_assessment_command_type_id: number;
  date?: string;
  status?: string;
  remarks?: string;
  instructor_id?: number;
  cadets?: Ftw11SqnAssessmentCommandResultCadetCreateData[];
}

export interface Ftw11SqnAssessmentCommandResultCadetCreateData {
  cadet_id: number;
  bd_no?: string;
  is_present?: boolean;
  absent_reason?: string;
  marks?: Ftw11SqnAssessmentCommandResultMarkCreateData[];
}

export interface Ftw11SqnAssessmentCommandResultMarkCreateData {
  ftw_11sqn_assessment_command_type_estimated_mark_id: number;
  achieved_mark: number;
}


