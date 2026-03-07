/**
 * User and Related Entity Types
 */

import type { Permission } from './menu';
import type { SystemSemester, SystemProgram } from './system';
import type { CtwResultsModule } from './ctw';

export interface User {
  id: number;
  service_number: string;
  name: string;
  email: string;
  phone?: string;
  rank_id?: number;
  date_of_birth?: string | null;
  date_of_joining?: string;
  blood_group?: string | null;
  address?: string | null;
  profile_photo?: string | null;
  signature?: string | null;
  is_active: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  rank?: Rank;
  role?: Role;  // Primary role (appended by backend for approval status)
  roles?: Role[];
  role_assignments?: RoleAssignment[];
  roleAssignments?: RoleAssignment[];  // Alternative naming from backend
  instructor_biodata?: InstructorBiodata;
  assign_wings?: InstructorAssignWing[];
  atw_assigned_subjects?: AtwInstructorAssignSubject[];
  atw_assigned_cadets?: AtwInstructorAssignCadet[];
  ctw_assigned_modules?: CtwInstructorAssignModule[];
  ctw_assigned_cadets?: CtwInstructorAssignCadet[];
}

export interface Official {
  id: number;
  user_id: number;
  service_number: string;
  contact_number?: string;
  date_of_birth?: string;
  blood_group?: string;
  joining_date?: string;
  status: 'active' | 'inactive';
  is_admin: boolean;
  is_instructor: boolean;
  rank_id: number;
  wing_id: number;
  official_type_id: number;
  rank?: Rank;
  wing?: Wing;
  official_type?: OfficialType;
  admin?: Admin;
}

export interface Cadet {
  id: number;
  user_id: number;
  service_number: string;
  contact_number?: string;
  date_of_birth?: string;
  blood_group?: string;
  joining_date?: string;
  status: 'active' | 'inactive';
  wing_id: number;
  sub_wing_id?: number;
  rank_id: number;
  wing?: Wing;
  sub_wing?: SubWing;
  rank?: Rank;
}

export interface CadetAssignment {
  id: number;
  cadet_id: number;
  start_date: string;
  end_date?: string;
  description?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CadetRankAssignment extends CadetAssignment {
  rank_id: number;
  rank?: Rank;
}

export interface CadetCourseAssignment extends CadetAssignment {
  course_id: number;
  result?: string;
  grade?: number;
  course?: SystemCourse;
}

export interface CadetSemesterAssignment extends CadetAssignment {
  semester_id: number;
  result?: string;
  is_current?: boolean;
  semester?: SystemSemester;
}

export interface CadetWingAssignment extends CadetAssignment {
  wing_id: number;
  wing?: Wing;
}

export interface CadetSubWingAssignment extends CadetAssignment {
  sub_wing_id: number;
  sub_wing?: SubWing;
}

export interface CadetProgramAssignment extends CadetAssignment {
  program_id: number;
  program?: SystemProgram;
}

export interface CadetGroupAssignment extends CadetAssignment {
  group_id: number;
  group?: SystemGroup;
}

export interface CadetBranchAssignment extends CadetAssignment {
  branch_id: number;
  branch?: SystemBranch;
}

export interface SystemBranch {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export interface CadetProfile {
  id: number;
  cadet_number: string;
  bd_no?: string;
  name: string;
  name_bangla?: string;
  short_name?: string;
  email?: string;
  phone?: string;
  contact_no?: string;
  rank_id?: number;
  date_of_birth?: string;
  date_of_joining?: string;
  gender?: 'male' | 'female' | 'other';
  have_professional?: boolean;
  blood_group?: string;
  religion?: string;
  caste?: string;
  marital_status?: string;
  weight?: string;
  height?: string;
  eye_color?: string;
  hair_color?: string;
  identification_mark?: string;
  complexion?: string;
  nid_no?: string;
  passport_no?: string;
  driving_license_no?: string;
  enrollment_date?: string;
  
  // Addresses
  permanent_division?: number;
  permanent_district?: number;
  permanent_post_office?: number;
  permanent_post_code?: string;
  permanent_address?: string;
  
  present_division?: number;
  present_district?: number;
  present_post_office?: number;
  present_post_code?: string;
  present_address?: string;
  
  guardian_division?: number;
  guardian_district?: number;
  guardian_post_office?: number;
  guardian_post_code?: string;
  guardian_address?: string;

  // Activities
  game_sports?: string;
  sports_club?: string;
  hobbies?: string;
  special_qualification?: string;
  social_activities?: string;
  cultural_activities?: string;

  // Promotions
  arrival_date_bma?: string;
  arrival_date_bafa?: string;
  second_promotion_date?: string;
  third_promotion_date?: string;
  forth_promotion_date?: string;
  five_promotion_date?: string;
  six_promotion_date?: string;

  address?: string;
  batch?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  medical_conditions?: string;
  emergency_phone?: string;
  emergency_contact_email?: string;
  profile_photo?: string;
  profile_picture?: string;
  is_active: boolean;
  status: 'active' | 'suspended' | 'graduated' | 'dismissed' | 'on_leave';
  suspension_reason?: string;
  suspension_start_date?: string;
  suspension_end_date?: string;
  created_at: string;
  updated_at: string;
  rank?: Rank;
  assigned_ranks?: CadetRankAssignment[];
  assigned_courses?: CadetCourseAssignment[];
  assigned_semesters?: CadetSemesterAssignment[];
  assigned_wings?: CadetWingAssignment[];
  assigned_sub_wings?: CadetSubWingAssignment[];
  assigned_programs?: CadetProgramAssignment[];
  assigned_groups?: CadetGroupAssignment[];
  assigned_branchs?: CadetBranchAssignment[];
  family_members?: any[];
  educations?: any[];
  educational_records?: any[];
  army_relations?: any[];
  political_relations?: any[];
  politics_relations?: any[];
  languages?: any[];
  visits_abroad?: any[];
  visitAbord?: any[];
  before_bafa_employees?: any[];
  employments?: any[];
  banks?: any[];
  bank_infos?: any[];
  next_of_kins?: any[];
  insurances?: any[];
  insurance_infos?: any[];
  nominees?: any[];
  nominee_infos?: any[];
}

export interface SystemCourse {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export interface SystemGroup {
  id: number;
  name: string;
  code: string;
  description?: string;
  capacity?: number;
  current_strength?: number;
  formation_date?: string;
  is_active?: boolean;
}

export interface Rank {
  id: number;
  name: string;
  short_name: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wing {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubWing {
  id: number;
  name: string;
  code?: string;
  wing_id: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  wing?: Wing;
}

export interface OfficialType {
  id: number;
  name: string;
  description?: string;
}

export interface Admin {
  id: number;
  official_id: number;
  admin_type_id: number;
  admin_type?: AdminType;
}

export interface AdminType {
  id: number;
  name: string;
  scope_level: 'system' | 'wing' | 'sub_wing';
  hierarchy_level: number;
  description?: string;
}

export interface WingAssignment {
  id: number;
  user_id: number;
  role_id: number;
  wing_id: number;
  sub_wing_id?: number;
  assigned_at: string;
  role?: Role;
  wing?: Wing;
  sub_wing?: SubWing;
}

export interface SystemRoleAssignment {
  id: number;
  user_id: number;
  role_id: number;
  assigned_at: string;
  assigned_by?: number;
  role?: Role;
}

export interface Role {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  wing_id?: number | null;
  subwing_id?: number | null;
  is_super_admin?: boolean;
  is_role_switch?: boolean;
  is_manage?: boolean;
  is_marge_role?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
  pivot?: RolePivot;
  wing?: Wing;
  subwing?: SubWing;
}

export interface RolePivot {
  user_id: number;
  role_id: number;
  wing_id?: number | null;
  sub_wing_id?: number | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  id: number;
  user_id: number;
  role_id: number;
  wing_id?: number | null;
  sub_wing_id?: number | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role | null;
  wing?: Wing | null;
  sub_wing?: SubWing | null;
}

export interface SystemDivision {
  id: number;
  name: string;
  bn_name?: string;
  is_active?: boolean;
}

export interface SystemDistrict {
  id: number;
  division_id: number;
  name: string;
  bn_name?: string;
  is_active?: boolean;
}

export interface SystemPostOffice {
  id: number;
  district_id: number;
  name: string;
  bn_name?: string;
  post_code?: string;
  is_active?: boolean;
}

export interface InstructorChild {
  id: number;
  instructor_biodata_id: number;
  name: string;
  gender: 'son' | 'daughter';
}

export interface InstructorLanguage {
  id: number;
  instructor_biodata_id: number;
  language: string;
  write: boolean;
  read: boolean;
  speak: boolean;
}

export interface InstructorCertification {
  id: number;
  instructor_biodata_id: number;
  exam_full_name: string;
  exam_short_name?: string;
  passing_year?: string;
  grade?: string;
  out_of?: string;
  institute_name?: string;
  others?: string;
}

export interface InstructorAchievement {
  id: number;
  instructor_biodata_id: number;
  achievement_title: string;
  description?: string;
  achievement_date?: string;
  awarded_by?: string;
}

export interface InstructorBiodata {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: User;

  // Basic Information
  name_bangla?: string;
  short_name?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  date_of_birth?: string;
  weight?: string;
  height?: string;
  blood_group?: string;
  hair_color?: string;
  eye_color?: string;
  caste?: string;
  complexion?: string;
  identification_mark?: string;
  other_information?: string;

  // Contact Information
  national_id?: string;
  imo?: string;
  whatsapp?: string;
  viber?: string;
  facebook_id?: string;
  driving_license?: string;
  passport?: string;

  // Spouse Information
  has_spouse?: boolean;
  spouse_name?: string;
  spouse_gender?: string;
  has_children?: boolean;

  // Office Information
  unit?: string;
  trade?: string;
  date_of_commission?: string;
  joining_date?: string;
  employee_type?: string;
  legend?: string;
  posting_date?: string;

  // Present Address
  present_division?: string;
  present_district?: string;
  present_post_office?: string;
  present_post_code?: string;
  present_address?: string;
  present_division_data?: SystemDivision;
  present_district_data?: SystemDistrict;
  present_post_office_data?: SystemPostOffice;

  // Permanent Address
  permanent_division?: string;
  permanent_district?: string;
  permanent_post_office?: string;
  permanent_post_code?: string;
  permanent_address?: string;
  permanent_division_data?: SystemDivision;
  permanent_district_data?: SystemDistrict;
  permanent_post_office_data?: SystemPostOffice;

  // Guardian Address
  guardian_division?: string;
  guardian_district?: string;
  guardian_post_office?: string;
  guardian_post_code?: string;
  guardian_address?: string;
  guardian_division_data?: SystemDivision;
  guardian_district_data?: SystemDistrict;
  guardian_post_office_data?: SystemPostOffice;

  // Professional Information
  specialization?: string;
  qualification?: string;
  years_of_experience?: number;
  instructor_since?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Related data
  children?: InstructorChild[];
  languages?: InstructorLanguage[];
  certifications?: InstructorCertification[];
  achievements?: InstructorAchievement[];
  wing_data?: InstructorWingData[];
  sub_wing_data?: InstructorSubWingData[];
}

export interface InstructorWingData {
  id: number;
  instructor_biodata_id: number;
  wing_id: number;
  assigned_date: string;
  end_date?: string;
  position?: string;
  responsibilities?: string;
  courses_taught?: string[];
  is_active: boolean;
  wing?: Wing;
}

export interface InstructorSubWingData {
  id: number;
  instructor_biodata_id: number;
  sub_wing_id: number;
  assigned_date: string;
  end_date?: string;
  position?: string;
  responsibilities?: string;
  courses_taught?: string[];
  students_count?: number;
  is_active: boolean;
  sub_wing?: SubWing;
}

export interface InstructorAssignWing {
  id: number;
  wing_id: number;
  subwing_id?: number | null;
  instructor_id: number;
  is_active: boolean;
  status: 'pending' | 'processing' | 'approved';
  created_at: string;
  updated_at: string;
  wing?: Wing;
  sub_wing?: SubWing;
  instructor?: User;
}

import type { AtwSubjectModule } from './system';

export interface AtwInstructorAssignSubject {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  subject_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  instructor?: User;
  subject?: AtwSubjectModule;
  course?: SystemCourse;
  semester?: SystemSemester;
  program?: SystemProgram;
}

export interface AtwInstructorAssignCadet {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number | null;
  subject_id: number;
  cadet_id: number;
  is_active: boolean;
  instructor?: User;
  cadet?: User;
  subject?: AtwSubjectModule;
}

export interface CtwInstructorAssignModule {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id: number;
  ctw_results_module_id: number;
  is_active: boolean;
  instructor?: User;
  module?: CtwResultsModule;
  course?: any;
  semester?: any;
  program?: any;
  branch?: any;
  group?: any;
}

export interface CtwInstructorAssignCadet {
  id: number;
  instructor_id: number;
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id: number;
  group_id?: number | null;
  ctw_results_module_id: number;
  cadet_id: number;
  is_active: boolean;
  instructor?: User;
  cadet?: User;
  module?: CtwResultsModule;
}

export interface PermissionsSummary {
  total: number;
  codes: string[];
}
