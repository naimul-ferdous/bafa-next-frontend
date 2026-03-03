export interface AtwOlqSemesterApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number | null;
  branch_id?: number | null;
  status: "pending" | "approved" | "rejected";
  rejected_reason?: string | null;
  forwarded_at?: string | null;
  forwarded_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
