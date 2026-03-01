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
  branch_id: number;
  group_id?: number;
  subject_id?: number;
  instructor_id?: number;
  cadet_ids?: number[];
  authority_id?: number | null;
  authority_ids?: number[];
  status: 'approved' | 'rejected' | 'pending';
  rejected_reason?: string;
}
