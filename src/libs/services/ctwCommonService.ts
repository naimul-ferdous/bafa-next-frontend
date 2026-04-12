/**
 * CTW Common Service
 * Single-call API endpoints for CTW form options
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { SystemCourse, SystemProgram, SystemBranch, SystemGroup, SystemExam } from '@/libs/types/system';

export interface CtwModuleInfo {
  id: number;
  code: string;
  full_name: string;
  short_name: string;
  instructor_count: number;
  total_mark: number;
  [key: string]: any;
}

export interface CtwModuleFormOptions {
  courses: SystemCourse[];
  programs: SystemProgram[];
  branches: SystemBranch[];
  groups: SystemGroup[];
  exams: SystemExam[];
  module: CtwModuleInfo | null;
}

interface CtwModuleFormOptionsResponse {
  success: boolean;
  message: string;
  data: CtwModuleFormOptions;
}

export const ctwCommonService = {
  /**
   * Get all form options for any CTW module result form in a single call.
   * Returns instructor-filtered courses (only courses assigned to this instructor for this module),
   * plus programs, branches, groups, exams, and the module object.
   */
  async getModuleFormOptions(instructorId: number, moduleCode: string): Promise<CtwModuleFormOptions | null> {
    try {
      const token = getToken();
      const result = await apiClient.get<CtwModuleFormOptionsResponse>(
        `/ctw-common/module-form-options?instructor_id=${instructorId}&module_code=${moduleCode}`,
        token
      );
      return result?.data || null;
    } catch (error) {
      console.error(`Failed to fetch module form options for ${moduleCode}:`, error);
      return null;
    }
  },

  /**
   * Shorthand for foot drill module form options.
   */
  async getFootDrillFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'foot_drill');
  },
  /**
   * Shorthand for one mile module form options.
   */
  async getOneMileFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'one_mile');
  },
  /**
   * Shorthand for 2km module form options.
   */
  async getTwoKmFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, '2_km');
  },
  /**
   * Shorthand for 3km module form options.
   */
  async getThreeKmFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, '3_km');
  },
  /**
   * Shorthand for 2km 5 station module form options.
   */
  async getTwoKmFiveStationFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, '2km_5_station');
  },
  /**
   * Shorthand for 2km 10 station module form options.
   */
  async getTwoKmTenStationFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, '2_km_10_station');
  },
  /**
   * Shorthand for hurdles module form options.
   */
  async getHurdlesFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'hurdle_test');
  },
  /**
   * Shorthand for pt exam module form options.
   */
  async getPtExamFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'pt_exam');
  },
  /**
   * Shorthand for firing module form options.
   */
  async getFiringFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'firing');
  },
  /**
   * Shorthand for sword drill module form options.
   */
  async getSwordDrillFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'sword_drill');
  },
  /**
   * Shorthand for arms drill module form options.
   */
  async getArmsDrillFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'arms_drill');
  },
  /**
   * Shorthand for leadership skill module form options.
   */
  async getLeadershipSkillFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'leadership_skill');
  },
  /**
   * Shorthand for written module form options.
   */
  async getWrittenFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'written');
  },
  /**
   * Shorthand for camping module form options.
   */
  async getCampingFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'camping');
  },
  /**
   * Shorthand for games module form options.
   */
  async getGamesFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'games');
  },
  /**
   * Shorthand for gsk module form options.
   */
  async getGskFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'gsk');
  },
  /**
   * Shorthand for swimming module form options.
   */
  async getSwimmingFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'Swimming');
  },
  /**
   * Shorthand for pf assessment module form options.
   */
  async getPfAssessmentFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'pf_assessment');
  },
  /**
   * Shorthand for dt assessment module form options.
   */
  async getDtAssessmentFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'dt_assessment');
  },
  /**
   * Shorthand for gsto assessment module form options.
   */
  async getGstoAssessmentFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'gsto_assessment');
  },
  /**
   * Shorthand for bma module form options.
   */
  async getBmaFormOptions(instructorId: number): Promise<CtwModuleFormOptions | null> {
    return this.getModuleFormOptions(instructorId, 'bma');
  },
};

export default ctwCommonService;
