export interface CtwMedicalDisposalSyllabusSchema {
  id: number;
  ctw_medical_disposal_syllabus_id: number;
  name: string;
  code?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CtwMedicalDisposalSyllabus {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
  created_by?: number;
  schemas?: CtwMedicalDisposalSyllabusSchema[];
  creator?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface CtwMedicalDisposalSyllabusPayload {
  name: string;
  code?: string;
  is_active: boolean;
  schemas?: Partial<CtwMedicalDisposalSyllabusSchema>[];
}

export interface CtwMedicalDisposalResultSchema {
  id: number;
  ctw_medical_disposal_result_id: number;
  ctw_medical_disposal_syllabus_schema_id: number;
  result_content?: string;
  is_active: boolean;
  syllabus_schema?: CtwMedicalDisposalSyllabusSchema;
}

export interface CtwMedicalDisposalResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  cadet_id: number;
  ctw_medical_disposal_id: number;
  is_active: boolean;
  date?: string;
  created_by?: number;
  course?: { id: number; name: string; code?: string };
  semester?: { id: number; name: string; code?: string };
  program?: { id: number; name: string };
  branch?: { id: number; name: string };
  cadet?: { id: number; name: string; cadet_number?: string; rank?: { id: number; name: string; short_name?: string } };
  syllabus?: CtwMedicalDisposalSyllabus;
  result_schemas?: CtwMedicalDisposalResultSchema[];
  creator?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface CtwMedicalDisposalResultPayload {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  cadet_id: number;
  ctw_medical_disposal_id: number;
  is_active?: boolean;
  date?: string;
  schemas?: { ctw_medical_disposal_syllabus_schema_id: number; result_content?: string }[];
}
