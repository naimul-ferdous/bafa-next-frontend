import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';
import type { CtwAdminStats } from './ctwDashboardService';
import type { CtwCombinedViewShortData } from './ctwCombinedViewShortService';
import type { CtwInstructorStats, CtwInstructorSubjectProgress } from './ctwInstructorStatsService';
import type { ActivityLogEntry } from './activityLogService';
import type { CtwInstructorAssignModule } from '@/libs/types/user';

export interface AuthorityModuleRow {
  course_id: number;
  course_name: string;
  semester_id: number;
  semester_name: string;
  program_id: number;
  program_name: string;
  module_id: number;
  module_name: string;
  status: 'not_entered' | 'waiting' | 'pending' | 'approved';
}

export interface AuthorityModuleStatus {
  my_authority: { id: number; sort: number };
  summary: { not_entered: number; waiting: number; pending: number; approved: number };
  total_modules: number;
  total_cadets: number;
  total_running_courses: number;
  total_fully_approved_courses: number;
  modules: AuthorityModuleRow[];
}

export interface CtwDashboardPageData {
  admin_stats: CtwAdminStats | null;
  combined_short: CtwCombinedViewShortData | null;
  olq_combined_short: CtwCombinedViewShortData | null;
  counseling_combined_short: CtwCombinedViewShortData | null;
  instructor_stats: CtwInstructorStats | null;
  module_progress: CtwInstructorSubjectProgress | null;
  assigned_modules: CtwInstructorAssignModule[] | null;
  chart_data: (number | null)[];
  recent_activity: ActivityLogEntry[];
  authority_module_status: AuthorityModuleStatus | null;
}

const ctwDashboardPageService = {
  async get(params: {
    chartView: 'daily' | 'monthly' | 'yearly';
    userId?: number;
    isInstructor: boolean;
  }): Promise<CtwDashboardPageData> {
    const token = getToken();
    const query = new URLSearchParams({
      chart_view: params.chartView,
      is_instructor: String(params.isInstructor),
      ...(params.userId ? { user_id: String(params.userId) } : {}),
    }).toString();

    const res = await apiClient.get<{ success: boolean; data: CtwDashboardPageData }>(
      `/ctw-dashboard-page?${query}`,
      token ?? undefined,
    );

    return res.data;
  },
};

export default ctwDashboardPageService;
