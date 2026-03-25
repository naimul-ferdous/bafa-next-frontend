/**
 * ATW Result Types
 * Type definitions for ATW Result entities
 */

import type { User } from './user';
import type { AtwResultApprovalAuthority } from './atwApproval';
import type {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemProgramChangeableSemester,
  SystemBranch,
  SystemExam,
  AtwSubjectModule,
  AtwSubjectsModuleMarksheetMark
} from './system';

// ATW Result Cadet Mark
export interface AtwResultCadetsMark {
  id: number;
  atw_result_getting_cadet_id: number;
  subject_id: number;
  atw_subjects_module_marksheet_mark_id: number;
  achieved_mark: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  subject?: AtwSubjectModule;
  subject_mark?: AtwSubjectsModuleMarksheetMark;
}

// ATW Result Mark Cadet Approval
export interface AtwResultMarkCadetApproval {
  id: number;
  cadet_id: number;
  authority_id?: number | null;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string | null;
  rejected_by?: number | null;
  rejected_at?: string | null;
  approved_by?: number | null;
  approved_date?: string | null;
  updated_at?: string | null;
  is_active: boolean;
  approver?: { id: number; name: string } | null;
  rejectedBy?: { id: number; name: string } | null;
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
  system_programs_changeable_semester_id?: number | null;
  branch_id: number;
  exam_type_id: number;
  instructor_id: number;
  atw_subject_module_id: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  changeable_program?: SystemProgramChangeableSemester;
  branch?: SystemBranch;
  exam_type?: SystemExam;
  instructor?: User;
  atw_subject_module?: AtwSubjectModule;
  subject?: any;
  atw_subject_id?: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  total_cadets?: number;
  result_getting_cadets?: AtwResultGettingCadet[];
  cadet_approvals?: AtwResultMarkCadetApproval[];
  approval_authorities?: AtwResultApprovalAuthority[];
  approval_stats?: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  subject_approval?: {
    status: 'pending' | 'approved' | 'rejected';
    forwarded_by: number | null;
    approved_by: number | null;
  } | null;
  subject_approvals?: {
    id: number;
    authority_id: number | null;
    status: 'pending' | 'approved' | 'rejected';
    forwarded_by: number | null;
    approved_by: number | null;
  }[];
}

// Create/Update Data Types
export interface AtwResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  system_programs_changeable_semester_id?: number | null;
  branch_id: number;
  exam_type_id: number;
  atw_subject_module_id?: number;
  atw_subject_id?: number;
  instructor_id?: number;
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
  atw_subjects_module_marksheet_mark_id: number;
  achieved_mark: number;
  is_active?: boolean;
}
