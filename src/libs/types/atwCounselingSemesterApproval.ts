export interface AtwCounselingSemesterApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  status: 'pending' | 'approved' | 'rejected';
  forwarded_by?: number;
  forwarded_at?: string;
  current_authority_id?: number;
  created_at?: string;
  updated_at?: string;
}
