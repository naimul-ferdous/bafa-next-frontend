export interface Ftw12SqnCounselingSemesterApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  current_authority_id: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'forwarded';
  rejected_reason: string | null;
  forwarded_at: string | null;
  forwarded_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  is_active: boolean;
}
