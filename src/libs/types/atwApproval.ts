export interface AtwResultApprovalAuthority {
  id: number;
  role_id: number;
  is_cadet_approve: boolean;
  is_forward: boolean;
  is_final: boolean;
  is_initial_cadet_approve: boolean;
  is_initial_forward: boolean;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
  };
}

export interface AtwApprovalActionData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number;
  subject_id?: number;
  cadet_ids?: number[];
  status: 'approved' | 'rejected';
  rejected_reason?: string;
}
