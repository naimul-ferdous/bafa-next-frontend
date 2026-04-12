export interface Ftw11SqnOlqCadetApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  cadet_id: number;
  authority_id: number;
  authority_user_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  approved_by: number | null;
  approved_date: string | null;
  created_at?: string;
  updated_at?: string;
  course?: { id: number; name: string } | null;
  semester?: { id: number; name: string } | null;
  program?: { id: number; name: string } | null;
  branch?: { id: number; name: string } | null;
  cadet?: { id: number; name: string; chest_no?: string } | null;
  authority?: { id: number; sort: number; is_cadet_approve: boolean; is_final: boolean } | null;
  authority_user?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
}
