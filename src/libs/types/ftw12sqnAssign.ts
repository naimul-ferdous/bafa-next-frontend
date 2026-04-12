interface AssignRelations {
  course?:   { id: number; name: string; code?: string } | null;
  semester?: { id: number; name: string; code?: string } | null;
  program?:  { id: number; name: string; code?: string } | null;
  branch?:   { id: number; name: string; code?: string } | null;
  user?:     { id: number; name: string } | null;
}

export interface Ftw12SqnCounselingAssign extends AssignRelations {
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

export interface Ftw12SqnOlqAssign extends AssignRelations {
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

export interface Ftw12SqnPenpictureAssign extends AssignRelations {
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

export interface Ftw12SqnWarningAssign extends AssignRelations {
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
