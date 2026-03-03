export interface AtwCounselingCadetApproval {
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
  created_at?: string;
  updated_at?: string;
}
