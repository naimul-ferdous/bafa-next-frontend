import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface AtwAuthority {
  id: number;
  role_id: number | null;
  user_id: number | null;
  sort: number;
  is_cadet_approve: boolean;
  is_forward: boolean;
  is_final: boolean;
  is_initial_cadet_approve: boolean;
  is_initial_forward: boolean;
  is_program_forward: boolean;
  is_signature: boolean;
  is_only_engg: boolean;
  is_active: boolean;
  role: { id: number; name: string } | null;
  user: { id: number; name: string } | null;
}

export interface AtwAdminStats {
  courses: number;
  subjects: number;
  assigned_subjects: number;
  modules: number;
  marksheets: number;
  results: number;
  cadets_in_results: number;
  assessments: {
    olq: number;
    counseling: number;
    penpicture: number;
    warnings: number;
    medical: number;
  };
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  authorities: {
    results: AtwAuthority[];
    olq: AtwAuthority[];
    counseling: AtwAuthority[];
    penpicture: AtwAuthority[];
  };
}

const empty: AtwAdminStats = {
  courses: 0, subjects: 0, assigned_subjects: 0, modules: 0, marksheets: 0, results: 0, cadets_in_results: 0,
  assessments: { olq: 0, counseling: 0, penpicture: 0, warnings: 0, medical: 0 },
  approvals: { pending: 0, approved: 0, rejected: 0, total: 0 },
  authorities: { results: [], olq: [], counseling: [], penpicture: [] },
};

export const atwDashboardService = {
  async getAdminStats(): Promise<AtwAdminStats> {
    try {
      const token = getToken();
      const res = await apiClient.get<{ success: boolean; data: AtwAdminStats }>(
        '/atw-dashboard-stats', token
      );
      return res?.data ?? empty;
    } catch {
      return empty;
    }
  },
};
