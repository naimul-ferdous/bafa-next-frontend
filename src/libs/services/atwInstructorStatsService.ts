import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface AtwInstructorStats {
  total_subjects: number;
  total_courses: number;
  total_cadets: number;
  total_results: number;
}

export const atwInstructorStatsService = {
  async getStats(userId: number): Promise<AtwInstructorStats> {
    try {
      const token = getToken();
      const result = await apiClient.get<{ success: boolean; data: AtwInstructorStats }>(
        `/atw-instructor-stats/${userId}`,
        token
      );
      return result?.data ?? { total_subjects: 0, total_courses: 0, total_cadets: 0, total_results: 0 };
    } catch (error) {
      console.error('Failed to fetch instructor stats:', error);
      return { total_subjects: 0, total_courses: 0, total_cadets: 0, total_results: 0 };
    }
  },
};

export default atwInstructorStatsService;
