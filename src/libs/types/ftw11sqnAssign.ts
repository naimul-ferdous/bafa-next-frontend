interface AssignRelations {
  course?:   { id: number; name: string; code?: string } | null;
  semester?: { id: number; name: string; code?: string } | null;
  program?:  { id: number; name: string; code?: string } | null;
  branch?:   { id: number; name: string; code?: string } | null;
  user?:     { id: number; name: string } | null;
}

export interface Ftw11SqnCounselingAssign extends AssignRelations {
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

export interface Ftw11SqnOlqAssign extends AssignRelations {
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

export interface Ftw11SqnPenpictureAssign extends AssignRelations {
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

export interface Ftw11SqnWarningAssign extends AssignRelations {
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

export interface Ftw11SqnCommandAssign extends AssignRelations {
  id: number;
  ftw_11sqn_assessment_command_type_id: number;
  course_id: number;
  user_id: number | null;
  semester_id: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
