/**
 * FTW 11SQN Flying Types
 * Type definitions for FTW 11SQN Flying entities
 */

import type { User } from './user';

// Flying Type (Mission/Exam)
export interface Ftw11sqnFlyingType {
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
export interface Ftw11sqnFlyingPhaseType {
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
export interface Ftw11sqnFlyingSyllabusExercise {
  id: number;
  ftw_11sqn_flying_syllabus_type_id: number;
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
export interface Ftw11sqnFlyingSyllabusType {
  id: number;
  ftw_11sqn_flying_syllabus_id: number;
  ftw_11sqn_flying_phase_type_id: number;
  sorties: number;
  hours: number | string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  phase_type?: Ftw11sqnFlyingPhaseType;
  exercises?: Ftw11sqnFlyingSyllabusExercise[];
  creator?: User;
}

// Flying Syllabus
export interface Ftw11sqnFlyingSyllabus {
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
  flying_phase_type?: Ftw11sqnFlyingPhaseType;
  syllabus_types?: Ftw11sqnFlyingSyllabusType[];
  creator?: User;
}

// Create/Update Data Types
export interface Ftw11sqnFlyingTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
}

export interface Ftw11sqnFlyingPhaseTypeCreateData {
  type_name: string;
  type_code: string;
  is_active?: boolean;
}

// Exercise create data (nested in syllabus type)
export interface Ftw11sqnFlyingSyllabusExerciseCreateData {
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
export interface Ftw11sqnFlyingSyllabusTypeCreateData {
  id?: number;
  ftw_11sqn_flying_phase_type_id: number;
  sorties?: number;
  hours?: number;
  is_active?: boolean;
  exercises?: Ftw11sqnFlyingSyllabusExerciseCreateData[];
}

// Main Syllabus create data - single API call with all nested data
export interface Ftw11sqnFlyingSyllabusCreateData {
  phase_full_name: string;
  phase_shortname: string;
  phase_symbol?: string;
  phase_sort?: number;
  flying_type_id: number;
  is_active?: boolean;
  syllabus_types?: Ftw11sqnFlyingSyllabusTypeCreateData[];
}

// ==================== Ground Syllabus Types ====================

// Ground Syllabus Exercise
export interface Ftw11sqnGroundSyllabusExercise {
  id: number;
  ftw_11sqn_ground_syllabus_id: number;
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
export interface Ftw11sqnGroundSyllabus {
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
  exercises?: Ftw11sqnGroundSyllabusExercise[];
  creator?: User;
}

// Ground Syllabus Exercise create data
export interface Ftw11sqnGroundSyllabusExerciseCreateData {
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
export interface Ftw11sqnGroundSyllabusCreateData {
  ground_full_name: string;
  ground_shortname: string;
  ground_symbol?: string;
  ground_sort?: number;
  no_of_test?: number;
  highest_mark?: number;
  is_active?: boolean;
  exercises?: Ftw11sqnGroundSyllabusExerciseCreateData[];
}
