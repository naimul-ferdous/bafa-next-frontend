interface AssignRelations {
  course?:   { id: number; name: string; code?: string } | null;
  semester?: { id: number; name: string; code?: string } | null;
  program?:  { id: number; name: string; code?: string } | null;
  branch?:   { id: number; name: string; code?: string } | null;
  user?:     { id: number; name: string } | null;
}

export interface AtwCounselingAssign extends AssignRelations {
  id: number;
  course_id: number;
  semester_id: number | null;
  program_id: number | null;
  branch_id: number | null;
  user_id: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwOlqAssign extends AssignRelations {
  id: number;
  course_id: number;
  semester_id: number | null;
  program_id: number | null;
  branch_id: number | null;
  user_id: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwPenpictureAssign extends AssignRelations {
  id: number;
  course_id: number;
  semester_id: number | null;
  program_id: number | null;
  branch_id: number | null;
  user_id: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AtwWarningAssign extends AssignRelations {
  id: number;
  course_id: number;
  semester_id: number | null;
  program_id: number | null;
  branch_id: number | null;
  user_id: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
