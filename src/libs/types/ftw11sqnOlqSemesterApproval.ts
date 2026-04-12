export interface Ftw11SqnOlqSemesterApproval {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number | null;
  branch_id?: number | null;
  current_authority_id?: number | null;
  status: "pending" | "approved" | "rejected";
  rejected_reason?: string | null;
  forwarded_at?: string | null;
  forwarded_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  forwarder?: {
    id: number;
    name: string;
    signature?: string | null;
    rank?: { id: number; name: string; short_name: string } | null;
  } | null;
}
