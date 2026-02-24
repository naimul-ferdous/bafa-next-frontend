import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "./system";
import { User } from "./user";
import { Cadet } from "./cadet";

export interface CptcProfessionalCadetMark {
  id: number;
  professional_result_id: number;
  cadet_id: number;
  achieved_mark: number | string; // API returns as string (DECIMAL type)
  is_active: boolean;
  remarks?: string;
  cadet?: Cadet;
  created_at?: string;
  updated_at?: string;
}

export interface CptcProfessionalResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  is_active: boolean;
  created_by?: number;

  // Relationships
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
  branch?: SystemBranch;
  group?: SystemGroup;
  creator?: User;
  cadet_marks?: CptcProfessionalCadetMark[];

  created_at?: string;
  updated_at?: string;
}

export interface CptcProfessionalResultFormData {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  group_id?: number;
  is_active: boolean;
  cadets?: {
    id?: number;
    cadet_id: number;
    achieved_mark: number;
    remarks?: string;
    is_active: boolean;
  }[];
}
