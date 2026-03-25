export interface AtwResultApprovalAuthority {
  id: number;
  role_id: number | null;
  user_id: number | null;
  sort: number;
  is_cadet_approve: boolean;
  is_forward: boolean;
  is_final: boolean;
  is_initial_cadet_approve: boolean;
  is_initial_forward: boolean;
  is_program_forward: boolean;
  is_signature: boolean;
  is_only_engg: boolean;
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

export interface AtwApprovalActionData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  group_id?: number;
  subject_id?: number;
  instructor_id?: number;
  cadet_ids?: number[];
  authority_id?: number | null;
  authority_ids?: number[];
  status: 'approved' | 'rejected' | 'pending';
  rejected_reason?: string;
}

export interface RejectedCadetPanelItem {
  cadet_id: number;
  cadet_name: string;
  cadet_bd_no: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  course_id: number;
  semester_id: number;
  program_id: number;
  result_id: number | null;
  course: { id: number; name: string } | null;
  semester: { id: number; name: string } | null;
  program: { id: number; name: string } | null;
  rejected_by: string;
  rejected_reason: string | null;
  state: 'authority_rejected' | 'oic_rejected' | 'instructor_updated' | 'updated_pending_review';
  message: string;
  can_resubmit: boolean;
}
