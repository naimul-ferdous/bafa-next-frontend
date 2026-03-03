export interface AtwMedicalDisposalSyllabusSchema {
  id: number;
  atw_medical_disposal_syllabus_id: number;
  name: string;
  code?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AtwMedicalDisposalSyllabus {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
  created_by?: number;
  schemas?: AtwMedicalDisposalSyllabusSchema[];
  creator?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface AtwMedicalDisposalSyllabusPayload {
  name: string;
  code?: string;
  is_active: boolean;
  schemas?: Partial<AtwMedicalDisposalSyllabusSchema>[];
}

export interface AtwMedicalDisposalResultSchema {
  id: number;
  atw_medical_disposal_result_id: number;
  atw_medical_disposal_syllabus_schema_id: number;
  result_content?: string;
  is_active: boolean;
  syllabus_schema?: AtwMedicalDisposalSyllabusSchema;
}

export interface AtwMedicalDisposalResult {
  id: number;
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  cadet_id: number;
  atw_medical_disposal_id: number;
  is_active: boolean;
  created_by?: number;
  course?: { id: number; name: string; code?: string };
  semester?: { id: number; name: string; code?: string };
  program?: { id: number; name: string };
  branch?: { id: number; name: string };
  cadet?: { id: number; name: string; cadet_number?: string; rank?: { id: number; name: string; short_name?: string } };
  syllabus?: AtwMedicalDisposalSyllabus;
  result_schemas?: AtwMedicalDisposalResultSchema[];
  creator?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface AtwMedicalDisposalResultPayload {
  course_id: number;
  semester_id: number;
  program_id?: number;
  branch_id?: number;
  cadet_id: number;
  atw_medical_disposal_id: number;
  is_active?: boolean;
  schemas?: { atw_medical_disposal_syllabus_schema_id: number; result_content?: string }[];
}
