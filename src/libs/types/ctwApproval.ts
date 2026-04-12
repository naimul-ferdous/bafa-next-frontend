/**
 * CTW Result Approval Types
 * Same architecture as ATW approval but without program-level approval
 */

export interface CtwResultApprovalAuthority {
  id: number;
  role_id: number | null;
  user_id: number | null;
  sort: number;
  is_cadet_approve: boolean;
  is_forward: boolean;
  is_final: boolean;
  is_initial_cadet_approve: boolean;
  is_initial_forward: boolean;
  is_semester_forward: boolean;
  is_signature: boolean;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
}

export interface CtwApprovalActionData {
  course_id: number;
  semester_id: number;
  branch_id?: number;
  group_id?: number;
  module_id?: number;
  ctw_result_id?: number;
  instructor_id?: number;
  cadet_ids?: number[];
  authority_id?: number | null;
  authority_ids?: number[];
  status: 'approved' | 'rejected' | 'pending';
  rejected_reason?: string;
}

export interface CtwRejectedCadetPanelItem {
  cadet_id: number;
  cadet_name: string;
  cadet_bd_no: string;
  module_id: number;
  module_name: string;
  module_code: string;
  course_id: number;
  semester_id: number;
  result_id: number | null;
  course: { id: number; name: string } | null;
  semester: { id: number; name: string } | null;
  rejected_by: string;
  rejected_reason: string | null;
  state: 'authority_rejected' | 'oic_rejected' | 'instructor_updated' | 'updated_pending_review';
  message: string;
  can_resubmit: boolean;
}

export interface CtwCadetApproval {
  id: number;
  ctw_result_achieved_mark_id: number;
  authority_id: number;
  cadet_id: number;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  cadet?: {
    id: number;
    name: string;
    cadet_number?: string;
    assigned_ranks?: { rank?: { id: number; name: string; short_name?: string } }[];
  };
  authority?: CtwResultApprovalAuthority;
  approver?: {
    id: number;
    name: string;
  };
}

export interface CtwModuleApproval {
  id: number;
  ctw_result_id?: number | null;
  ctw_results_module_id: number;
  course_id: number;
  semester_id: number;
  authority_id: number;
  status: 'pending' | 'approved' | 'rejected';
  forwarded_by?: number | null;
  approved_by?: number | null;
  forwarded_at?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  module?: {
    id: number;
    full_name: string;
    code: string;
  };
  authority?: CtwResultApprovalAuthority;
  forwarder?: { id: number; name: string };
  approver?: { id: number; name: string };
}

export interface CtwSemesterApproval {
  id: number;
  course_id: number;
  semester_id: number;
  authority_id: number;
  status: 'pending' | 'approved' | 'rejected';
  forwarded_by?: number | null;
  approved_by?: number | null;
  forwarded_at?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  course?: { id: number; name: string };
  semester?: { id: number; name: string };
  authority?: CtwResultApprovalAuthority;
  forwarder?: { id: number; name: string };
  approver?: { id: number; name: string };
}
