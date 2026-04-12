import apiClient from '@/libs/auth/api-client';
import { getToken } from '@/libs/auth/auth-token';

export interface CtwCombinedViewShortAuthority {
  authority_id: number;
  authority_name: string;
  is_me: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'forwarded' | 'not_reached';
  sort: number;
  approved_count?: number;
}

export interface CtwCombinedViewShortRow {
  sl: number;
  course_id: number;
  course_name: string;
  semester_id: number;
  semester_name: string;
  program_id: number;
  program_name: string;
  changeable_program_name: string | null;
  university_name: string | null;
  departments: string[];
  subjects_total: number;
  subjects_approved: number;
  total_cadets?: number;
  authority_statuses: CtwCombinedViewShortAuthority[];
  my_authority_id: number | null;
}

export interface CtwCombinedViewShortData {
  rows: CtwCombinedViewShortRow[];
  authorities: {
    id: number;
    sort: number;
    is_final: boolean;
    is_active: boolean;
    is_only_engg: boolean;
    is_initial_forward: boolean;
    role: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
  }[];
}

export const ctwCombinedViewShortService = {
  async get(): Promise<CtwCombinedViewShortData> {
    try {
      const token = getToken();
      const res = await apiClient.get<{ success: boolean; data: CtwCombinedViewShortData }>(
        '/ctw-results/combined-view-short',
        token
      );
      return res?.data ?? { rows: [], authorities: [] };
    } catch {
      return { rows: [], authorities: [] };
    }
  },
};

export default ctwCombinedViewShortService;
