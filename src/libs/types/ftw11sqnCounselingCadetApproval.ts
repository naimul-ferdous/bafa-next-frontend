export interface Ftw11SqnCounselingCadetApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  cadet_id: number;
  authority_id: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_date?: string;
  rejection_reason?: string;
  approver?: {
    id: number;
    name: string;
    signature?: string;
    rank?: { id: number; name: string; short_name?: string };
    roles?: { id: number; name: string; slug?: string; pivot?: { is_primary: boolean } }[];
  };
  authority?: { id: number; role?: { id: number; name: string } };
  created_at?: string;
  updated_at?: string;
}
