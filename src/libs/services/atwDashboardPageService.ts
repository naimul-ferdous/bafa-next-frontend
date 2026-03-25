import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { AtwAdminStats } from './atwDashboardService';
import type { CombinedViewShortData } from './atwCombinedViewShortService';
import type { AtwInstructorStats, AtwInstructorSubjectProgress } from './atwInstructorStatsService';
import type { ActivityLogEntry } from './activityLogService';
import type { AtwInstructorAssignSubject } from '@/libs/types/user';

export interface AuthoritySubjectRow {
  course_id: number;
  course_name: string;
  semester_id: number;
  semester_name: string;
  program_id: number;
  program_name: string;
  subject_id: number;
  subject_name: string;
  status: 'not_entered' | 'waiting' | 'pending' | 'approved';
}

export interface AuthoritySubjectStatus {
  my_authority: { id: number; sort: number };
  summary: { not_entered: number; waiting: number; pending: number; approved: number };
  total_subjects: number;
  total_cadets: number;
  total_running_courses: number;
  total_fully_approved_courses: number;
  subjects: AuthoritySubjectRow[];
}

export interface AtwDashboardPageData {
  admin_stats: AtwAdminStats | null;
  combined_short: CombinedViewShortData | null;
  olq_combined_short: CombinedViewShortData | null;
  counseling_combined_short: CombinedViewShortData | null;
  instructor_stats: AtwInstructorStats | null;
  subject_progress: AtwInstructorSubjectProgress | null;
  assigned_subjects: AtwInstructorAssignSubject[] | null;
  chart_data: (number | null)[];
  recent_activity: ActivityLogEntry[];
  authority_subject_status: AuthoritySubjectStatus | null;
}

const atwDashboardPageService = {
  async get(params: {
    chartView: 'daily' | 'monthly' | 'yearly';
    userId?: number;
    isInstructor: boolean;
  }): Promise<AtwDashboardPageData> {
    const token = getToken();
    const query = new URLSearchParams({
      chart_view: params.chartView,
      is_instructor: String(params.isInstructor),
      ...(params.userId ? { user_id: String(params.userId) } : {}),
    }).toString();

    const res = await apiClient.get<{ success: boolean; data: AtwDashboardPageData }>(
      `/atw-dashboard-page?${query}`,
      token ?? undefined,
    );

    return res.data;
  },
};

export default atwDashboardPageService;
