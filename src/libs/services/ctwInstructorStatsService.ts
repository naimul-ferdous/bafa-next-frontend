import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface CtwInstructorStats {
  total_subjects: number;
  total_courses: number;
  total_semesters: number;
  total_cadets: number;
  total_results: number;
}

export interface CtwInstructorSubjectProgress {
  total_assigned: number;
  total_entered: number;
  total_approved: number;
  total_entered_not_approved: number;
  total_not_entered: number;
}

export const ctwInstructorStatsService = {
  async getSubjectProgress(userId: number): Promise<CtwInstructorSubjectProgress> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: CtwInstructorSubjectProgress }>(
        `/ctw-instructor-stats/${userId}/subject-progress`,
        token
      );
      return result?.data ?? { total_assigned: 0, total_entered: 0, total_approved: 0, total_entered_not_approved: 0, total_not_entered: 0 };
    } catch (error) {
      console.error('Failed to fetch CTW instructor subject progress:', error);
      return { total_assigned: 0, total_entered: 0, total_approved: 0, total_entered_not_approved: 0, total_not_entered: 0 };
    }
  },

  async getStats(userId: number): Promise<CtwInstructorStats> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: CtwInstructorStats }>(
        `/ctw-instructor-stats/${userId}`,
        token
      );
      return result?.data ?? { total_subjects: 0, total_courses: 0, total_semesters: 0, total_cadets: 0, total_results: 0 };
    } catch (error) {
      console.error('Failed to fetch CTW instructor stats:', error);
      return { total_subjects: 0, total_courses: 0, total_semesters: 0, total_cadets: 0, total_results: 0 };
    }
  },
};

export default ctwInstructorStatsService;
