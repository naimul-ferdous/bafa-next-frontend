/**
 * FTW 12sqn Flying Types
 * Type definitions for FTW 12sqn Flying entities
 */

import type { User } from './user';

// Flying Type (Mission/Exam)
export interface Ftw12sqnFlyingType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: User;
}

// Flying Phase Type (Dual/Solo)
export interface Ftw12sqnFlyingPhaseType {
  id: number;
  type_name: string;
  type_code: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: User;
}

// Flying Syllabus Exercise
export interface Ftw12sqnFlyingSyllabusExercise {
  id: number;
  ftw_12sqn_flying_syllabus_type_id: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content?: string;
  take_time_hours: number | string;
  remarks?: string;
  exercise_sort: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: User;
}

// Flying Syllabus Type (links syllabus to phase types with sorties/hours)
export interface Ftw12sqnFlyingSyllabusType {
  id: number;
  ftw_12sqn_flying_syllabus_id: number;
  ftw_12sqn_flying_phase_type_id: number;
  sorties: number;
  hours: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  phase_type?: Ftw12sqnFlyingPhaseType;
  exercises?: Ftw12sqnFlyingSyllabusExercise[];
  creator?: User;
}

// Flying Syllabus
export interface Ftw12sqnFlyingSyllabus {
  id: number;
  phase_full_name: string;
  phase_shortname: string;
  phase_symbol?: string;
  phase_sort: number;
  flying_type_id: number;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  flying_phase_type?: Ftw12sqnFlyingPhaseType;
  syllabus_types?: Ftw12sqnFlyingSyllabusType[];
  creator?: User;
}

// Create/Update Data Types
export interface Ftw12sqnFlyingTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
}

export interface Ftw12sqnFlyingPhaseTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
}

// Exercise create data (nested in syllabus type)
export interface Ftw12sqnFlyingSyllabusExerciseCreateData {
  id?: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content?: string;
  take_time_hours?: number;
  remarks?: string;
  exercise_sort?: number;
  is_active?: boolean;
}

// Syllabus Type create data (nested in syllabus)
export interface Ftw12sqnFlyingSyllabusTypeCreateData {
  id?: number;
  ftw_12sqn_flying_phase_type_id: number;
  sorties?: number;
  hours?: number;
  is_active?: boolean;
  exercises?: Ftw12sqnFlyingSyllabusExerciseCreateData[];
}

// Main Syllabus create data - single API call with all nested data
export interface Ftw12sqnFlyingSyllabusCreateData {
  phase_full_name: string;
  phase_shortname: string;
  phase_symbol?: string;
  phase_sort?: number;
  flying_type_id: number;
  is_active?: boolean;
  syllabus_types?: Ftw12sqnFlyingSyllabusTypeCreateData[];
}

// ==================== Ground Syllabus Types ====================

// Ground Syllabus Exercise
export interface Ftw12sqnGroundSyllabusExercise {
  id: number;
  ftw_12sqn_ground_syllabus_id: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content?: string;
  exercise_remarks?: string;
  exercise_sort: number;
  max_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: User;
}

// Ground Syllabus
export interface Ftw12sqnGroundSyllabus {
  id: number;
  ground_full_name: string;
  ground_shortname: string;
  ground_symbol?: string;
  ground_sort: number;
  no_of_test: number;
  highest_mark: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  exercises?: Ftw12sqnGroundSyllabusExercise[];
  creator?: User;
}

// Ground Syllabus Exercise create data
export interface Ftw12sqnGroundSyllabusExerciseCreateData {
  id?: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content?: string;
  exercise_remarks?: string;
  exercise_sort?: number;
  max_mark?: number;
  is_active?: boolean;
}

// Ground Syllabus create data
export interface Ftw12sqnGroundSyllabusCreateData {
  ground_full_name: string;
  ground_shortname: string;
  ground_symbol?: string;
  ground_sort?: number;
  no_of_test?: number;
  highest_mark?: number;
  is_active?: boolean;
  exercises?: Ftw12sqnGroundSyllabusExerciseCreateData[];
}
