export interface CtwCounselingCadetApproval {
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
  course?: { id: number; name: string; code?: string } | null;
  semester?: { id: number; name: string; code?: string } | null;
  program?: { id: number; name: string; code?: string } | null;
  branch?: { id: number; name: string; code?: string } | null;
  cadet?: { id: number; name: string; bd_no?: string } | null;
  authority?: { id: number; sort: number; role?: { name: string }; user?: { name: string } } | null;
  authority_user?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
}
