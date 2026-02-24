/**
 * CPTC Service
 * API calls for CPTC module
 */

import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface CptcConsolidatedData {
  id: number;
  name: string;
  code: string;
  counts: {
    semesters: number;
    branches: number;
    programs: number;
    instructors: number;
    cadets: number;
  };
  branch_details?: Array<{
    category: string;
    branches: any[];
  }>;
  semesters_details: Array<{
    id: number;
    name: string;
    code: string;
    atw: any;
    ctw: {
      results: any[];
      olq_results: any[];
    };
    ftw: {
      '11sqn': {
        flying_marks: any[];
        ground_marks: any[];
        olq_results: any[];
      };
      '12sqn': {
        flying_marks: any[];
        ground_marks: any[];
        olq_results: any[];
      };
    };
    olq_summary: any[];
  }>;
  syllabus: {
    atw: any[];
    ctw: any[];
    ftw11: {
      flying: any[];
      ground: any[];
    };
    ftw12: {
      flying: any[];
      ground: any[];
    };
  };
  ctw?: {
    syllabus: any[];
  };
}

export interface CptcCtwConsolidatedData {
  course_details: {
    id: number;
    name: string;
    code: string;
    semesters: Array<{
      id: number;
      name: string;
      code: string;
    }>;
  };
  results: Array<{
    branch_name: string;
    results: any[];
  }>;
  modules: any[];
}

interface CptcApiResponse {
  success: boolean;
  message: string;
  data: CptcConsolidatedData[];
}

interface CptcSingleApiResponse {
  success: boolean;
  message: string;
  data: {
    course_details: CptcConsolidatedData;
  };
}

interface CptcCtwApiResponse {
  success: boolean;
  message: string;
  data: CptcCtwConsolidatedData;
}

export const cptcService = {
  /**
   * Get consolidated results data for all courses
   */
  async getConsolidatedResults(): Promise<CptcConsolidatedData[]> {
    try {
      const endpoint = `/cptc/consolidated/course/results`;
      
      const token = getToken();
      const result = await apiClient.get<CptcApiResponse>(endpoint, token);

      if (!result || !result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch CPTC consolidated results:', error);
      return [];
    }
  },

  /**
   * Get consolidated results data for a specific course
   */
  async getConsolidatedResultsByCourse(courseId: number): Promise<CptcConsolidatedData | null> {
    try {
      const endpoint = `/cptc/consolidated/course/results/${courseId}`;
      
      const token = getToken();
      const result = await apiClient.get<CptcSingleApiResponse>(endpoint, token);

      if (!result || !result.success || !result.data?.course_details) {
        return null;
      }

      return result.data.course_details;
    } catch (error) {
      console.error(`Failed to fetch CPTC consolidated results for course ${courseId}:`, error);
      return null;
    }
  },

  /**
   * Get CTW consolidated results data for a specific course
   */
  async getConsolidatedResultsByCourseCtw(courseId: number): Promise<CptcCtwConsolidatedData | null> {
    try {
      const endpoint = `/cptc/consolidated/course/results/${courseId}/ctw`;
      
      const token = getToken();
      const result = await apiClient.get<CptcCtwApiResponse>(endpoint, token);

      if (!result || !result.success || !result.data) {
        return null;
      }

      return result.data;
    } catch (error) {
      console.error(`Failed to fetch CPTC CTW consolidated results for course ${courseId}:`, error);
      return null;
    }
  },

  /**
   * Get ATW consolidated results data for a specific course
   */
  async getConsolidatedResultsByCourseAtw(courseId: number): Promise<any | null> {
    try {
      const endpoint = `/cptc/consolidated/course/results/${courseId}/atw`;
      
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

      if (!result || !result.success || !result.data) {
        return null;
      }

      return result.data;
    } catch (error) {
      console.error(`Failed to fetch CPTC ATW consolidated results for course ${courseId}:`, error);
      return null;
    }
  },

  /**
   * Get consolidated OLQ results data for a specific course
   */
  async getConsolidatedResultsByCourseOlq(courseId: number): Promise<any | null> {
    try {
      const endpoint = `/cptc/consolidated/course/results/${courseId}/olq`;
      
      const token = getToken();
      const result = await apiClient.get<any>(endpoint, token);

      if (!result || !result.success || !result.data) {
        return null;
      }

      return result.data;
    } catch (error) {
      console.error(`Failed to fetch CPTC OLQ consolidated results for course ${courseId}:`, error);
      return null;
    }
  }
};

export default cptcService;
